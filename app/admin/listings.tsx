import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, Pressable, Image, FlatList } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import EmptyState from '../../src/components/ui/empty-state';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/Styles';
import { Fonts } from '../../src/constants/Fonts';
import * as AdminService from '../../src/services/admin-service';

type TabType = 'experiences' | 'trips';

interface Listing {
  id: string;
  title: string;
  type: string;
  description: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  location_name: string | null;
  location_address: string | null;
  departure_location: string | null;
  start_date: string;
  end_date: string;
  price: number;
  currency: string;
  max_capacity: number | null;
  current_bookings: number;
  is_published: boolean;
  is_cancelled: boolean;
  category: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  host: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

export default function AdminListingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('experiences');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchListings = useCallback(
    async (refresh = false) => {
      try {
        setError(null);
        const currentPage = refresh ? 1 : page;
        const { listings: newListings, total: newTotal } = await AdminService.getListings({
          type: activeTab === 'experiences' ? 'experience' : 'trip',
          page: currentPage,
          limit: 20,
          status: 'all',
        });

        if (refresh) {
          setListings(newListings);
          setPage(1);
        } else {
          setListings((prev) => [...prev, ...newListings]);
        }

        setTotal(newTotal);
        setHasMore(newListings.length === 20);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load listings');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, page]
  );

  React.useEffect(() => {
    setLoading(true);
    setListings([]);
    setPage(1);
    fetchListings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
      fetchListings();
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return `${currency === 'INR' ? '₹' : '$'}${price.toLocaleString('en-IN')}`;
  };

  const getStatusBadgeColor = (listing: Listing) => {
    if (listing.is_cancelled) return Colors.error;
    if (!listing.is_published) return Colors.warning;
    return Colors.success;
  };

  const getStatusText = (listing: Listing) => {
    if (listing.is_cancelled) return 'Cancelled';
    if (!listing.is_published) return 'Draft';
    return 'Published';
  };

  const renderListingCard = ({ item }: { item: Listing }) => (
    <View style={styles.listingCard}>
      {/* Cover Image */}
      <View style={styles.imageContainer}>
        {item.cover_image_url ? (
          <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color={Colors.textTertiary} />
          </View>
        )}
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(item) }]}>
          <Text style={styles.statusBadgeText}>{getStatusText(item)}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Title & Category */}
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>

        {/* Host Info */}
        <View style={styles.hostRow}>
          {item.host?.avatar_url ? (
            <Image source={{ uri: item.host.avatar_url }} style={styles.hostAvatar} />
          ) : (
            <View style={styles.hostAvatarPlaceholder}>
              <Text style={styles.hostAvatarText}>
                {item.host?.full_name?.charAt(0).toUpperCase() || 'H'}
              </Text>
            </View>
          )}
          <View style={styles.hostInfo}>
            <Text style={styles.hostLabel}>Hosted by</Text>
            <Text style={styles.hostName} numberOfLines={1}>
              {item.host?.full_name || 'Unknown Host'}
            </Text>
            <Text style={styles.hostEmail} numberOfLines={1}>
              {item.host?.email || ''}
            </Text>
          </View>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {/* Location */}
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {activeTab === 'trips'
                ? item.departure_location || item.location_name || 'N/A'
                : item.location_name || 'N/A'}
            </Text>
          </View>

          {/* Date */}
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{formatDate(item.start_date)}</Text>
          </View>

          {/* Price */}
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{formatPrice(item.price, item.currency)}</Text>
          </View>

          {/* Bookings */}
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {item.current_bookings}/{item.max_capacity || '∞'}
            </Text>
          </View>
        </View>

        {/* Created Date */}
        <Text style={styles.createdDate}>Created: {formatDate(item.created_at)}</Text>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </Pressable>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Listings</Text>
              <Text style={styles.headerSubtitle}>{total} total</Text>
            </View>
            <View style={styles.headerActionPlaceholder} />
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <Pressable
              style={[styles.tab, activeTab === 'experiences' && styles.tabActive]}
              onPress={() => handleTabChange('experiences')}
            >
              <Text style={[styles.tabText, activeTab === 'experiences' && styles.tabTextActive]}>
                Experiences
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'trips' && styles.tabActive]}
              onPress={() => handleTabChange('trips')}
            >
              <Text style={[styles.tabText, activeTab === 'trips' && styles.tabTextActive]}>
                Trips
              </Text>
            </Pressable>
          </View>

          {/* Listings */}
          {loading && !refreshing ? (
            <LoadingSpinner />
          ) : error ? (
            <View style={styles.errorContainer}>
              <EmptyState emoji="⚠️" title="Error Loading Listings" message={error} />
              <Pressable style={styles.retryButton} onPress={() => fetchListings(true)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : listings.length === 0 ? (
            <EmptyState emoji="📋" title={`No ${activeTab} found`} message={`No ${activeTab}`} />
          ) : (
            <FlatList
              data={listings}
              renderItem={renderListingCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Colors.primary}
                  colors={[Colors.primary]}
                />
              }
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loading && !refreshing ? (
                  <View style={styles.loadingFooter}>
                    <LoadingSpinner />
                  </View>
                ) : null
              }
            />
          )}
        </SafeAreaView>
      </View>
    </>
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textInverse,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  listingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: Colors.surfaceSecondary,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.textInverse,
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: Spacing.md,
  },
  titleRow: {
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.sm,
  },
  hostAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  hostAvatarText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textInverse,
  },
  hostInfo: {
    flex: 1,
  },
  hostLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
  },
  hostName: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  hostEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: '45%',
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  createdDate: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  loadingFooter: {
    paddingVertical: Spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.textInverse,
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
});
