import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import type { Event } from '../../src/types';
import { useEvents, useFeaturedEvents } from '../../src/hooks/use-events';

// New Components
import CategoryDetail from '../../src/components/CategoryDetail';
import TripsDetail, { DUMMY_TRIPS } from '../../src/components/TripsDetail';
import SearchModal from '../../src/components/SearchModal';

const CATEGORIES = [
  {
    id: 'events',
    label: 'Events',
    icon: 'calendar-outline',
    color: '#6C63FF', // We will use this for the ICON color now
  },
  {
    id: 'experiences',
    label: 'Experiences',
    icon: 'compass-outline',
    color: '#FF6584', // Icon color
  },
  {
    id: 'trips',
    label: 'Trips',
    icon: 'airplane-outline',
    color: '#4ECDC4', // Icon color
  },
];

const FEATURED_EXPERIENCES = [
  {
    id: 'exp1',
    title: 'Pottery Workshop',
    image:
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: '₹1,200',
    rating: 4.8,
    location: 'Indiranagar',
  },
  {
    id: 'exp2',
    title: 'Wine Tasting',
    image:
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: '₹2,500',
    rating: 4.9,
    location: 'Nandi Hills',
  },
  {
    id: 'exp3',
    title: 'Stand-up Comedy',
    image:
      'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: '₹499',
    rating: 4.5,
    location: 'Koramangala',
  },
];

const CATEGORY_TAGS_BY_TYPE: Record<string, { id: string; label: string; icon: string }[]> = {
  events: [
    { id: 'all', label: 'Sporty', icon: 'american-football-outline' },
    { id: 'Badminton', label: 'Badminton', icon: 'tennisball-outline' },
    { id: 'Pickleball', label: 'Pickleball', icon: 'baseball-outline' },
    { id: 'Box Cricket', label: 'Box Cricket', icon: 'baseball-outline' },
    { id: 'Bowling', label: 'Bowling', icon: 'bowling-ball-outline' },
  ],
  experiences: [
    { id: 'all', label: 'Cultural', icon: 'color-palette-outline' },
    { id: 'Games', label: 'Games', icon: 'game-controller-outline' },
    { id: 'Entertainment', label: 'Entertainment', icon: 'film-outline' },
    { id: 'Outdoors', label: 'Outdoors', icon: 'leaf-outline' },
    { id: 'Nightlife', label: 'Nightlife', icon: 'wine-outline' },
    { id: 'Wellness', label: 'Wellness', icon: 'fitness-outline' },
  ],
  trips: [], // Trips handled by TripsDetail component directly
};

export default function ExploreTab() {
  const router = useRouter();
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  // State for active view (null = main grid, 'events'|'experiences'|'trips' = detail view)
  const [activeView, setActiveView] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { events, loading, refresh } = useEvents();
  const { events: featuredExperiences } = useFeaturedEvents(5, 'experience');
  const { events: featuredTrips } = useFeaturedEvents(5, 'trip');

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Filter logic similar to previous implementation
  const filteredEvents = events.filter((event: Event) => {
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Type mapping
    const typeMap: Record<string, string> = {
      events: 'event',
      experiences: 'experience',
      trips: 'trip',
    };

    if (activeView) {
      const eventType = typeMap[activeView];
      if (eventType && event.type !== eventType) return false;
    }

    if (activeView !== 'trips' && selectedTag !== 'all' && event.category !== selectedTag) {
      return false;
    }

    return true;
  });

  const handleBackToMain = () => {
    setActiveView(null);
    setSelectedTag('all');
  };

  const handleSearch = (category: string, query: string) => {
    setActiveView(category);
    setSearchQuery(query);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar Header */}
      <View style={styles.headerContainer}>
        {activeView && (
          <Pressable onPress={handleBackToMain} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
        )}

        <Pressable style={styles.searchBar} onPress={() => setSearchModalVisible(true)}>
          <Ionicons name="search" size={20} color={Colors.text} />
          <Text style={styles.searchPlaceholder}>{searchQuery || 'Search'}</Text>
        </Pressable>

        {!activeView && (
          <Pressable style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Main View: Circles + Featured Sections */}
        {!activeView ? (
          <View style={styles.mainContent}>
            {/* 1. Horizontal Circular Categories */}
            <View style={styles.categoriesRow}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={styles.categoryCircleContainer}
                  onPress={() => setActiveView(cat.id)}
                >
                  <View style={styles.categoryCircle}>
                    <Ionicons name={cat.icon as any} size={32} color={cat.color} />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* 2. Top Experiences Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Top Experiences</Text>
                <Pressable onPress={() => setActiveView('experiences')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {(featuredExperiences.length > 0 ? featuredExperiences : FEATURED_EXPERIENCES).map(
                  (item) => (
                    <Pressable key={item.id} style={styles.horizontalCard}>
                      <Image
                        source={{
                          uri:
                            (item as any).image ||
                            (item as any).cover_image_url ||
                            'https://via.placeholder.com/150',
                        }}
                        style={styles.horizontalCardImage}
                      />
                      <View style={styles.horizontalCardContent}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View style={styles.cardRow}>
                          <Text style={styles.cardLocation}>
                            {(item as any).location || (item as any).location_name || ''}
                          </Text>
                          <Text style={styles.cardRating}>★ {(item as any).rating || '4.5'}</Text>
                        </View>
                        <Text style={styles.cardPrice}>
                          {(item as any).price
                            ? typeof (item as any).price === 'string'
                              ? (item as any).price
                              : `₹${(item as any).price}`
                            : ''}
                        </Text>
                      </View>
                    </Pressable>
                  )
                )}
              </ScrollView>
            </View>

            {/* 3. Popular Trips Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Popular Trips</Text>
                <Pressable onPress={() => setActiveView('trips')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {(featuredTrips.length > 0 ? featuredTrips : DUMMY_TRIPS).map((item) => (
                  <Pressable key={item.id} style={styles.horizontalCard}>
                    <Image
                      source={{
                        uri:
                          (item as any).image ||
                          (item as any).cover_image_url ||
                          'https://via.placeholder.com/150',
                      }}
                      style={styles.horizontalCardImage}
                    />
                    <View style={styles.horizontalCardContent}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={styles.cardRow}>
                        <Text style={styles.cardLocation}>
                          {(item as any).location || (item as any).location_name || ''}
                        </Text>
                        <Text style={styles.cardRating}>★ {(item as any).rating || '4.5'}</Text>
                      </View>
                      <Text style={styles.cardPrice}>
                        {(item as any).price
                          ? typeof (item as any).price === 'string'
                            ? (item as any).price
                            : `₹${(item as any).price}`
                          : ''}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : (
          // Detail Views
          <View>
            {activeView === 'trips' ? (
              <TripsDetail events={filteredEvents} />
            ) : (
              <CategoryDetail
                type={activeView as 'events' | 'experiences'}
                tags={CATEGORY_TAGS_BY_TYPE[activeView] || []}
                selectedTag={selectedTag}
                onSelectTag={setSelectedTag}
                events={filteredEvents}
                onEventPress={(id) => router.push(`/events/${id}`)}
              />
            )}
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Search Modal */}
      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSearch={handleSearch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  notificationButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    paddingBottom: Spacing.xl,
  },
  // Categories (Circles)
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute evenly
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  categoryCircleContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // White background
    borderWidth: 1, // Optional: add a subtle border or keep clean
    borderColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, // Softer shadow
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  // Featured Sections
  sectionContainer: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  horizontalList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  horizontalCard: {
    width: 220,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  horizontalCardImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.surfaceSecondary,
  },
  horizontalCardContent: {
    padding: Spacing.sm,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardRating: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
});
