import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { Fonts } from '../../src/constants/Fonts';
import type { Event } from '../../src/types';
import { useEvents } from '../../src/hooks/use-events';
import { useAuth } from '../../src/contexts/auth-context';
import { useNotifications } from '../../src/hooks/use-notifications';

// New Components
import CategoryDetail from '../../src/components/CategoryDetail';
import TripsDetail from '../../src/components/TripsDetail';
import SearchModal from '../../src/components/SearchModal';
import EmptyState from '../../src/components/ui/empty-state';

// Centralized icon map for category icons
// Pre-load icons with spaces in filenames to avoid require() issues

// CULTURAL category icons
const CulturalIcon = require('../../assets/categoriesicons/cultural/Cultural.png');
const MusicIcon = require('../../assets/categoriesicons/cultural/Music.png');
const ArtIcon = require('../../assets/categoriesicons/cultural/Art.png');
const DanceIcon = require('../../assets/categoriesicons/cultural/Dance.png');

// NIGHTLIFE category icons
const NightlifeIcon = require('../../assets/categoriesicons/nightlife/Nightlife.png');
const DJNightIcon = require('../../assets/categoriesicons/nightlife/DJ Night.png');
const HousePartyIcon = require('../../assets/categoriesicons/nightlife/House Party.png');
const NightoutIcon = require('../../assets/categoriesicons/nightlife/Nightout.png');

// OUTDOORS category icons
const OutdoorsIcon = require('../../assets/categoriesicons/outdoors/Outdoors.png');
const CampingIcon = require('../../assets/categoriesicons/outdoors/Camping.png');
const CyclingIcon = require('../../assets/categoriesicons/outdoors/Cycling.png');
const HikingIcon = require('../../assets/categoriesicons/outdoors/Hiking.png');
const WalkingIcon = require('../../assets/categoriesicons/outdoors/Walking.png');

// PLAY category icons
const PlayIcon = require('../../assets/categoriesicons/play/Play.png');
const BoardGameIcon = require('../../assets/categoriesicons/play/Board Game.png');
const GamingIcon = require('../../assets/categoriesicons/play/Gaming.png');

// SPORTS category icons
const SportsIcon = require('../../assets/categoriesicons/sports/Sports.png');
const BadmintonIcon = require('../../assets/categoriesicons/sports/Badminton.png');
const BasketballIcon = require('../../assets/categoriesicons/sports/Basketball.png');
const CricketIcon = require('../../assets/categoriesicons/sports/Cricket.png');
const FootballIcon = require('../../assets/categoriesicons/sports/Football.png');
const PickleballIcon = require('../../assets/categoriesicons/sports/Pickleball.png');
const VolleyballIcon = require('../../assets/categoriesicons/sports/Volleyball.png');

// WELLNESS category icons
const WellnessIcon = require('../../assets/categoriesicons/wellness/Wellness.png');
const MeditationIcon = require('../../assets/categoriesicons/wellness/Meditation.png');
const YogaIcon = require('../../assets/categoriesicons/wellness/Yoga.png');

// Main category icons from assets/others
const ForYouIcon = require('../../assets/others/foryou.png');
const ExperiencesIcon = require('../../assets/others/experiences.png');
const TripsIcon = require('../../assets/others/trips.png');

