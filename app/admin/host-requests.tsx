import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
  Alert,
  TextInput,
  Modal,
  StatusBar,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../src/components/ui/button';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import EmptyState from '../../src/components/ui/empty-state';
import BackButton from '../../src/components/ui/back-button';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/Styles';
import { Fonts } from '../../src/constants/Fonts';
import { useAuth } from '../../src/contexts/auth-context';
import * as AdminService from '../../src/services/admin-service';
import { HOST_TYPE_LABELS } from '../../src/services/host-service';
import type { HostRequestWithUser } from '../../src/types/host.types';
import { supabase } from '../../backend/supabase';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function HostRequestsPage() {
  const _router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<HostRequestWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<HostRequestWithUser | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [panImageUrl, setPanImageUrl] = useState<string | null>(null);
  const [gstImageUrl, setGstImageUrl] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);

  const LIMIT = 20;

  const fetchRequests = useCallback(
    async (reset = false) => {
      try {
        setError(null);
        const currentPage = reset ? 1 : page;

        const result = await AdminService.getHostRequests({
          status: statusFilter,
          page: currentPage,
          limit: LIMIT,
        });

        if (reset) {
          setRequests(result.requests as HostRequestWithUser[]);
          setPage(1);
        } else {
          setRequests((prev) => [...prev, ...(result.requests as HostRequestWithUser[])]);
        }
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load requests');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [page, statusFilter]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRequests(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests(true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (loadingMore || requests.length >= total) return;
    setLoadingMore(true);
    setPage((prev) => prev + 1);
    fetchRequests(false);
  };

  const handleApprove = async () => {
    if (!selectedRequest || !user?.id) return;

    setApproving(true);
    try {
      await AdminService.approveHostRequest(selectedRequest.id, user.id, adminNotes || undefined);

      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: 'approved' as const, admin_notes: adminNotes }
            : r
        )
      );

      setSelectedRequest(null);
      setAdminNotes('');
      Alert.alert('Success', 'Host request approved. User is now a host!');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !user?.id) return;

    if (!adminNotes.trim()) {
      Alert.alert('Required', 'Please provide a rejection reason');
      return;
    }

    setRejecting(true);
    try {
      // Use adminNotes as rejection_reason
      await AdminService.rejectHostRequest(selectedRequest.id, user.id, adminNotes, adminNotes);

      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? {
                ...r,
                status: 'rejected' as const,
                rejection_reason: adminNotes,
                admin_notes: adminNotes,
              }
            : r
        )
      );

      setSelectedRequest(null);
      setAdminNotes('');
      Alert.alert('Done', 'Host request rejected');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setRejecting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return { backgroundColor: Colors.successLight, color: Colors.success };
      case 'rejected':
        return { backgroundColor: Colors.errorLight, color: Colors.error };
      default:
        return { backgroundColor: Colors.warningLight, color: Colors.warning };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return formatDate(dateString);
  };

  // Fetch signed URLs for private documents
  const fetchDocumentUrls = async (request: HostRequestWithUser) => {
    setLoadingImages(true);
    setPanImageUrl(null);
    setGstImageUrl(null);

    try {
      // Extract path from public URL if needed
      const extractPath = (url: string) => {
        // If URL contains the bucket name, extract the path after it
        const bucketMatch = url.match(/host-documents\/(.+)$/);
        return bucketMatch ? bucketMatch[1] : url;
      };

      // Get signed URL for PAN card
      if (request.pan_card_photo_url) {
        const panPath = extractPath(request.pan_card_photo_url);
        const { data: panData, error: panError } = await supabase.storage
          .from('host-documents')
          .createSignedUrl(panPath, 3600); // 1 hour expiry

        if (panError) {
          console.error('Error fetching PAN signed URL:', panError);
        } else if (panData) {
          setPanImageUrl(panData.signedUrl);
        }
      }

      // Get signed URL for GST certificate
      if (request.gst_certificate_url) {
        const gstPath = extractPath(request.gst_certificate_url);
        const { data: gstData, error: gstError } = await supabase.storage
          .from('host-documents')
          .createSignedUrl(gstPath, 3600); // 1 hour expiry

        if (gstError) {
          console.error('Error fetching GST signed URL:', gstError);
        } else if (gstData) {
          setGstImageUrl(gstData.signedUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching document URLs:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  // Fetch document URLs when request is selected
  React.useEffect(() => {
    if (selectedRequest) {
      fetchDocumentUrls(selectedRequest);
    }
  }, [selectedRequest]);

  const renderRequestItem = ({ item }: { item: HostRequestWithUser }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <Pressable
        style={styles.requestCard}
        onPress={() => {
          setSelectedRequest(item);
          setAdminNotes(item.admin_notes || '');
        }}
      >
        <View style={styles.requestHeader}>
          <View style={styles.userInfo}>
            {item.user?.avatar_url ? (
              <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(item.user?.full_name || item.user?.email || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{item.user?.full_name || 'Unknown User'}</Text>
                <View
                  style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}
                >
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.userEmail}>{item.user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Host Type Badge */}
        <View style={styles.hostTypeContainer}>
          <View style={styles.hostTypeBadge}>
            <Text style={styles.hostTypeText}>
              {item.requested_host_type ? HOST_TYPE_LABELS[item.requested_host_type] : 'Host'}
            </Text>
          </View>
          {item.organizer_name && (
            <Text style={styles.organizerName} numberOfLines={1}>
              {item.organizer_name}
            </Text>
          )}
        </View>

        <View style={styles.requestFooter}>
          <Text style={styles.dateText}>Applied {formatTimeAgo(item.created_at)}</Text>
          {item.status === 'pending' && <Text style={styles.tapText}>Review →</Text>}
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Status Filter */}
      <View style={styles.filterWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['pending', 'approved', 'rejected', 'all'] as StatusFilter[]}
          contentContainerStyle={styles.filterContainer}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterButton, statusFilter === item && styles.filterButtonActive]}
              onPress={() => setStatusFilter(item)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === item && styles.filterButtonTextActive,
                ]}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Results Count */}
      <Text style={styles.resultsCount}>
        {total} request{total !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  if (loading && requests.length === 0) {
    return <LoadingSpinner fullScreen text="Loading host requests..." />;
  }

  if (error && requests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton variant="minimal" />
          <Text style={styles.headerTitle}>Host Requests</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => fetchRequests(true)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Custom Header */}
        <View style={styles.header}>
          <BackButton variant="minimal" />
          <Text style={styles.headerTitle}>Host Requests</Text>
          <View style={styles.headerActionPlaceholder} />
        </View>

        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <EmptyState
              title={
                statusFilter === 'pending'
                  ? 'No Pending Requests'
                  : `No ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests`
              }
              message={
                statusFilter === 'pending'
                  ? 'All host requests have been reviewed.'
                  : `No ${statusFilter} host requests at the moment.`
              }
              emoji="📝"
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <LoadingSpinner size="small" />
              </View>
            ) : (
              <View style={{ height: Spacing.xl }} />
            )
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Review Modal */}
        <Modal
          visible={!!selectedRequest}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setSelectedRequest(null);
            setAdminNotes('');
          }}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Application Details</Text>
              <Pressable
                onPress={() => {
                  setSelectedRequest(null);
                  setAdminNotes('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            {selectedRequest && (
              <ScrollView
                style={styles.modalContent}
                contentContainerStyle={styles.modalContentContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Applicant Info */}
                <View style={styles.applicantSection}>
                  {selectedRequest.user?.avatar_url ? (
                    <Image
                      source={{ uri: selectedRequest.user.avatar_url }}
                      style={styles.modalAvatar}
                    />
                  ) : (
                    <View style={styles.modalAvatarPlaceholder}>
                      <Text style={styles.modalAvatarText}>
                        {(selectedRequest.user?.full_name || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.applicantName}>
                    {selectedRequest.user?.full_name || 'Unknown User'}
                  </Text>
                  <Text style={styles.applicantEmail}>{selectedRequest.user?.email}</Text>
                  <View style={styles.statusChip}>
                    <Text style={styles.statusChipText}>{selectedRequest.status}</Text>
                  </View>
                </View>

                {/* Info Groups */}
                <View style={styles.infoGroup}>
                  <Text style={styles.groupTitle}>Host Details</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type</Text>
                    <Text style={styles.infoValue}>
                      {selectedRequest.requested_host_type
                        ? HOST_TYPE_LABELS[selectedRequest.requested_host_type]
                        : 'Host'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Organizer</Text>
                    <Text style={styles.infoValue}>{selectedRequest.organizer_name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Contact</Text>
                    <Text style={styles.infoValue}>{selectedRequest.contact_number}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{selectedRequest.email}</Text>
                  </View>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.groupTitle}>Address</Text>
                  <Text style={styles.addressText}>
                    {selectedRequest.street_address}
                    {'\n'}
                    {selectedRequest.city}, {selectedRequest.state}
                    {'\n'}
                    {selectedRequest.pin_code}
                  </Text>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.groupTitle}>KYC & Bank</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>PAN</Text>
                    <Text style={styles.infoValueMono}>{selectedRequest.pan_number}</Text>
                  </View>
                  {selectedRequest.gstin && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>GSTIN</Text>
                      <Text style={styles.infoValueMono}>{selectedRequest.gstin}</Text>
                    </View>
                  )}
                  <View style={styles.separator} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Account Holder</Text>
                    <Text style={styles.infoValue}>{selectedRequest.account_holder_name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Beneficiary</Text>
                    <Text style={styles.infoValue}>{selectedRequest.beneficiary_name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Bank Acc.</Text>
                    <Text style={styles.infoValueMono}>{selectedRequest.account_number}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>IFSC</Text>
                    <Text style={styles.infoValueMono}>{selectedRequest.ifsc_code}</Text>
                  </View>
                </View>

                {/* Documents Section */}
                <View style={styles.infoGroup}>
                  <Text style={styles.groupTitle}>Verification Documents</Text>

                  {/* Check if document fields exist (new schema) */}
                  {selectedRequest.pan_card_photo_url ? (
                    <>
                      {/* PAN Card Document */}
                      <View style={styles.documentSection}>
                        <View style={styles.documentLabelRow}>
                          <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                          <Text style={styles.documentLabel}>PAN Card Photo</Text>
                        </View>
                        <Pressable
                          style={styles.documentImageContainer}
                          onPress={async () => {
                            // Open URL in browser for full view
                            if (panImageUrl) {
                              try {
                                const canOpen = await Linking.canOpenURL(panImageUrl);
                                if (canOpen) {
                                  await Linking.openURL(panImageUrl);
                                } else {
                                  Alert.alert(
                                    'Error',
                                    'Cannot open this URL. Please check the link is valid.'
                                  );
                                }
                              } catch (error) {
                                Alert.alert('Error', 'Failed to open document');
                                console.error('Error opening URL:', error);
                              }
                            }
                          }}
                        >
                          {loadingImages ? (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator size="large" color={Colors.primary} />
                              <Text style={styles.loadingText}>Loading document...</Text>
                            </View>
                          ) : panImageUrl ? (
                            <>
                              <Image
                                source={{ uri: panImageUrl }}
                                style={styles.documentImage}
                                resizeMode="cover"
                                onError={(error) => {
                                  console.error('PAN Card Image Error:', error.nativeEvent.error);
                                  console.log('PAN Card URL:', panImageUrl);
                                }}
                              />
                              <View style={styles.documentOverlay}>
                                <Ionicons
                                  name="expand-outline"
                                  size={20}
                                  color={Colors.textInverse}
                                />
                                <Text style={styles.documentOverlayText}>
                                  Tap to view full size
                                </Text>
                              </View>
                            </>
                          ) : (
                            <View style={styles.loadingContainer}>
                              <Ionicons
                                name="alert-circle-outline"
                                size={40}
                                color={Colors.textSecondary}
                              />
                              <Text style={styles.loadingText}>Failed to load document</Text>
                            </View>
                          )}
                        </Pressable>
                      </View>

                      {/* GST Certificate Document (if provided) */}
                      {selectedRequest.gst_certificate_url && (
                        <View style={styles.documentSection}>
                          <View style={styles.documentLabelRow}>
                            <Ionicons
                              name="document-text-outline"
                              size={20}
                              color={Colors.primary}
                            />
                            <Text style={styles.documentLabel}>GST Certificate</Text>
                          </View>
                          <Pressable
                            style={styles.documentImageContainer}
                            onPress={async () => {
                              if (gstImageUrl) {
                                try {
                                  const canOpen = await Linking.canOpenURL(gstImageUrl);
                                  if (canOpen) {
                                    await Linking.openURL(gstImageUrl);
                                  } else {
                                    Alert.alert(
                                      'Error',
                                      'Cannot open this URL. Please check the link is valid.'
                                    );
                                  }
                                } catch (error) {
                                  Alert.alert('Error', 'Failed to open document');
                                  console.error('Error opening GST URL:', error);
                                }
                              }
                            }}
                          >
                            {loadingImages ? (
                              <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                                <Text style={styles.loadingText}>Loading document...</Text>
                              </View>
                            ) : gstImageUrl ? (
                              <>
                                <Image
                                  source={{ uri: gstImageUrl }}
                                  style={styles.documentImage}
                                  resizeMode="cover"
                                  onError={(error) => {
                                    console.error(
                                      'GST Certificate Image Error:',
                                      error.nativeEvent.error
                                    );
                                    console.log('GST Certificate URL:', gstImageUrl);
                                  }}
                                />
                                <View style={styles.documentOverlay}>
                                  <Ionicons
                                    name="expand-outline"
                                    size={20}
                                    color={Colors.textInverse}
                                  />
                                  <Text style={styles.documentOverlayText}>
                                    Tap to view full size
                                  </Text>
                                </View>
                              </>
                            ) : (
                              <View style={styles.loadingContainer}>
                                <Ionicons
                                  name="alert-circle-outline"
                                  size={40}
                                  color={Colors.textSecondary}
                                />
                                <Text style={styles.loadingText}>Failed to load document</Text>
                              </View>
                            )}
                          </Pressable>
                        </View>
                      )}
                      {!selectedRequest.gst_certificate_url &&
                        selectedRequest.requested_host_type === 'full' && (
                          <View style={styles.documentNote}>
                            <Ionicons
                              name="information-circle-outline"
                              size={16}
                              color={Colors.textSecondary}
                            />
                            <Text style={styles.documentNoteText}>No GST certificate provided</Text>
                          </View>
                        )}
                    </>
                  ) : (
                    <>
                      {/* Warning: Old schema or missing documents */}
                      <View style={styles.warningBox}>
                        <Ionicons name="warning-outline" size={24} color={Colors.warning} />
                        <View style={styles.warningContent}>
                          <Text style={styles.warningTitle}>Documents Not Available</Text>
                          <Text style={styles.warningText}>
                            This host request was created with the old application system. Document
                            URLs (PAN card photo, GST certificate) are not available.
                          </Text>
                          <Text style={styles.warningHint}>
                            To fix: Apply database migration 021_update_host_documents_to_upload.sql
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>

                {/* Admin Notes / Rejection Reason */}
                <View style={styles.notesSection}>
                  <Text style={styles.groupTitle}>
                    {selectedRequest.status === 'pending' ? 'Admin Action' : 'Notes'}
                  </Text>

                  {selectedRequest.status === 'rejected' && (
                    <View style={styles.rejectionBox}>
                      <Text style={styles.rejectionTitle}>Rejection Reason:</Text>
                      <Text style={styles.rejectionText}>{selectedRequest.rejection_reason}</Text>
                    </View>
                  )}

                  <TextInput
                    style={styles.notesInput}
                    placeholder={
                      selectedRequest.status === 'pending'
                        ? 'Add notes (required for rejection)...'
                        : 'No additional notes.'
                    }
                    placeholderTextColor={Colors.textTertiary}
                    value={adminNotes}
                    onChangeText={setAdminNotes}
                    multiline
                    numberOfLines={4}
                    editable={selectedRequest.status === 'pending'}
                  />
                </View>

                {/* Action Buttons */}
                {selectedRequest.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <Button
                      title="Reject"
                      onPress={handleReject}
                      variant="outline"
                      loading={rejecting}
                      disabled={rejecting || approving}
                      style={styles.rejectButton}
                      textStyle={{ color: Colors.error }}
                    />
                    <Button
                      title="Approve"
                      onPress={handleApprove}
                      variant="primary"
                      loading={approving}
                      disabled={rejecting || approving}
                      style={styles.approveButton}
                    />
                  </View>
                )}
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.bodyLarge,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  headerActionPlaceholder: {
    width: 32,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    paddingVertical: Spacing.md,
  },
  filterWrapper: {
    marginBottom: Spacing.md,
  },
  filterContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  filterButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
  },
  filterButtonTextActive: {
    color: Colors.textInverse,
  },
  resultsCount: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  requestCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.h3,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  userDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  userEmail: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  statusText: {
    ...Typography.caption,
    fontFamily: Fonts.bold,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  hostTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  hostTypeBadge: {
    backgroundColor: Colors.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  hostTypeText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
  },
  organizerName: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  tapText: {
    ...Typography.caption,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  loadingMore: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  applicantSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
  },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalAvatarText: {
    fontSize: 32,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  applicantName: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 4,
  },
  applicantEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  statusChip: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  statusChipText: {
    ...Typography.caption,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
  },
  infoGroup: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  groupTitle: {
    ...Typography.bodySmall,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.text,
    flex: 1.5,
    textAlign: 'right',
  },
  infoValueMono: {
    ...Typography.body,
    fontFamily: 'monospace',
    color: Colors.text,
    flex: 1.5,
    textAlign: 'right',
  },
  addressText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  notesSection: {
    marginBottom: Spacing.xl,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  rejectionBox: {
    backgroundColor: Colors.error + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  rejectionTitle: {
    ...Typography.bodySmall,
    fontFamily: Fonts.bold,
    color: Colors.error,
    marginBottom: 4,
  },
  rejectionText: {
    ...Typography.body,
    color: Colors.error,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  rejectButton: {
    flex: 1,
    borderColor: Colors.error,
  },
  approveButton: {
    flex: 1,
    backgroundColor: Colors.success,
  },

  // Document Styles
  documentSection: {
    marginBottom: Spacing.lg,
  },
  documentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  documentLabel: {
    ...Typography.bodyMedium,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  documentImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
    position: 'relative',
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  documentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  documentOverlayText: {
    ...Typography.caption,
    color: Colors.textInverse,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  documentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  documentNoteText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  warningBox: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
    gap: Spacing.md,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    ...Typography.bodySmall,
    fontFamily: Fonts.bold,
    color: Colors.warning,
    marginBottom: 4,
  },
  warningText: {
    ...Typography.caption,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  warningHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 11,
  },
});
