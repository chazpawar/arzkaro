import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import {
  getAllPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
  markPayoutProcessing,
  markPayoutCompleted,
  getPayoutStatistics,
} from '../../services/payout-service';
import { PayoutRequest } from '../../types/payout.types';

interface AdminPayoutRequestsProps {
  adminId: string;
}

export default function AdminPayoutRequests({ adminId }: AdminPayoutRequestsProps) {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [requestsData, statsData] = await Promise.all([
        getAllPayoutRequests(filter === 'all' ? undefined : filter),
        getPayoutStatistics(),
      ]);
      setRequests(requestsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading payout requests:', error);
      Alert.alert('Error', 'Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleApprove = (request: PayoutRequest) => {
    setSelectedRequest(request);
    setAdminNote('');
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await approvePayoutRequest(selectedRequest.id, adminId, {
        admin_note: adminNote || undefined,
      });
      Alert.alert('Success', 'Payout request approved successfully');
      setShowApproveModal(false);
      setSelectedRequest(null);
      setAdminNote('');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve payout request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = (request: PayoutRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setAdminNote('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      await rejectPayoutRequest(selectedRequest.id, adminId, {
        rejection_reason: rejectionReason,
        admin_note: adminNote || undefined,
      });
      Alert.alert('Success', 'Payout request rejected');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      setAdminNote('');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject payout request');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkProcessing = async (request: PayoutRequest) => {
    Alert.alert('Mark as Processing', 'This will indicate that the payout is being processed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await markPayoutProcessing(request.id);
            Alert.alert('Success', 'Marked as processing');
            await loadData();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update status');
          }
        },
      },
    ]);
  };

  const handleMarkCompleted = async (request: PayoutRequest) => {
    Alert.alert('Mark as Completed', 'Confirm that the payout has been successfully transferred.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await markPayoutCompleted(request.id);
            Alert.alert('Success', 'Marked as completed');
            await loadData();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update status');
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
      {/* Statistics Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Payout Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={[styles.statAmount, { color: '#FFA500' }]}>
                  ₹{stats.pending.amount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statCount}>{stats.pending.count} requests</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statAmount, { color: '#4CAF50' }]}>
                  ₹{stats.approved.amount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.statLabel}>Approved</Text>
                <Text style={styles.statCount}>{stats.approved.count} requests</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={[styles.statAmount, { color: '#2196F3' }]}>
                  ₹{stats.processing.amount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.statLabel}>Processing</Text>
                <Text style={styles.statCount}>{stats.processing.count} requests</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statAmount, { color: '#8BC34A' }]}>
                  ₹{stats.completed.amount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statCount}>{stats.completed.count} requests</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'pending', 'approved', 'processing', 'completed', 'rejected'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterTab, filter === status && styles.filterTabActive]}
              onPress={() => setFilter(status)}
            >
              <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Requests List */}
      <View style={styles.requestsList}>
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={60} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No payout requests</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' ? 'No requests yet' : `No ${filter} requests`}
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              {/* Header with Status and Amount */}
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

              <View style={styles.divider} />

              {/* Host Info */}
              <View style={styles.hostInfoSection}>
                <Text style={styles.sectionLabel}>Host Details</Text>
                <View style={styles.hostInfo}>
                  <View style={styles.hostAvatar}>
                    <Ionicons name="person-outline" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.hostDetails}>
                    <Text style={styles.hostName}>{request.host?.full_name || 'Unknown Host'}</Text>
                    <Text style={styles.hostEmail}>{request.host?.email}</Text>
                    {request.host?.phone && (
                      <Text style={styles.hostPhone}>📱 {request.host.phone}</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Bank Details */}
              {request.bank_details && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.bankDetailsSection}>
                    <Text style={styles.sectionLabel}>Bank Details</Text>
                    <View style={styles.bankDetails}>
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankLabel}>Account Holder:</Text>
                        <Text style={styles.bankValue}>
                          {request.bank_details.account_holder_name}
                        </Text>
                      </View>
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankLabel}>Beneficiary:</Text>
                        <Text style={styles.bankValue}>
                          {request.bank_details.beneficiary_name}
                        </Text>
                      </View>
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankLabel}>Account Number:</Text>
                        <Text style={styles.bankValue}>{request.bank_details.account_number}</Text>
                      </View>
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankLabel}>IFSC Code:</Text>
                        <Text style={styles.bankValue}>{request.bank_details.ifsc_code}</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}

              {/* Notes */}
              {request.request_note && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteLabel}>Host Note:</Text>
                    <Text style={styles.noteText}>{request.request_note}</Text>
                  </View>
                </>
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

              <View style={styles.divider} />

              {/* Request Details */}
              <View style={styles.requestDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Requested on:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(request.created_at).toLocaleDateString('en-IN')}
                  </Text>
                </View>
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

              {/* Actions */}
              {request.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(request)}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(request)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              )}

              {request.status === 'approved' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.processingButton, styles.fullWidthButton]}
                  onPress={() => handleMarkProcessing(request)}
                >
                  <Ionicons name="sync-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Mark Processing</Text>
                </TouchableOpacity>
              )}

              {request.status === 'processing' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.completedButton, styles.fullWidthButton]}
                  onPress={() => handleMarkCompleted(request)}
                >
                  <Ionicons name="checkmark-done-circle-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Mark Completed</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>

      {/* Approve Modal */}
      <Modal
        visible={showApproveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowApproveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Approve Payout Request</Text>
            <Text style={styles.modalSubtitle}>
              Amount: ₹{selectedRequest?.requested_amount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.modalSubtitle}>Host: {selectedRequest?.host?.full_name}</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Admin Note (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a note..."
                multiline
                numberOfLines={3}
                value={adminNote}
                onChangeText={setAdminNote}
                editable={!processing}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowApproveModal(false)}
                disabled={processing}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmApprove}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Approve</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Payout Request</Text>
            <Text style={styles.modalSubtitle}>
              Amount: ₹{selectedRequest?.requested_amount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.modalSubtitle}>Host: {selectedRequest?.host?.full_name}</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Rejection Reason *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Explain why this request is being rejected..."
                multiline
                numberOfLines={3}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                editable={!processing}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Admin Note (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add additional notes..."
                multiline
                numberOfLines={3}
                value={adminNote}
                onChangeText={setAdminNote}
                editable={!processing}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowRejectModal(false)}
                disabled={processing}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalRejectButton]}
                onPress={confirmReject}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statsContainer: {
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
  statsTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: 16,
    color: Colors.text,
  },
  statsGrid: {
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  statAmount: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  statCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  filterTextActive: {
    color: '#fff',
  },
  requestsList: {
    padding: 16,
    paddingTop: 0,
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
  },
  requestCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.textTertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hostInfoSection: {
    marginBottom: 12,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  hostEmail: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  hostPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bankDetailsSection: {
    marginBottom: 12,
  },
  bankDetails: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bankLabel: {
    fontSize: 13,
    color: '#1565C0',
  },
  bankValue: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: '#0D47A1',
  },
  noteContainer: {
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#F57F17',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: '#F57F17',
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  fullWidthButton: {
    flex: undefined,
    width: '100%',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  processingButton: {
    backgroundColor: '#2196F3',
  },
  completedButton: {
    backgroundColor: '#8BC34A',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  inputContainer: {
    marginTop: 16,
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
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f5',
  },
  modalCancelText: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  modalConfirmButton: {
    backgroundColor: '#4CAF50',
  },
  modalRejectButton: {
    backgroundColor: '#F44336',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});
