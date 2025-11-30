import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@theme';
import EventCard from '@components/event/EventCard';
import { Event } from '@types';
import { getAllEvents } from 'src/data/mockData';
import Header from '@components/common/Header';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'concert', label: 'Concerts', icon: 'music-note' },
  { id: 'experience', label: 'Experiences', icon: 'explore' },
  { id: 'festival', label: 'Festivals', icon: 'celebration' },
  { id: 'sports', label: 'Sports', icon: 'sports-soccer' },
  { id: 'party', label: 'Parties', icon: 'local-bar' },
  { id: 'workshop', label: 'Workshop', icon: 'school' },
  { id: 'food', label: 'Food', icon: 'restaurant' },
  { id: 'tech', label: 'Tech', icon: 'computer' },
];

// Get events from centralized mock data
const ALL_EVENTS = getAllEvents();

const SearchScreen = ({ navigation, route }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(ALL_EVENTS);

  useEffect(() => {
    if (route?.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route?.params?.category]);

  useEffect(() => {
    filterEvents();
  }, [searchQuery, selectedCategory]);

  const filterEvents = () => {
    let filtered = ALL_EVENTS;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.address.toLowerCase().includes(query) ||
        event.hostName?.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(filtered);
  };

  const renderCategoryChip = ({ item }: { item: typeof CATEGORIES[0] }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          isSelected && styles.categoryChipSelected,
        ]}
        onPress={() => setSelectedCategory(item.id)}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={item.icon as any}
          size={18}
          color={isSelected ? COLORS.white : COLORS.textLight}
        />
        <Text style={[
          styles.categoryChipText,
          isSelected && styles.categoryChipTextSelected,
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons name="search-off" size={48} color={COLORS.textLight} />
      </View>
      <Text style={styles.emptyTitle}>No Events Found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search or filters to find what you're looking for
      </Text>
      <TouchableOpacity
        style={styles.clearFiltersButton}
        onPress={() => {
          setSearchQuery('');
          setSelectedCategory('all');
        }}
      >
        <Text style={styles.clearFiltersText}>Clear All Filters</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResultsHeader = () => (
    <View style={styles.resultsHeader}>
      <Text style={styles.resultsCount}>
        {filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'} Found
      </Text>
      <TouchableOpacity style={styles.sortButton}>
        <MaterialIcons name="sort" size={18} color={COLORS.black} />
        <Text style={styles.sortText}>Sort</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Header with Logo and Search */}
        <Header
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search events, venues, artists..."
        />

        {/* Category Chips */}
        <View style={styles.categoriesWrapper}>
          <FlatList
            horizontal
            data={CATEGORIES}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {filteredEvents.length > 0 ? (
          <>
            {renderResultsHeader()}
            <View style={styles.eventsContainer}>
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
                />
              ))}
            </View>
          </>
        ) : (
          renderEmptyState()
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  categoriesWrapper: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoriesList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: SPACING.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  categoryChipTextSelected: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
  },
  eventsContainer: {
    paddingHorizontal: SPACING.lg,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xxl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  clearFiltersButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  clearFiltersText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default SearchScreen;