// Haversine distance calculation (returns distance in kilometers)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const CATEGORY_ICONS: Record<string, any> = {
  // Cultural
  Cultural: CulturalIcon,
  Music: MusicIcon,
  Art: ArtIcon,
  Dance: DanceIcon,

  // Nightlife
  Nightlife: NightlifeIcon,
  'DJ Night': DJNightIcon,
  'House Party': HousePartyIcon,
  Nightout: NightoutIcon,

  // Outdoors
  Outdoors: OutdoorsIcon,
  Camping: CampingIcon,
  Cycling: CyclingIcon,
  Hiking: HikingIcon,
  Walking: WalkingIcon,

  // Play
  Play: PlayIcon,
  'Board Game': BoardGameIcon,
  Gaming: GamingIcon,

  // Sports
  Sports: SportsIcon,
  Badminton: BadmintonIcon,
  Basketball: BasketballIcon,
  Cricket: CricketIcon,
  Football: FootballIcon,
  Pickleball: PickleballIcon,
  Volleyball: VolleyballIcon,

  // Wellness
  Wellness: WellnessIcon,
  Meditation: MeditationIcon,
  Yoga: YogaIcon,

  // For "events" tab (For You page) - keeping existing
  Comedy: DJNightIcon,
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
      id: 'Cultural',
      label: 'Cultural',
      icon: CATEGORY_ICONS.Cultural,
      subcategories: [
        { id: 'Music', label: 'Music', icon: CATEGORY_ICONS.Music },
        { id: 'Art', label: 'Art', icon: CATEGORY_ICONS.Art },
        { id: 'Dance', label: 'Dance', icon: CATEGORY_ICONS.Dance },
      ],
    },
    {
      id: 'Play',
      label: 'Play',
      icon: CATEGORY_ICONS.Play,
      subcategories: [
        { id: 'Gaming', label: 'Gaming', icon: CATEGORY_ICONS.Gaming },
        { id: 'Board Game', label: 'Board Game', icon: CATEGORY_ICONS['Board Game'] },
      ],
    },
    {
      id: 'Sports',
      label: 'Sports',
      icon: CATEGORY_ICONS.Sports,
      subcategories: [
        { id: 'Cricket', label: 'Cricket', icon: CATEGORY_ICONS.Cricket },
        { id: 'Football', label: 'Football', icon: CATEGORY_ICONS.Football },
        { id: 'Basketball', label: 'Basketball', icon: CATEGORY_ICONS.Basketball },
        { id: 'Badminton', label: 'Badminton', icon: CATEGORY_ICONS.Badminton },
        { id: 'Volleyball', label: 'Volleyball', icon: CATEGORY_ICONS.Volleyball },
        { id: 'Pickleball', label: 'Pickleball', icon: CATEGORY_ICONS.Pickleball },
      ],
    },
    {
      id: 'Outdoors',
      label: 'Outdoors',
      icon: CATEGORY_ICONS.Outdoors,
      subcategories: [
        { id: 'Camping', label: 'Camping', icon: CATEGORY_ICONS.Camping },
        { id: 'Hiking', label: 'Hiking', icon: CATEGORY_ICONS.Hiking },
        { id: 'Cycling', label: 'Cycling', icon: CATEGORY_ICONS.Cycling },
        { id: 'Walking', label: 'Walking', icon: CATEGORY_ICONS.Walking },
      ],
    },
    {
      id: 'Nightlife',
      label: 'Nightlife',
      icon: CATEGORY_ICONS.Nightlife,
      subcategories: [
        { id: 'House Party', label: 'House Party', icon: CATEGORY_ICONS['House Party'] },
        { id: 'DJ Night', label: 'DJ Night', icon: CATEGORY_ICONS['DJ Night'] },
        { id: 'Nightout', label: 'Nightout', icon: CATEGORY_ICONS.Nightout },
      ],
    },
    {
      id: 'Wellness',
      label: 'Wellness',
      icon: CATEGORY_ICONS.Wellness,
      subcategories: [
        { id: 'Yoga', label: 'Yoga', icon: CATEGORY_ICONS.Yoga },
        { id: 'Meditation', label: 'Meditation', icon: CATEGORY_ICONS.Meditation },
      ],
    },
  ],
  trips: [], // Trips handled by TripsDetail component directly
};

