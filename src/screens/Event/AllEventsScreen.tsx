import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getTrendingEvents, getUpcomingEvents } from 'src/data/mockData';
import { Event } from '@types';
import { COLORS, SPACING } from '@theme';
import Header from '@components/common/Header';

interface AllEventsScreenProps {
  navigation: any;
  route: any;
}

const AllEventsScreen: React.FC<AllEventsScreenProps> = ({ navigation, route }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get the type from route params (events or experiences)
  const type = route.params?.type || 'events';
  const title = type === 'experiences' ? 'All Experiences' : 'All Events';

  useEffect(() => {
    loadEvents();
  }, [type]);

  const loadEvents = () => {
    // Get all events and remove duplicates
    const trendingEvents = getTrendingEvents();
    const upcomingEvents = getUpcomingEvents();
    
    const allEventsMap = new Map<string, Event>();
    [...trendingEvents, ...upcomingEvents].forEach(event => {
      if (!allEventsMap.has(event.id)) {
        allEventsMap.set(event.id, event);
      }
    });
    
    setEvents(Array.from(allEventsMap.values()));
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadEvents();
    }, 500);
  };

  // Format date for display
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  };

  // Filter events based on search query
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Vertical event card
  const renderEventCard = (event: Event, index: number) => (
    <TouchableOpacity
      key={`event-${event.id}-${index}`}
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
      activeOpacity={0.9}
    >
      {/* Top section with title and details */}
      <View style={styles.cardHeader}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.eventMeta} numberOfLines={1}>
          {event.category || 'Event'} | {formatEventDate(event.date)}
        </Text>
      </View>
      {/* Square image with padding */}
      <View style={styles.cardImageContainer}>
        <Image source={{ uri: event.bannerImage }} style={styles.eventImage} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo and Search */}
        <Header
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={`Search ${type}...`}
        />

        {/* Back Button and Title */}
        <View style={styles.titleContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Events List */}
        <View style={styles.eventsContainer}>
          {filteredEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={48} color={COLORS.textGray} />
              <Text style={styles.emptyText}>No {type} found</Text>
            </View>
          ) : (
            filteredEvents.map((event, index) => renderEventCard(event, index))
          )}
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  placeholder: {
    width: 40,
  },
  eventsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  eventCard: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  cardHeader: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  cardImageContainer: {
    paddingTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  eventImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.85,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textGray,
    marginTop: SPACING.md,
  },
});

export default AllEventsScreen;
