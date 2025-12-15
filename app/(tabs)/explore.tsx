import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import { useAuth } from '../../src/contexts/auth-context';
import TabHeader from '../../src/components/TabHeader';
import EmptyState from '../../src/components/ui/empty-state';
import type { Event } from '../../src/types';
import { mockEvents } from '../../src/data/mock-events';

const CATEGORIES = [
  { id: 'events', label: 'Events', icon: 'calendar-outline' },
  { id: 'experiences', label: 'Experiences', icon: 'compass-outline' },
  { id: 'trips', label: 'Trips', icon: 'airplane-outline' },
];

// Category tags mapped to event types
const CATEGORY_TAGS_BY_TYPE: Record<string, { id: string; label: string; icon: string }[]> = {
  events: [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'Concert', label: 'Concert', icon: 'musical-notes-outline' },
    { id: 'Business', label: 'Business', icon: 'briefcase-outline' },
    { id: 'Entertainment', label: 'Entertainment', icon: 'film-outline' },
    { id: 'Food & Drink', label: 'Food & Drink', icon: 'restaurant-outline' },
  ],
  experiences: [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'Adventure', label: 'Adventure', icon: 'navigate-outline' },
    { id: 'Photography', label: 'Photography', icon: 'camera-outline' },
    { id: 'Wellness', label: 'Wellness', icon: 'fitness-outline' },
    { id: 'Food & Drink', label: 'Food & Drink', icon: 'restaurant-outline' },
  ],
  trips: [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'Travel', label: 'Travel', icon: 'map-outline' },
    { id: 'Food & Drink', label: 'Food & Drink', icon: 'restaurant-outline' },
  ],
};

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
  const [selectedTag, setSelectedTag] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Use mock events data for UI development
  const events = mockEvents;

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  // Filter events based on search, category, and tag
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

    // Tag filter - filter by category
    if (selectedTag !== 'all' && event.category !== selectedTag) {
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
        onPress={() => {
          setSelectedCategory(category.id);
          setSelectedTag('all'); // Reset tag filter when changing category
        }}
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

  const renderCategoryTag = (tag: { id: string; label: string; icon: string }) => {
    const isSelected = selectedTag === tag.id;

    return (
      <Pressable
        key={tag.id}
        style={[styles.tagChip, isSelected && styles.tagChipSelected]}
        onPress={() => setSelectedTag(tag.id)}
      >
        <Ionicons
          name={tag.icon as any}
          size={16}
          color={isSelected ? '#FFFFFF' : Colors.textSecondary}
        />
        <Text style={[styles.tagLabel, isSelected && styles.tagLabelSelected]}>{tag.label}</Text>
      </Pressable>
    );
  };

  // Get tags for the current category
  const currentCategoryTags = CATEGORY_TAGS_BY_TYPE[selectedCategory] || [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const renderSimpleCard = ({ item }: { item: Event }) => (
    <Pressable style={styles.simpleCard} onPress={() => router.push(`/events/${item.id}`)}>
      {/* Image with padding inside card */}
      <View style={styles.simpleCardImageWrapper}>
        {item.cover_image_url ? (
          <Image source={{ uri: item.cover_image_url }} style={styles.simpleCardImage} />
        ) : (
          <View style={styles.simpleCardImagePlaceholder}>
            <Ionicons name="image-outline" size={32} color={Colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Content below image */}
      <View style={styles.simpleCardContent}>
        {/* Title */}
        <Text style={styles.simpleCardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Location and Time on same row */}
        <View style={styles.cardDetailsRow}>
          {/* Location - Left */}
          <View style={[styles.cardDetailItem, styles.cardDetailLeft]}>
            <Ionicons name="location" size={16} color="#FF3B30" />
            <Text style={styles.cardDetailText} numberOfLines={1}>
              {item.location_name || 'TBA'}
            </Text>
          </View>

          {/* Time - Right */}
          <View style={[styles.cardDetailItem, styles.cardDetailRight]}>
            <Ionicons name="time-outline" size={16} color={Colors.text} />
            <Text style={styles.cardDetailText}>{formatTime(item.start_date)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  const renderEmptyState = () => {
    const config = EMPTY_STATE_CONFIG[selectedCategory as keyof typeof EMPTY_STATE_CONFIG];

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

  // Removed loading spinner since we're using mock data

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

        {/* Category Tags */}
        <View style={styles.tagsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsScrollContent}
          >
            {currentCategoryTags.map(renderCategoryTag)}
          </ScrollView>
        </View>

        {/* All Events Section */}
        {filteredEvents.length > 0 ? (
          <View style={styles.allEventsList}>
            {filteredEvents.map((item) => (
              <View key={item.id} style={styles.cardWrapper}>
                {renderSimpleCard({ item })}
              </View>
            ))}
          </View>
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
  allEventsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardWrapper: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  simpleCard: {
    backgroundColor: '#FFFFFF', // White background
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm, // Padding inside the card
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  simpleCardImageWrapper: {
    width: '100%',
    height: 180,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md, // Rounded corners for image
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
  },
  simpleCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  simpleCardImagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleCardContent: {
    paddingHorizontal: 0, // No horizontal padding here as per screenshot
  },
  simpleCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // For left-right alignment
    width: '100%',
  },
  cardDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDetailLeft: {
    flex: 1, // Takes up remaining space on the left
    justifyContent: 'flex-start',
  },
  cardDetailRight: {
    justifyContent: 'flex-end', // Aligns to the right
  },
  cardDetailText: {
    fontSize: 13,
    color: Colors.text,
    flexShrink: 1,
  },
  tagsSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  tagsScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tagLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
