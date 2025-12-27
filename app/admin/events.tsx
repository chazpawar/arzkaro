import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import EmptyState from '../../src/components/ui/empty-state';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/Styles';
import { Fonts } from '../../src/constants/Fonts';
import * as AdminService from '../../src/services/admin-service';
import type { Event } from '../../src/types/event.types';

type TabType = 'experiences' | 'trips';

export default function EventsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('experiences');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Event[]>([]);
  const [_total, _setTotal] = useState(0); // Prefix with _ to indicate intentionally unused
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 20;

  // Map tab to EventType for API filtering if needed,
  // assuming your backend supports filtering by type (event, experience, trip).
  // The AdminService.getEventsForAdmin currently takes a 'status' param but you might
  // need to filter the results client-side if the API doesn't support 'type'.
  // Let's assume for now we filter client-side or the API will be updated.
  // Based on the provided AdminService, it returns everything.
  // We'll fetch all and filter client-side for this UI prototype if the API is limited,
  // BUT ideally the API should support type filtering.
  // Looking at AdminService.getEventsForAdmin, it doesn't seem to have a 'type' filter.
  // For this implementation, I will filter the results on the client side after fetching,
  // or just display them all if they aren't distinguishable by the API query.
  // However, the Event interface has a 'type' field: 'event' | 'experience' | 'trip'.

  const fetchItems = useCallback(
    async (reset = false) => {
      try {
        setError(null);
        setLoading(true);
        const currentPage = reset ? 1 : page;

        const result = await AdminService.getEventsForAdmin({
          page: currentPage,
          limit: LIMIT,
          status: 'all',
        });

        // Safely handle the result
        const allEvents = Array.isArray(result?.events) ? (result.events as Event[]) : [];

        const typeMap: Record<string, string> = {
          experiences: 'experience',
          trips: 'trip',
        };
        const filteredEvents = allEvents.filter((e) => e.type === typeMap[activeTab]);

        if (reset) {
          setItems(filteredEvents);
          setPage(1);
        } else {
          setItems((prev) => [...prev, ...filteredEvents]);
        }
        _setTotal(result?.total || 0);
      } catch (err) {
        console.error('Error fetching events:', err);
        // Just show empty state, don't show error UI
        if (reset) {
          setItems([]);
          _setTotal(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab] // Remove page from dependencies to prevent infinite loop
  );

  // Load data on component mount and when activeTab changes
  React.useEffect(() => {
    setLoading(true);
    setPage(1); // Reset page when tab changes
    fetchItems(true);
  }, [activeTab, fetchItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems(true);
    setRefreshing(false);
  };

  const loadMore = () => {
    // Don't load more if already loading, no items, or error state
    if (loadingMore || loading || items.length === 0) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);

    // Call API with next page
    AdminService.getEventsForAdmin({
      page: nextPage,
      limit: LIMIT,
      status: 'all',
    })
      .then((result) => {
        const allEvents = Array.isArray(result?.events) ? (result.events as Event[]) : [];
        const typeMap: Record<string, string> = {
          events: 'event',
          experiences: 'experience',
          trips: 'trip',
        };
        const filteredEvents = allEvents.filter((e) => e.type === typeMap[activeTab]);
        setItems((prev) => [...prev, ...filteredEvents]);
      })
      .catch((err) => {
        console.error('Error loading more:', err);
        // Silently fail - don't show error for pagination
      })
      .finally(() => {
        setLoadingMore(false);
      });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: Event }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Left Side: Image */}
        <View style={styles.imageContainer}>
          {item.cover_image_url ? (
            <Image source={{ uri: item.cover_image_url }} style={styles.cardImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={24} color={Colors.textTertiary} />
            </View>
          )}
          {/* Status Badge Overlay */}
          <View
            style={[
              styles.statusBadge,
              !item.is_published && styles.statusDraft,
              item.is_cancelled && styles.statusCancelled,
            ]}
          >
            <Text style={styles.statusText}>
              {item.is_cancelled ? 'Cancelled' : item.is_published ? 'Active' : 'Draft'}
            </Text>
          </View>
        </View>

        {/* Right Side: Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{formatDate(item.start_date)}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location_name || 'TBD'}
            </Text>
          </View>

          <View style={styles.hostRow}>
            {item.host?.avatar_url ? (
              <Image source={{ uri: item.host.avatar_url }} style={styles.hostAvatar} />
            ) : (
              <View style={styles.hostAvatarPlaceholder}>
                <Text style={styles.hostAvatarText}>{(item.host?.full_name || '?')[0]}</Text>
              </View>
            )}
            <Text style={styles.hostName} numberOfLines={1}>
              by {item.host?.full_name || 'Unknown'}
            </Text>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.priceText}>
              {item.price > 0 ? formatCurrency(item.price, item.currency) : 'Free'}
            </Text>
            <View style={styles.statsContainer}>
              <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.statsText}>
                {item.current_bookings}/{item.max_capacity || '∞'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Custom Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Events & Activities</Text>
            <Text style={styles.headerSubtitle}>Manage platform content</Text>
          </View>
          <View style={styles.headerActionPlaceholder} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {(['experiences', 'trips'] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content List */}
        {loading && items.length === 0 ? (
          <LoadingSpinner fullScreen text={`Loading ${activeTab}...`} />
        ) : error && items.length === 0 ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => fetchItems(true)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                title={`No ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Found`}
                message={`There are no ${activeTab} to display.`}
                emoji="📅"
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
          />
        )}
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
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  tabButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButtonActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  tabText: {
    ...Typography.caption,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textInverse,
  },
  listContent: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    height: 140, // Fixed height for consistency
  },
  imageContainer: {
    width: 110,
    backgroundColor: Colors.surfaceSecondary,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.9)', // Success Green
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDraft: {
    backgroundColor: 'rgba(100, 116, 139, 0.9)', // Secondary
  },
  statusCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)', // Error Red
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontFamily: Fonts.bold,
    textTransform: 'uppercase',
  },
  detailsContainer: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  itemTitle: {
    ...Typography.bodyMedium,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Spacing.sm,
    gap: 6,
  },
  hostAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
  },
  hostAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostAvatarText: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
  },
  hostName: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  priceText: {
    ...Typography.bodySmall,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
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
});
