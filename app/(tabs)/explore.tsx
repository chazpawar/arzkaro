import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Image } from 'react-native';
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
import TripsDetail from '../../src/components/TripsDetail';
import SearchModal from '../../src/components/SearchModal';

// Centralized icon map for category icons
// Pre-load icons with spaces in filenames to avoid require() issues
const BoardGameIcon = require('../../assets/categoriesicons/Board Game.png');
const HousePartyIcon = require('../../assets/categoriesicons/House Party.png');
const DJNightIcon = require('../../assets/categoriesicons/DJ Night.png');

// Main category icons from assets/others
const ForYouIcon = require('../../assets/others/foryou.png');
const ExperiencesIcon = require('../../assets/others/experiences.png');
const TripsIcon = require('../../assets/others/trips.png');

const CATEGORY_ICONS: Record<string, any> = {
  All: require('../../assets/categoriesicons/Play.png'), // For "All" categories
  Music: require('../../assets/categoriesicons/Music.png'),
  Comedy: DJNightIcon,
  Sports: require('../../assets/categoriesicons/Sports.png'),
  Cultural: require('../../assets/categoriesicons/Cultural.png'),
  Dance: require('../../assets/categoriesicons/Dance.png'),
  Theatre: require('../../assets/categoriesicons/Cultural.png'),
  Art: require('../../assets/categoriesicons/Art.png'),
  Gaming: require('../../assets/categoriesicons/Gaming.png'),
  'E-Games': require('../../assets/categoriesicons/Gaming.png'),
  'Board Games': BoardGameIcon,
  Entertainment: require('../../assets/categoriesicons/Play.png'),
  Outdoors: require('../../assets/categoriesicons/Outdoors.png'),
  Getaway: require('../../assets/categoriesicons/Camping.png'),
  Hiking: require('../../assets/categoriesicons/Hiking.png'),
  Running: require('../../assets/categoriesicons/Walking.png'),
  Nightlife: require('../../assets/categoriesicons/Nightlife.png'),
  Parties: HousePartyIcon,
  Clubs: DJNightIcon,
  Cafes: require('../../assets/categoriesicons/Nightout.png'),
  Movies: require('../../assets/categoriesicons/Play.png'),
  Wellness: require('../../assets/categoriesicons/Wellness.png'),
  Yoga: require('../../assets/categoriesicons/Yoga.png'),
  Retreat: require('../../assets/categoriesicons/Meditation.png'),
  Rehab: require('../../assets/categoriesicons/Wellness.png'),
};

// Category structure with subcategories
interface CategoryTag {
  id: string;
  label: string;
  icon: any; // Using require() for local images
  subcategories?: { id: string; label: string; icon: any }[];
}

const CATEGORIES = [
  {
    id: 'events',
    label: 'For You',
    icon: ForYouIcon,
  },
  {
    id: 'experiences',
    label: 'Experiences',
    icon: ExperiencesIcon,
  },
  {
    id: 'trips',
    label: 'Trips',
    icon: TripsIcon,
  },
];

// Category structure with subcategories
interface CategoryTag {
  id: string;
  label: string;
  icon: any; // Using require() for local images
  subcategories?: { id: string; label: string; icon: any }[];
}