export default function ExploreTab() {
  const router = useRouter();
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  // State for active view - default to 'events' (For You page)
  const [activeView, setActiveView] = useState<string | null>('events');
  const [selectedTag, setSelectedTag] = useState<string | null>(null); // null means show all
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchRadius, setSearchRadius] = useState(10);
  const [userCoordinates, setUserCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const { events, loading, refresh } = useEvents();
  const { isHost, profile, effectiveRole, isAdmin, viewAsUser, toggleViewMode } = useAuth();
  const { unreadCount } = useNotifications(profile?.id);

  // Log notification badge count for debugging
  useEffect(() => {
    if (profile?.id) {
      console.log('[EXPLORE] Unread notification count:', unreadCount);
    }
  }, [unreadCount, profile?.id]);

  // Log search state changes for debugging
  useEffect(() => {
    if (searchQuery || searchLocation !== 'All Locations') {
      console.log('[EXPLORE] Search state updated:', {
        query: searchQuery,
        location: searchLocation,
        radius: searchRadius,
      });
    }
  }, [searchQuery, searchLocation, searchRadius]);

  // Determine if we should show host's own listings
  // Host sees their own listings UNLESS they explicitly switch to "View as User" mode
  const showHostListings = isHost && effectiveRole === 'host';
  const hostId = profile?.id;

  // For hosts: Filter to show only their own events
  // For normal users: Show all events
  const availableEvents =
    showHostListings && hostId ? events.filter((e) => e.host_id === hostId) : events;

  // For "Top Experiences" - show all published events (from availableEvents)
  const topExperiences = availableEvents.filter((e) => e.type === 'experience').slice(0, 10);
  const popularTrips = availableEvents.filter((e) => e.type === 'trip').slice(0, 10);

  console.log('[EXPLORE] Total events:', events.length);
  console.log('[EXPLORE] Show host listings:', showHostListings, 'Host ID:', hostId);
  console.log('[EXPLORE] Available events (filtered):', availableEvents.length);
  console.log(
    '[EXPLORE] Top experiences:',
    topExperiences.length,
    topExperiences.map((e) => e.title)
  );
  console.log(
    '[EXPLORE] Popular trips:',
    popularTrips.length,
    popularTrips.map((e) => e.title)
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const allEvents = availableEvents as Event[];

  // Determine if user is actively searching (by keyword OR location)
  const isSearching = searchQuery || (searchLocation && searchLocation !== 'All Locations');

  // Filter logic with comprehensive keyword search
  const filteredEvents = allEvents.filter((event: Event) => {
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

      // Search in tags (with null check)
      const tagsMatch = event.tags?.some((tag) => tag.toLowerCase().includes(query)) || false;

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

    // Location filtering - SIMPLE: Only coordinates-based radius search
    if (searchLocation && searchLocation !== 'All Locations' && userCoordinates) {
      // Event MUST have coordinates to be included
      if (!event.location_lat || !event.location_lng) {
        console.log('[EXPLORE] Event excluded (no coordinates):', event.title);
        return false;
      }

      // Calculate distance
      const distance = haversineDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        event.location_lat,
        event.location_lng
      );

      // Check if within radius
      if (distance > searchRadius) {
        console.log('[EXPLORE] Event outside radius:', {
          eventTitle: event.title,
          distance: distance.toFixed(2) + ' km',
          radius: searchRadius + ' km',
        });
        return false;
      }

      console.log('[EXPLORE] Event within radius:', {
        eventTitle: event.title,
        distance: distance.toFixed(2) + ' km',
        radius: searchRadius + ' km',
      });
    }

    // Type mapping - skip type filter when actively searching
    const typeMap: Record<string, string> = {
      events: 'event',
      experiences: 'experience',
      trips: 'trip',
    };

    // Only apply type filter if NOT actively searching (with query OR location)
    if (activeView && !isSearching) {
      const eventType = typeMap[activeView];
      if (eventType && event.type !== eventType) return false;
    }

    // Category filtering with subcategory support - skip if actively searching
    if (activeView !== 'trips' && selectedTag !== null && selectedTag !== 'all' && !isSearching) {
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

  // Log search results for debugging
  useEffect(() => {
    if (searchQuery || (searchLocation && searchLocation !== 'All Locations')) {
      console.log('[EXPLORE] Filtered results:', {
        totalEvents: allEvents.length,
        filteredCount: filteredEvents.length,
        searchQuery,
        searchLocation,
        searchRadius,
      });

      if (filteredEvents.length === 0) {
        console.warn('[EXPLORE] No results found for search criteria');
      }
    }
  }, [filteredEvents.length, searchQuery, searchLocation, searchRadius, allEvents.length]);

  const handleCategoryPress = (categoryId: string) => {
    console.log('[EXPLORE] Category pressed:', categoryId, 'Current activeView:', activeView);
    if (categoryId === 'trips') {
      // For trips, navigate to the trips category view (full page)
      console.log('[EXPLORE] Setting activeView=trips, selectedTag=trips');
      setActiveView('trips');
      setSelectedTag('trips');
    } else if (categoryId === 'experiences') {
      // For experiences, navigate to the experiences category view (full page)
      console.log('[EXPLORE] Setting activeView=experiences, selectedTag=null');
      setActiveView('experiences');
      setSelectedTag(null); // null to show all categories
    } else if (activeView === categoryId) {
      // If clicking the same category (except trips/experiences), toggle back to 'events' (For You)
      console.log('[EXPLORE] Toggling back to events view');
      setActiveView('events');
      setSelectedTag(null); // null to show all categories
    }
  };

  const handleSearch = (
    location: string,
    query: string,
    radius: number,
    coordinates?: { latitude: number; longitude: number }
  ) => {
    console.log('[EXPLORE] Search triggered:', { location, query, radius, coordinates });
    setSearchLocation(location);
    setSearchQuery(query);
    setSearchRadius(radius);
    setUserCoordinates(coordinates || null);

    // Close the search modal
    setSearchModalVisible(false);

    // If searching with a query, show all event types (don't filter by activeView)
    // The filter logic will handle showing all matching events
    if (query) {
      console.log('[EXPLORE] Search active - showing all matching events');
    }

    // Log search summary
    if (query || location !== 'All Locations') {
      console.log('[EXPLORE] Search summary:', {
        query: query || 'none',
        location: location,
        radius: radius + ' km',
        hasCoordinates: !!coordinates,
        resultsWillShow: 'All matching events across all types',
      });
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Admin View Banner */}
        {isAdmin && viewAsUser && (
          <Pressable style={styles.viewModeBanner} onPress={toggleViewMode}>
            <Ionicons name="eye-outline" size={16} color={Colors.warning} />
            <Text style={styles.viewModeBannerText}>Viewing as User</Text>
            <Text style={styles.viewModeBannerAction}>Tap to exit</Text>
          </Pressable>
        )}

        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Admin View Banner */}
      {isAdmin && viewAsUser && (
        <Pressable style={styles.viewModeBanner} onPress={toggleViewMode}>
          <Ionicons name="eye-outline" size={16} color={Colors.warning} />
          <Text style={styles.viewModeBannerText}>Viewing as User</Text>
          <Text style={styles.viewModeBannerAction}>Tap to exit</Text>
        </Pressable>
      )}

      {/* Logo - Hide when viewing experiences/trips or a specific category is selected OR when host is viewing their listings */}
      {(selectedTag === null || selectedTag === 'all') &&
        activeView === 'events' &&
        !showHostListings && (
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/arz.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}

      {/* Page Title for Hosts viewing their listings */}
      {showHostListings &&
        (selectedTag === null || selectedTag === 'all') &&
        activeView === 'events' && (
          <View style={styles.pageTitleContainer}>
            <Text style={styles.pageTitle}>My Listings</Text>
            <Text style={styles.pageSubtitle}>Manage your experiences and trips</Text>
          </View>
        )}

      {/* Search Bar Header */}
      <View style={styles.headerContainer}>
        {/* Back button - Show when viewing experiences/trips or a specific category is selected */}
        {((selectedTag !== null && selectedTag !== 'all') ||
          activeView === 'experiences' ||
          activeView === 'trips') && (
          <Pressable
            onPress={() => {
              setSelectedTag(null);
              // Reset to 'events' view (For You) when going back
              setActiveView('events');
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
              ? `${searchQuery}${searchLocation && searchLocation !== 'All Locations' ? ` • ${searchLocation}` : ''}`
              : searchLocation && searchLocation !== 'All Locations'
                ? `${searchLocation}${searchRadius ? ` • ${searchRadius}km` : ''}`
                : 'Search experiences, trips...'}
          </Text>
          {isSearching && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setSearchQuery('');
                setSearchLocation('');
                setUserCoordinates(null);
              }}
              style={styles.clearSearchButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </Pressable>
          )}
        </Pressable>

        {/* Bell Icon - Notifications */}
        <Pressable
          style={styles.bellButton}
          onPress={() => {
            router.push('/notifications');
          }}
        >
          <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
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
          {/* 1. Horizontal Circular Categories - Show only when in For You view and NOT searching */}
          {(selectedTag === null || selectedTag === 'all') &&
            activeView === 'events' &&
            !isSearching && (
              <View style={styles.categoriesRow}>
                {/* For hosts: Show only Experiences and Trips */}
                {/* For users: Show all categories (For You, Experiences, Trips) */}
                {(showHostListings
                  ? CATEGORIES.filter((cat) => cat.id !== 'events')
                  : CATEGORIES
                ).map((cat) => {
                  const isActive = activeView === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      style={styles.categoryCircleContainer}
                      onPress={() => handleCategoryPress(cat.id)}
                    >
                      <View style={styles.categoryIconContainer}>
                        <Image source={cat.icon} style={styles.categoryIcon} resizeMode="contain" />
                      </View>
                      <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

          {/* Search Results Indicator */}
          {searchQuery && (
            <View style={styles.searchResultsContainer}>
              <Text style={styles.searchResultsText}>
                {filteredEvents.length} result{filteredEvents.length !== 1 ? 's' : ''} for &quot;
                {searchQuery}&quot;
                {searchLocation && searchLocation !== 'All Locations' && ` in ${searchLocation}`}
              </Text>
            </View>
          )}

          {/* Empty State for Search with No Results */}
          {(searchQuery || (searchLocation && searchLocation !== 'All Locations')) &&
            filteredEvents.length === 0 && (
              <EmptyState
                emoji="🔍"
                title="No Results Found"
                message={`No events found${searchQuery ? ` for "${searchQuery}"` : ''}${
                  searchLocation && searchLocation !== 'All Locations'
                    ? ` in ${searchLocation}`
                    : ''
                }. Try adjusting your search filters.`}
                action={{
                  label: 'Clear Search',
                  onPress: () => {
                    setSearchQuery('');
                    setSearchLocation('');
                    setUserCoordinates(null);
                  },
                }}
              />
            )}

          {/* Search Results - Show when searching in any view with results */}
          {isSearching && filteredEvents.length > 0 && (
            <View style={styles.sectionContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {filteredEvents.map((event) => (
                  <Pressable
                    key={event.id}
                    style={styles.horizontalCard}
                    onPress={() => router.push(`/events/${event.id}`)}
                  >
                    <Image
                      source={{
                        uri: event.cover_image_url || 'https://via.placeholder.com/150',
                      }}
                      style={styles.horizontalCardImage}
                    />
                    <View style={styles.horizontalCardContent}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.cardLocation} numberOfLines={1}>
                        {event.location_name || event.departure_location || 'Location TBA'}
                      </Text>
                      <Text style={styles.cardPrice}>₹{event.price}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 2. Show experiences category page when Experiences is clicked */}
          {(() => {
            const shouldShow = activeView === 'experiences' && !isSearching;
            console.log(
              '[EXPLORE RENDER] activeView:',
              activeView,
              'selectedTag:',
              selectedTag,
              'Show experiences?',
              shouldShow
            );
            return shouldShow ? (
              <View>
                <CategoryDetail
                  type="experiences"
                  tags={CATEGORY_TAGS_BY_TYPE['experiences'] || []}
                  selectedTag={selectedTag}
                  onSelectTag={setSelectedTag}
                  events={filteredEvents}
                  onEventPress={(id) => router.push(`/events/${id}`)}
                  showInline={false}
                />
              </View>
            ) : null;
          })()}

          {/* 3. Show trips detail as full page when Trips is clicked */}
          {activeView === 'trips' && selectedTag === 'trips' && !isSearching && (
            <View>
              <TripsDetail
                events={filteredEvents}
                onTripPress={(id) => router.push(`/events/${id}`)}
              />
            </View>
          )}

          {/* 4. Show featured sections when For You is selected with 'all' tag and no search active */}
          {activeView === 'events' &&
            (selectedTag === null || selectedTag === 'all') &&
            !isSearching && (
              <>
                {/* Top Experiences Section - Always show */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>
                      {showHostListings ? 'My Experiences' : 'Top Experiences'}
                    </Text>
                    <Pressable onPress={() => handleCategoryPress('experiences')}>
                      <Text style={styles.seeAllText}>See All</Text>
                    </Pressable>
                  </View>

                  {topExperiences.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalList}
                    >
                      {topExperiences.map((item) => (
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
                            <Text style={styles.cardLocation}>
                              {item.location_name || item.departure_location || ''}
                            </Text>
                            <Text style={styles.cardPrice}>₹{item.price}</Text>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyExperiencesContainer}>
                      <Text style={styles.emptyExperiencesEmoji}>🎭</Text>
                      <Text style={styles.emptyExperiencesText}>
                        {showHostListings ? 'No experiences yet' : 'No top experiences yet'}
                      </Text>
                      <Text style={styles.emptyExperiencesSubtext}>
                        {showHostListings
                          ? 'Create your first experience to get started'
                          : 'Check back soon for exciting experiences'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Popular Trips Section */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>
                      {showHostListings ? 'My Trips' : 'Popular Trips'}
                    </Text>
                    <Pressable onPress={() => handleCategoryPress('trips')}>
                      <Text style={styles.seeAllText}>See All</Text>
                    </Pressable>
                  </View>

                  {popularTrips.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalList}
                    >
                      {popularTrips.map((item) => (
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
                            <Text style={styles.cardLocation}>
                              {item.location_name || item.departure_location || ''}
                            </Text>
                            <Text style={styles.cardPrice}>₹{item.price}</Text>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyExperiencesContainer}>
                      <Text style={styles.emptyExperiencesEmoji}>🌍</Text>
                      <Text style={styles.emptyExperiencesText}>
                        {showHostListings ? 'No trips yet' : 'No popular trips yet'}
                      </Text>
                      <Text style={styles.emptyExperiencesSubtext}>
                        {showHostListings
                          ? 'Create your first trip to get started'
                          : 'Check back soon for amazing adventures'}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

          {/* Show search results when searching in For You view */}
          {activeView === 'events' &&
            (selectedTag === null || selectedTag === 'all') &&
            isSearching &&
            filteredEvents.length > 0 && (
              <View style={styles.searchResultsSection}>
                <Text style={styles.searchResultsTitle}>
                  {filteredEvents.length} Result{filteredEvents.length !== 1 ? 's' : ''}
                </Text>
                <View style={styles.searchEventsGrid}>
                  {filteredEvents.map((event) => (
                    <Pressable
                      key={event.id}
                      style={styles.searchEventCard}
                      onPress={() => router.push(`/events/${event.id}`)}
                    >
                      <Image
                        source={{ uri: event.cover_image_url || 'https://via.placeholder.com/150' }}
                        style={styles.searchEventImage}
                      />
                      <View style={styles.searchEventContent}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                        <View style={styles.searchEventInfoRow}>
                          <View style={styles.searchEventLocationRow}>
                            <Image
                              source={require('../../assets/others/location.png')}
                              style={{ width: 14, height: 14 }}
                              resizeMode="contain"
                            />
                            <Text style={styles.cardLocation} numberOfLines={1}>
                              {event.location_name || event.departure_location || 'TBA'}
                            </Text>
                          </View>
                          <View style={styles.searchEventTimeRow}>
                            <Image
                              source={require('../../assets/others/dateandtime.png')}
                              style={{ width: 18, height: 18 }}
                              resizeMode="contain"
                            />
                            <Text style={styles.searchEventTime}>
                              {event.start_date
                                ? new Date(event.start_date).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                  })
                                : '10:00 AM'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

          {/* 5. Show events detail when a specific category is selected within For You */}
          {activeView === 'events' && selectedTag !== null && selectedTag !== 'all' && (
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
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: -15,
    marginTop: -10,
  },
  logo: {
    width: 180,
    height: 80,
  },
  pageTitleContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: Spacing.xs,
    gap: Spacing.md,
  },
  backButton: {
    padding: 4,
  },
  bellButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Fonts.bold,
    textAlign: 'center',
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
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
  },
  clearSearchButton: {
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
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  categoryCircleContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 2,
  },
  categoryIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    height: 68,
  },
  categoryIcon: {
    width: 56,
    height: 56,
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  categoryLabelActive: {
    color: Colors.primary,
    fontFamily: Fonts.bold,
  },
  // Search Results
  searchResultsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  searchResultsText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
    textAlign: 'center',
  },
  // Featured Sections
  sectionContainer: {
    marginTop: Spacing.md,
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
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
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
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  cardLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardPrice: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginTop: 2,
  },
  viewModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.warningLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning,
  },
  viewModeBannerText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.warning,
  },
  viewModeBannerAction: {
    fontSize: 12,
    color: Colors.warning,
    opacity: 0.8,
    marginLeft: Spacing.xs,
  },
  emptyExperiencesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyExperiencesEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyExperiencesText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyExperiencesSubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  searchResultsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchResultsTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  searchEventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  searchEventCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchEventImage: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.surfaceSecondary,
  },
  searchEventContent: {
    padding: Spacing.md,
    gap: 6,
  },
  searchEventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  searchEventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  searchEventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchEventTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
