import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import {
  getHostEarnings,
  getHostPayoutRequests,
  createPayoutRequest,
} from '../../services/payout-service';
import { HostEarnings, PayoutRequest } from '../../types/payout.types';

interface HostPayoutRequestsProps {
  hostId: string;
}

export default function HostPayoutRequests({ hostId }: HostPayoutRequestsProps) {
  const [earnings, setEarnings] = useState<HostEarnings | null>(null);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [earningsData, requestsData] = await Promise.all([
        getHostEarnings(hostId),
        getHostPayoutRequests(hostId),
      ]);
      setEarnings(earningsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading payout data:', error);
      Alert.alert('Error', 'Failed to load payout data');
    } finally {
      setLoading(false);
    }
  }, [hostId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSubmitRequest = async () => {
    if (!requestAmount || parseFloat(requestAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    const amount = parseFloat(requestAmount);

    if (earnings && amount > earnings.available_for_withdrawal) {
      Alert.alert(
        'Insufficient Balance',
        `You can only request up to ₹${earnings.available_for_withdrawal.toLocaleString('en-IN')}`
      );
      return;
    }

    Alert.alert('Confirm Request', `Request payout of ₹${amount.toLocaleString('en-IN')}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setSubmitting(true);
            await createPayoutRequest(hostId, {
              requested_amount: amount,
              request_note: requestNote || undefined,
            });
            Alert.alert('Success', 'Payout request submitted successfully');
            setShowRequestForm(false);
            setRequestAmount('');
            setRequestNote('');
            await loadData();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit payout request');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'approved':
        return '#4CAF50';
      case 'processing':
        return '#2196F3';
      case 'completed':
        return '#8BC34A';
      case 'rejected':
        return '#F44336';
      default:
        return Colors.text;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'approved':
        return 'checkmark-circle-outline';
      case 'processing':
        return 'sync-outline';
      case 'completed':
        return 'checkmark-done-circle-outline';
      case 'rejected':
        return 'close-circle-outline';
      default:
        return 'help-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Earnings Summary Card */}
      <View style={styles.earningsCard}>
        <Text style={styles.cardTitle}>Your Earnings</Text>

        <View style={styles.earningsRow}>
          <View style={styles.earningItem}>
            <Text style={styles.earningLabel}>Total Earnings</Text>
            <Text style={styles.earningAmount}>
              ₹{earnings?.total_earnings.toLocaleString('en-IN') || '0'}
            </Text>
          </View>

          <View style={styles.earningItem}>
            <Text style={styles.earningLabel}>Pending Payouts</Text>
            <Text style={[styles.earningAmount, { color: '#FFA500' }]}>
              ₹{earnings?.pending_payouts.toLocaleString('en-IN') || '0'}
            </Text>
          </View>
        </View>

        <View style={styles.earningsRow}>
          <View style={styles.earningItem}>
            <Text style={styles.earningLabel}>Completed Payouts</Text>
            <Text style={[styles.earningAmount, { color: '#8BC34A' }]}>
              ₹{earnings?.completed_payouts.toLocaleString('en-IN') || '0'}
            </Text>
          </View>

          <View style={styles.earningItem}>
            <Text style={styles.earningLabel}>Available Balance</Text>
            <Text style={[styles.earningAmount, { color: Colors.primary }]}>
              ₹{earnings?.available_for_withdrawal.toLocaleString('en-IN') || '0'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="ticket-outline" size={20} color={Colors.primary} />
            <Text style={styles.statText}>{earnings?.total_bookings || 0} Bookings</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            <Text style={styles.statText}>{earnings?.completed_events || 0} Events</Text>
          </View>
        </View>

        {earnings && earnings.available_for_withdrawal > 0 && !showRequestForm && (
          <TouchableOpacity style={styles.requestButton} onPress={() => setShowRequestForm(true)}>
            <Ionicons name="cash-outline" size={20} color="#fff" />
            <Text style={styles.requestButtonText}>Request Payout</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Request Form */}
      {showRequestForm && (
        <View style={styles.requestForm}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>New Payout Request</Text>
            <TouchableOpacity onPress={() => setShowRequestForm(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={requestAmount}
              onChangeText={setRequestAmount}
              editable={!submitting}
            />
            <Text style={styles.inputHint}>
              Max: ₹{earnings?.available_for_withdrawal.toLocaleString('en-IN') || '0'}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a note for the admin..."
              multiline
              numberOfLines={3}
              value={requestNote}
              onChangeText={setRequestNote}
              editable={!submitting}
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.formButton, styles.cancelButton]}
              onPress={() => setShowRequestForm(false)}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, styles.submitButton]}
              onPress={handleSubmitRequest}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Payout Requests List */}
      <View style={styles.requestsSection}>
        <Text style={styles.sectionTitle}>Payout Requests</Text>

        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={60} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No payout requests yet</Text>
            <Text style={styles.emptySubtext}>
              Request a payout when you have available earnings
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.requestStatus}>
                  <Ionicons
                    name={getStatusIcon(request.status) as any}
                    size={24}
                    color={getStatusColor(request.status)}
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Text>
                </View>
                <Text style={styles.requestAmount}>
                  ₹{request.requested_amount.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.requestDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Requested on:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(request.created_at).toLocaleDateString('en-IN')}
                  </Text>
                </View>

                {request.request_note && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Your note:</Text>
                    <Text style={styles.detailValue}>{request.request_note}</Text>
                  </View>
                )}

                {request.admin_note && (
                  <View style={styles.adminNoteContainer}>
                    <Text style={styles.adminNoteLabel}>Admin Note:</Text>
                    <Text style={styles.adminNoteText}>{request.admin_note}</Text>
                  </View>
                )}

                {request.rejection_reason && (
                  <View style={styles.rejectionContainer}>
                    <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                    <Text style={styles.rejectionText}>{request.rejection_reason}</Text>
                  </View>
                )}

                {request.approved_at && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      {request.status === 'rejected' ? 'Rejected on:' : 'Approved on:'}
                    </Text>
                    <Text style={styles.detailValue}>
                      {new Date(request.approved_at).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: 16,
    color: Colors.text,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  earningItem: {
    flex: 1,
  },
  earningLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  earningAmount: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  availableBalance: {
    alignItems: 'center',
    marginBottom: 16,
  },
  availableLabel: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginBottom: 8,
  },
  availableAmount: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    color: Colors.text,
  },
  requestButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  requestForm: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: 8,
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  requestsSection: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: 12,
    color: Colors.text,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginTop: 16,
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  requestAmount: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  requestDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  adminNoteContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  adminNoteLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#1976D2',
    marginBottom: 4,
  },
  adminNoteText: {
    fontSize: 14,
    color: '#1565C0',
  },
  rejectionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  rejectionLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#C62828',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#D32F2F',
  },
});