const CATEGORY_TAGS_BY_TYPE: Record<string, CategoryTag[]> = {
  events: [
    {
      id: 'all',
      label: 'All',
      icon: CATEGORY_ICONS.All,
    },
    {
      id: 'Music',
      label: 'Music',
      icon: CATEGORY_ICONS.Music,
    },
    {
      id: 'Comedy',
      label: 'Comedy',
      icon: CATEGORY_ICONS.Comedy,
    },
    {
      id: 'Sports',
      label: 'Sports',
      icon: CATEGORY_ICONS.Sports,
    },
  ],
  experiences: [
    {
      id: 'all',
      label: 'All',
      icon: CATEGORY_ICONS.All,
    },
    {
      id: 'Cultural',
      label: 'Cultural',
      icon: CATEGORY_ICONS.Cultural,
      subcategories: [
        { id: 'Music', label: 'Music', icon: CATEGORY_ICONS.Music },
        { id: 'Dance', label: 'Dance', icon: CATEGORY_ICONS.Dance },
        { id: 'Theatre', label: 'Theatre', icon: CATEGORY_ICONS.Theatre },
        { id: 'Art', label: 'Art', icon: CATEGORY_ICONS.Art },
      ],
    },
    {
      id: 'Games',
      label: 'Games',
      icon: CATEGORY_ICONS.Gaming,
      subcategories: [
        { id: 'Sports', label: 'Sports', icon: CATEGORY_ICONS.Sports },
        { id: 'E-Games', label: 'E-Games', icon: CATEGORY_ICONS['E-Games'] },
        { id: 'Board Games', label: 'Board Games', icon: CATEGORY_ICONS['Board Games'] },
      ],
    },
    {
      id: 'Entertainment',
      label: 'Entertainment',
      icon: CATEGORY_ICONS.Entertainment,
    },
    {
      id: 'Outdoors',
      label: 'Outdoors',
      icon: CATEGORY_ICONS.Outdoors,
      subcategories: [
        { id: 'Getaway', label: 'Getaway', icon: CATEGORY_ICONS.Getaway },
        { id: 'Hiking', label: 'Hiking', icon: CATEGORY_ICONS.Hiking },
        { id: 'Running', label: 'Running', icon: CATEGORY_ICONS.Running },
      ],
    },
    {
      id: 'Nightlife',
      label: 'Nightlife',
      icon: CATEGORY_ICONS.Nightlife,
      subcategories: [
        { id: 'Parties', label: 'Parties', icon: CATEGORY_ICONS.Parties },
        { id: 'Clubs', label: 'Clubs', icon: CATEGORY_ICONS.Clubs },
        { id: 'Cafes', label: 'Cafes', icon: CATEGORY_ICONS.Cafes },
        { id: 'Movies', label: 'Movies', icon: CATEGORY_ICONS.Movies },
      ],
    },
    {
      id: 'Wellness',
      label: 'Wellness',
      icon: CATEGORY_ICONS.Wellness,
      subcategories: [
        { id: 'Yoga', label: 'Yoga', icon: CATEGORY_ICONS.Yoga },
        { id: 'Retreat', label: 'Retreat', icon: CATEGORY_ICONS.Retreat },
        { id: 'Rehab', label: 'Rehab', icon: CATEGORY_ICONS.Rehab },
      ],
    },
  ],
  trips: [], // Trips handled by TripsDetail component directly
};

