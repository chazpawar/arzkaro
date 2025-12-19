import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ImageBackground,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import type { Event } from '../../src/types';
import { useEvents } from '../../src/hooks/use-events';

// New Components
import CategoryDetail from '../../src/components/CategoryDetail';
import TripsDetail from '../../src/components/TripsDetail';
import SearchModal from '../../src/components/SearchModal';

const CATEGORIES = [
  {
    id: 'events',
    label: 'Events',
    icon: 'calendar-outline',
    image:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'experiences',
    label: 'Experiences',
    icon: 'compass-outline',
    image:
      'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'trips',
    label: 'Trips',
    icon: 'airplane-outline',
    image:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
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
        {/* Main View: 3 Big Category Buttons */}
        {!activeView ? (
          <View style={styles.mainGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={styles.bigCategoryCard}
                onPress={() => setActiveView(cat.id)}
              >
                <ImageBackground
                  source={{ uri: cat.image }}
                  style={styles.cardBackground}
                  imageStyle={{ borderRadius: BorderRadius.lg }}
                >
                  <View style={styles.cardOverlay} />
                  <View style={styles.cardContent}>
                    <Ionicons name={cat.icon as any} size={32} color="#FFF" />
                    <Text style={styles.cardTitle}>{cat.label}</Text>
                  </View>
                </ImageBackground>
              </Pressable>
            ))}
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
    backgroundColor: Colors.surfaceSecondary, // Gray background
    paddingHorizontal: Spacing.md,
    paddingVertical: 12, // Taller search bar
    borderRadius: BorderRadius.full, // Rounded
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
  mainGrid: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  bigCategoryCard: {
    height: 160,
    borderRadius: BorderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay for text readability
    borderRadius: BorderRadius.lg,
  },
  cardContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1,
  },
});
