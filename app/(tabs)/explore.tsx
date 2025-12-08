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
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import { useEvents } from '../../src/hooks/use-events';
import { useAuth } from '../../src/contexts/auth-context';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import TabHeader from '../../src/components/TabHeader';
import EmptyState from '../../src/components/ui/empty-state';
import type { Event } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;

const CATEGORIES = [
  { id: 'events', label: 'Events', icon: 'calendar-outline' },
  { id: 'experiences', label: 'Experiences', icon: 'compass-outline' },
  { id: 'trips', label: 'Trips', icon: 'airplane-outline' },
];

const EMPTY_STATE_CONFIG = {
  events: {
    title: 'No Events Found',
    message: 'No events available at the moment.',
    icon: 'calendar-outline' as const,
    createLabel: 'Create Event',
  },
  experiences: {
    title: 'No Experiences Found',
    message: 'Discover amazing experiences.',
    icon: 'compass-outline' as const,
    createLabel: 'Create Experience',
  },
  trips: {
    title: 'No Trips Found',
    message: 'Start planning your next adventure.',
    icon: 'airplane-outline' as const,
    createLabel: 'Create Trip',
  },
};

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

    // Category filter - map category to event type
    const typeMap: Record<string, string> = {
      events: 'event',
      experiences: 'experience',
      trips: 'trip',
    };

    const eventType = typeMap[selectedCategory];
    if (eventType && event.type !== eventType) {
      return false;
    }

    return true;
  });

  const renderCategoryTab = (category: (typeof CATEGORIES)[0]) => {
    const isSelected = selectedCategory === category.id;

    return (
      <Pressable
        key={category.id}
        style={[styles.categoryTab, isSelected && styles.categoryTabSelected]}
        onPress={() => setSelectedCategory(category.id)}
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

  const renderEmptyState = () => {
    const config = EMPTY_STATE_CONFIG[selectedCategory as keyof typeof EMPTY_STATE_CONFIG];

    if (error) {
      const isDbError = error.includes('Database not set up');
      return (
        <EmptyState
          title={isDbError ? 'Database Not Set Up' : 'Error Loading Data'}
          message={
            isDbError
              ? 'Please run database migrations. Check SETUP_DATABASE.md in the project root for instructions.'
              : error
          }
          icon={isDbError ? 'alert-circle-outline' : 'warning-outline'}
        />
      );
    }

    return (
      <EmptyState
        title={config.title}
        message={config.message}
        icon={config.icon}
        action={
          isHost || isAdmin
            ? {
                label: config.createLabel,
                icon: 'add-circle-outline',
                onPress: () => router.push('/events/create'),
              }
            : undefined
        }
      />
    );
  };

  if (loading && events.length === 0) {
    return <LoadingSpinner fullScreen text="Loading events..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Search - Outside ScrollView */}
      <TabHeader
        searchPlaceholder="Search events, experiences..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

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
          renderEmptyState()
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
    flexDirection: 'column',
  },
  scrollView: {
    flex: 1,
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
});