export default function ExploreTab() {
  const router = useRouter();
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  // State for active view - now inline on same page, default to 'events' (For You)
  const [activeView, setActiveView] = useState<string | null>('events');
  const [selectedTag, setSelectedTag] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('All Locations');

  const { events, loading, refresh } = useEvents();
  const { events: featuredExperiences } = useFeaturedEvents(5, 'experience');
  const { events: featuredTrips } = useFeaturedEvents(5, 'trip');

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Helper function to shuffle array (Fisher-Yates algorithm)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Get random selection of featured items (up to 10 items)
  const getRandomFeatured = (items: Event[], limit = 10) => {
    if (items.length === 0) return [];
    const shuffled = shuffleArray(items);
    return shuffled.slice(0, Math.min(limit, items.length));
  };

  // Filter logic with comprehensive keyword search
  const filteredEvents = events.filter((event: Event) => {
    // Keyword search - searches across multiple fields
    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      // Search in title
      const titleMatch = event.title.toLowerCase().includes(query);

      // Search in description
      const descMatch = event.description?.toLowerCase().includes(query) || false;
      const shortDescMatch = event.short_description?.toLowerCase().includes(query) || false;

      // Search in category
      const categoryMatch = event.category?.toLowerCase().includes(query) || false;

      // Search in tags
      const tagsMatch = event.tags.some((tag) => tag.toLowerCase().includes(query));

      // Search in location fields
      const locationNameMatch = event.location_name?.toLowerCase().includes(query) || false;
      const locationAddressMatch = event.location_address?.toLowerCase().includes(query) || false;
      const departureLocationMatch =
        event.departure_location?.toLowerCase().includes(query) || false;

      // If none of the fields match, filter out
      if (
        !titleMatch &&
        !descMatch &&
        !shortDescMatch &&
        !categoryMatch &&
        !tagsMatch &&
        !locationNameMatch &&
        !locationAddressMatch &&
        !departureLocationMatch
      ) {
        return false;
      }
    }

    // Location filter
    if (searchLocation && searchLocation !== 'All Locations') {
      const locationLower = searchLocation.toLowerCase();

      // For trips, check departure_location
      if (event.type === 'trip') {
        const tripLocationMatch =
          event.departure_location?.toLowerCase().includes(locationLower) || false;
        if (!tripLocationMatch) return false;
      }
      // For experiences/events, check location_name
      else {
        const eventLocationMatch =
          event.location_name?.toLowerCase().includes(locationLower) || false;
        if (!eventLocationMatch) return false;
      }
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

    // Category filtering with subcategory support
    if (activeView !== 'trips' && selectedTag !== 'all') {
      // Find the selected category configuration
      const categoryTags = CATEGORY_TAGS_BY_TYPE[activeView] || [];
      const selectedCategory = categoryTags.find((cat) => cat.id === selectedTag);

      // If category has subcategories, match against any subcategory
      if (selectedCategory?.subcategories && selectedCategory.subcategories.length > 0) {
        const subcategoryIds = selectedCategory.subcategories.map((sub) => sub.id);
        const matchesSubcategory =
          event.category &&
          subcategoryIds.some((subId) => subId.toLowerCase() === event.category?.toLowerCase());
        const matchesMainCategory = event.category?.toLowerCase() === selectedTag.toLowerCase();
        const matchesInTags =
          event.tags &&
          event.tags.some((tag) =>
            subcategoryIds.some((subId) => subId.toLowerCase() === tag.toLowerCase())
          );

        if (!matchesSubcategory && !matchesMainCategory && !matchesInTags) {
          return false;
        }
      } else {
        // No subcategories, use exact match
        if (event.category !== selectedTag) {
          return false;
        }
      }
    }

    return true;
  });

  const handleCategoryPress = (categoryId: string) => {
    if (categoryId === 'trips') {
      // For trips, navigate to the trips category view (not inline)
      setActiveView('trips');
      setSelectedTag('trips'); // Set to 'trips' to show full page view
    } else if (activeView === categoryId) {
      // If clicking the same category (except trips), toggle back to 'events' (For You)
      setActiveView('events');
      setSelectedTag('all');
    } else {
      // Otherwise, switch to the new category
      setActiveView(categoryId);
      setSelectedTag('all');
    }
  };

  const handleSearch = (location: string, query: string, _radius: number) => {
    setSearchLocation(location);
    setSearchQuery(query);
    // TODO: Use radius for nearby search filtering
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
      {/* Logo - Hide when a specific category (not 'all') is selected */}
      {selectedTag === 'all' && (
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/arz.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Search Bar Header */}
      <View style={styles.headerContainer}>
        {/* Back button - Show when a specific category is selected */}
        {selectedTag !== 'all' && (
          <Pressable
            onPress={() => {
              setSelectedTag('all');
              // Also reset to 'events' view when going back
              if (activeView === 'trips') {
                setActiveView('events');
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
        )}

        <Pressable style={styles.searchBar} onPress={() => setSearchModalVisible(true)}>
          <Ionicons name="search" size={20} color={Colors.text} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            {searchQuery
              ? `${searchQuery}${searchLocation !== 'All Locations' ? ` • ${searchLocation}` : ''}`
              : 'Search events, activities...'}
          </Text>
        </Pressable>

        {selectedTag === 'all' && (
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
        <View style={styles.mainContent}>
          {/* 1. Horizontal Circular Categories - Show only when 'all' is selected */}
          {selectedTag === 'all' && (
            <View style={styles.categoriesRow}>
              {CATEGORIES.map((cat) => {
                const isActive = activeView === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={styles.categoryCircleContainer}
                    onPress={() => handleCategoryPress(cat.id)}
                  >
                    <View style={styles.categoryIconContainer}>
                      <Image source={cat.icon} style={styles.categoryIcon} resizeMode="contain" />
                      {isActive && (
                        <View style={styles.categoryCheckBadge}>
                          <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* 2. Show categories and events inline when Experiences is clicked */}
          {activeView === 'experiences' && (
            <View>
              <CategoryDetail
                type="experiences"
                tags={CATEGORY_TAGS_BY_TYPE['experiences'] || []}
                selectedTag={selectedTag}
                onSelectTag={setSelectedTag}
                events={filteredEvents}
                onEventPress={(id) => router.push(`/events/${id}`)}
                showInline={selectedTag === 'all'}
              />
            </View>
          )}

          {/* 3. Show trips detail as full page when Trips is clicked */}
          {activeView === 'trips' && selectedTag === 'trips' && (
            <View>
              <TripsDetail
                events={filteredEvents}
                onTripPress={(id) => router.push(`/events/${id}`)}
              />
            </View>
          )}

          {/* 4. Show featured sections when For You is selected with 'all' tag */}
          {activeView === 'events' && selectedTag === 'all' && (
            <>
              {/* Top Experiences Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Top Experiences</Text>
                  <Pressable onPress={() => handleCategoryPress('experiences')}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </Pressable>
                </View>

                {getRandomFeatured(featuredExperiences).length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                  >
                    {getRandomFeatured(featuredExperiences).map((item) => (
                      <Pressable
                        key={item.id}
                        style={styles.horizontalCard}
                        onPress={() => router.push(`/events/${item.id}`)}
                      >
                        <Image
                          source={{
                            uri: item.cover_image_url || 'https://via.placeholder.com/150',
                          }}
                          style={styles.horizontalCardImage}
                        />
                        <View style={styles.horizontalCardContent}>
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <View style={styles.cardRow}>
                            <Text style={styles.cardLocation}>{item.location_name || ''}</Text>
                            <Text style={styles.cardRating}>★ 4.5</Text>
                          </View>
                          <Text style={styles.cardPrice}>
                            {item.price ? `₹${item.price}` : 'Free'}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>No events yet</Text>
                  </View>
                )}
              </View>

              {/* Popular Trips Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Popular Trips</Text>
                  <Pressable onPress={() => handleCategoryPress('trips')}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </Pressable>
                </View>

                {getRandomFeatured(featuredTrips).length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                  >
                    {getRandomFeatured(featuredTrips).map((item) => (
                      <Pressable
                        key={item.id}
                        style={styles.horizontalCard}
                        onPress={() => router.push(`/events/${item.id}`)}
                      >
                        <Image
                          source={{
                            uri: item.cover_image_url || 'https://via.placeholder.com/150',
                          }}
                          style={styles.horizontalCardImage}
                        />
                        <View style={styles.horizontalCardContent}>
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <View style={styles.cardRow}>
                            <Text style={styles.cardLocation}>{item.location_name || ''}</Text>
                            <Text style={styles.cardRating}>★ 4.5</Text>
                          </View>
                          <Text style={styles.cardPrice}>
                            {item.price ? `₹${item.price}` : 'Free'}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>No events yet</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* 5. Show events detail when a specific category is selected within For You */}
          {activeView === 'events' && selectedTag !== 'all' && (
            <View>
              <CategoryDetail
                type="events"
                tags={CATEGORY_TAGS_BY_TYPE['events'] || []}
                selectedTag={selectedTag}
                onSelectTag={setSelectedTag}
                events={filteredEvents}
                onEventPress={(id) => router.push(`/events/${id}`)}
                showInline={false}
              />
            </View>
          )}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Search Modal */}
      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSearch={handleSearch}
        searchContext={
          activeView === 'trips' ? 'trips' : activeView === 'experiences' ? 'experiences' : 'all'
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  logo: {
    width: 120,
    height: 48,
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
    flex: 1,
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
    paddingHorizontal: Spacing.xs,
  },
  categoryIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
  },
  categoryIcon: {
    width: 64,
    height: 64,
  },
  categoryCheckBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  categoryLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
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
  emptyStateContainer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
