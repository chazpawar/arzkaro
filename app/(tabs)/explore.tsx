import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Image,
  Platform,
  TextInput,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Spacing, BorderRadius } from '../../src/constants/styles';
import { useEvents } from '../../src/hooks/use-events';
import { useAuth } from '../../src/contexts/auth-context';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import type { Event } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;

const CATEGORIES = [
  { id: 'events', label: 'Events', icon: 'calendar-outline' },
  { id: 'experiences', label: 'Experiences', icon: 'compass-outline' },
  { id: 'trips', label: 'Trips', icon: 'airplane-outline' },
];

export default function ExploreTab() {
  const router = useRouter();
  const { isHost, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('events');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch events from backend
  const { events, loading, error, refresh } = useEvents();

  // Refresh data on screen focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return 'Free';
    return price === 0 ? 'Free' : `Rs.${price.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '.');
  };

  // Filter events based on search and category
  const filteredEvents = events.filter((event) => {
    // Search filter
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Category filter (for now, show all events regardless of category)
    // You can add event_type or category field to events table later
    return true;
  });

  const renderCategoryTab = (category: (typeof CATEGORIES)[0]) => {
    const isSelected = selectedCategory === category.id;
    const isTrips = category.id === 'trips';

    return (
      <Pressable
        key={category.id}
        style={[styles.categoryTab, isSelected && styles.categoryTabSelected]}
        onPress={() => !isTrips && setSelectedCategory(category.id)}
        disabled={isTrips}
      >
        <View
          style={[styles.categoryIconContainer, isSelected && styles.categoryIconContainerSelected]}
        >
          <Ionicons
            name={category.icon as 'calendar-outline' | 'compass-outline' | 'airplane-outline'}
            size={22}
            color={isSelected ? Colors.primary : Colors.textSecondary}
          />
        </View>
        <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
          {category.label}
        </Text>
        {isTrips && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderPopularEventCard = ({ item, index }: { item: Event; index: number }) => (
    <Pressable
      style={[styles.popularCard, { marginLeft: index === 0 ? Spacing.lg : Spacing.md }]}
      onPress={() => router.push(`/events/${item.id}`)}
    >
      <View style={styles.popularCardContent}>
        <Text style={styles.popularCardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.popularCardMeta}>
          {item.category || 'Event'} | {formatDate(item.start_date)}
        </Text>
        <View style={styles.popularCardImageContainer}>
          {item.cover_image_url ? (
            <Image source={{ uri: item.cover_image_url }} style={styles.popularCardImage} />
          ) : (
            <View style={styles.popularCardImagePlaceholder}>
              <Ionicons name="image-outline" size={40} color={Colors.textInverse} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  const renderOtherEventCard = ({ item }: { item: Event }) => (
    <Pressable style={styles.otherCard} onPress={() => router.push(`/events/${item.id}`)}>
      <View style={styles.otherCardImageContainer}>
        {item.cover_image_url ? (
          <Image source={{ uri: item.cover_image_url }} style={styles.otherCardImage} />
        ) : (
          <View style={styles.otherCardImagePlaceholder}>
            <Ionicons name="image-outline" size={24} color={Colors.textSecondary} />
          </View>
        )}
      </View>
      <View style={styles.otherCardContent}>
        <Text style={styles.otherCardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.otherCardMeta}>
          {formatDate(item.start_date)} | {item.location_name || 'TBA'}
        </Text>
        <Text style={styles.otherCardPrice}>{formatPrice(item.price)}</Text>
      </View>
    </Pressable>
  );

  if (loading && events.length === 0) {
    return <LoadingSpinner fullScreen text="Loading events..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>arz</Text>
            <Text style={styles.logoDot}>.</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search events, experiences..."
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Category Tabs */}
        <View style={styles.categorySection}>
          <View style={styles.categoryTabs}>{CATEGORIES.map(renderCategoryTab)}</View>
          <View style={styles.categoryDivider} />
        </View>

        {/* Popular Events Section */}
        {filteredEvents.length > 0 ? (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popular Events</Text>
                <Text style={styles.sectionSubtitle}>Trending events loved by everyone</Text>
              </View>

              <FlatList
                data={filteredEvents.slice(0, 3)}
                renderItem={renderPopularEventCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.popularList}
                snapToInterval={CARD_WIDTH + Spacing.md}
                decelerationRate="fast"
              />
            </View>

            {/* Other Events Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Other Events</Text>
                <Text style={styles.sectionSubtitle}>
                  Unique experiences, exclusively on our platform
                </Text>
              </View>

              <View style={styles.otherEventsList}>
                {filteredEvents.slice(0, 4).map((item) => (
                  <View key={item.id}>{renderOtherEventCard({ item })}</View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>
              {error && error.includes('Database not set up')
                ? 'Database Not Set Up'
                : 'No Events Found'}
            </Text>
            <Text style={styles.emptyText}>
              {error
                ? error.includes('Database not set up')
                  ? 'Please run database migrations. Check SETUP_DATABASE.md in the project root for instructions.'
                  : error
                : 'No events available at the moment. Check back soon for exciting events!'}
            </Text>
            {(isHost || isAdmin) && !error && (
              <Pressable
                style={styles.createEventButton}
                onPress={() => router.push('/events/create')}
              >
                <Ionicons name="add-circle-outline" size={20} color={Colors.textInverse} />
                <Text style={styles.createEventButtonText}>Create Event</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -1,
  },
  logoDot: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: -2,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 15,
    color: Colors.text,
  },
  categorySection: {
    paddingTop: Spacing.sm,
  },
  categoryTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
  },
  categoryTab: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    position: 'relative',
  },
  categoryTabSelected: {},
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  categoryIconContainerSelected: {
    backgroundColor: Colors.primarySoft,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  categoryLabelSelected: {
    color: Colors.text,
    fontWeight: '600',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 0,
    right: -8,
    backgroundColor: Colors.textTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  categoryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  popularList: {
    paddingRight: Spacing.lg,
  },
  popularCard: {
    width: CARD_WIDTH,
    height: 320,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  popularCardContent: {
    flex: 1,
    padding: Spacing.md,
  },
  popularCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },
  popularCardMeta: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.md,
  },
  popularCardImageContainer: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  popularCardImage: {
    width: '100%',
    height: '100%',
  },
  popularCardImagePlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  otherEventsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  otherCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  otherCardImageContainer: {
    width: 100,
    height: 100,
  },
  otherCardImage: {
    width: '100%',
    height: '100%',
  },
  otherCardImagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherCardContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  otherCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  otherCardMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  otherCardPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  createEventButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textInverse,
  },
});
