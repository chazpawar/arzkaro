import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../src/components/ui/card';
import Button from '../../src/components/ui/button';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { Colors } from '../../src/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/styles';
import { useAuth } from '../../src/contexts/auth-context';
import * as AdminService from '../../src/services/admin-service';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

interface HostRequestWithUser {
  id: string;
  user_id: string;
  reason: string;
  business_name: string | null;
  business_type: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    username: string | null;
    created_at: string;
  };
}

export default function HostRequestsPage() {
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
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

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

    setActionLoading(true);
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
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !user?.id) return;

    if (!adminNotes.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      await AdminService.rejectHostRequest(selectedRequest.id, user.id, adminNotes);

      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: 'rejected' as const, admin_notes: adminNotes }
            : r
        )
      );

      setSelectedRequest(null);
      setAdminNotes('');
      Alert.alert('Done', 'Host request rejected');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setActionLoading(false);
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

  const renderRequestItem = ({ item }: { item: HostRequestWithUser }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <Card
        style={styles.requestCard}
        variant="outlined"
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
              <Text style={styles.userName}>{item.user?.full_name || 'Unknown User'}</Text>
              <Text style={styles.userEmail}>{item.user?.email}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
          </View>
        </View>

        {item.business_name && (
          <View style={styles.businessInfo}>
            <Text style={styles.businessLabel}>Business</Text>
            <Text style={styles.businessValue}>
              {item.business_name}
              {item.business_type ? ` (${item.business_type})` : ''}
            </Text>
          </View>
        )}

        <View style={styles.reasonSection}>
          <Text style={styles.reasonLabel}>Reason for Application</Text>
          <Text style={styles.reasonText} numberOfLines={3}>
            {item.reason}
          </Text>
        </View>

        <View style={styles.requestFooter}>
          <Text style={styles.dateText}>Applied {formatTimeAgo(item.created_at)}</Text>
          {item.status === 'pending' && <Text style={styles.tapText}>Tap to review →</Text>}
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <>
      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {(['pending', 'approved', 'rejected', 'all'] as StatusFilter[]).map((filter) => (
          <Pressable
            key={filter}
            style={[styles.filterButton, statusFilter === filter && styles.filterButtonActive]}
            onPress={() => setStatusFilter(filter)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === filter && styles.filterButtonTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Results Count */}
      <Text style={styles.resultsCount}>
        {total} request{total !== 1 ? 's' : ''} found
      </Text>
    </>
  );

  if (loading && requests.length === 0) {
    return <LoadingSpinner fullScreen text="Loading host requests..." />;
  }

  if (error && requests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>
              {statusFilter === 'pending'
                ? 'No pending requests'
                : `No ${statusFilter} requests found`}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <LoadingSpinner size="small" />
            </View>
          ) : null
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
            <Text style={styles.modalTitle}>Review Application</Text>
            <Pressable
              onPress={() => {
                setSelectedRequest(null);
                setAdminNotes('');
              }}
            >
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
          </View>

          {selectedRequest && (
            <View style={styles.modalContent}>
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
                {selectedRequest.user?.created_at && (
                  <Text style={styles.applicantJoined}>
                    Member since {formatDate(selectedRequest.user.created_at)}
                  </Text>
                )}
              </View>

              {/* Business Info */}
              {selectedRequest.business_name && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Business Information</Text>
                  <Text style={styles.modalSectionText}>
                    {selectedRequest.business_name}
                    {selectedRequest.business_type ? ` (${selectedRequest.business_type})` : ''}
                  </Text>
                </View>
              )}

              {/* Reason */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Reason for Application</Text>
                <Text style={styles.modalSectionText}>{selectedRequest.reason}</Text>
              </View>

              {/* Admin Notes */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  Admin Notes{' '}
                  {selectedRequest.status === 'pending' ? '(optional for approval)' : ''}
                </Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add notes about this application..."
                  placeholderTextColor={Colors.textSecondary}
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
                    loading={actionLoading}
                    disabled={actionLoading}
                    style={styles.rejectButton}
                  />
                  <Button
                    title="Approve"
                    onPress={handleApprove}
                    variant="primary"
                    loading={actionLoading}
                    disabled={actionLoading}
                    style={styles.approveButton}
                  />
                </View>
              )}

              {selectedRequest.status !== 'pending' && (
                <View style={styles.reviewedInfo}>
                  <Text style={styles.reviewedText}>
                    {selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'}
                    {selectedRequest.reviewed_at
                      ? ` on ${formatDate(selectedRequest.reviewed_at)}`
                      : ''}
                  </Text>
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  resultsCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  requestCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
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
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.h3,
    color: Colors.primary,
  },
  userDetails: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  userName: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  userEmail: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  businessInfo: {
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
  },
  businessLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  businessValue: {
    ...Typography.bodySmall,
    color: Colors.text,
  },
  reasonSection: {
    marginBottom: Spacing.sm,
  },
  reasonLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  reasonText: {
    ...Typography.body,
    color: Colors.text,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  tapText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.textInverse,
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
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  modalClose: {
    ...Typography.bodyMedium,
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  applicantSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.md,
  },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalAvatarText: {
    fontSize: 32,
    color: Colors.primary,
    fontWeight: '600',
  },
  applicantName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  applicantEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  applicantJoined: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  modalSection: {
    marginBottom: Spacing.lg,
  },
  modalSectionTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  modalSectionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 'auto',
    paddingTop: Spacing.lg,
  },
  rejectButton: {
    flex: 1,
    borderColor: Colors.error,
  },
  approveButton: {
    flex: 1,
    backgroundColor: Colors.success,
  },
  reviewedInfo: {
    marginTop: 'auto',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  reviewedText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
