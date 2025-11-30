import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@context/AuthContext';
import { getTrendingEvents, getUpcomingEvents, MOCK_USERS } from 'src/data/mockData';
import { Event } from '@types';
import { COLORS, SPACING } from '@theme';
import Header from '@components/common/Header';

// Mock host requests data
const MOCK_HOST_REQUESTS = MOCK_USERS.filter(u => !u.isHost && !u.isAdmin).map(u => ({
  ...u,
  requestDate: '2024-03-15',
  status: 'pending',
}));

const { width } = Dimensions.get('window');
const HORIZONTAL_CARD_WIDTH = width * 0.65;



const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hostRequests] = useState(MOCK_HOST_REQUESTS);
  const [showAdminBar, setShowAdminBar] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    setTrendingEvents(getTrendingEvents());
    setUpcomingEvents(getUpcomingEvents());
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

  // Horizontal scroll event card
  const renderHorizontalEventCard = (event: Event, index: number) => (
    <TouchableOpacity
      key={`horizontal-${event.id}-${index}`}
      style={styles.horizontalEventCard}
      onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
      activeOpacity={0.9}
    >
      {/* Top section with title and details */}
      <View style={styles.cardHeader}>
        <Text style={styles.horizontalEventTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.horizontalEventMeta} numberOfLines={1}>
          {event.category || 'Event'} | {formatEventDate(event.date)}
        </Text>
      </View>
      {/* Square image with padding */}
      <View style={styles.cardImageContainer}>
        <Image source={{ uri: event.bannerImage }} style={styles.horizontalEventImage} />
      </View>
    </TouchableOpacity>
  );

  // Admin Quick Access Bar
  const AdminQuickBar = () => (
    <View style={styles.adminQuickBar}>
      <View style={styles.adminQuickHeader}>
        <View style={styles.adminBadge}>
          <MaterialIcons name="admin-panel-settings" size={14} color={COLORS.white} />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAdminBar(!showAdminBar)}>
          <Ionicons
            name={showAdminBar ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textGray}
          />
        </TouchableOpacity>
      </View>
      
      {showAdminBar && (
        <View style={styles.adminQuickActions}>
          <TouchableOpacity
            style={styles.adminQuickAction}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <View style={[styles.adminActionIcon, { backgroundColor: COLORS.primaryMuted }]}>
              <MaterialIcons name="dashboard" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.adminActionText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adminQuickAction}
            onPress={() => navigation.navigate('CreateEvent')}
          >
            <View style={[styles.adminActionIcon, { backgroundColor: '#E8F5E9' }]}>
              <MaterialIcons name="add-circle" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.adminActionText}>Create</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adminQuickAction}
            onPress={() => navigation.navigate('AdminEvents')}
          >
            <View style={[styles.adminActionIcon, { backgroundColor: '#E3F2FD' }]}>
              <MaterialIcons name="event-note" size={18} color={COLORS.info} />
            </View>
            <Text style={styles.adminActionText}>Events</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adminQuickAction}
            onPress={() => navigation.navigate('AdminHostRequests')}
          >
            <View style={[styles.adminActionIcon, { backgroundColor: '#FFF3E0' }]}>
              <MaterialIcons name="how-to-reg" size={18} color={COLORS.warning} />
            </View>
            <Text style={styles.adminActionText}>Requests</Text>
            {hostRequests.length > 0 && (
              <View style={styles.requestBadge}>
                <Text style={styles.requestBadgeText}>{hostRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Regular User View (now used for admin as well)
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
          searchPlaceholder="Search events, experiences..."
        />

        {/* Admin Quick Access Bar - Only for admins */}
        {user?.isAdmin && <AdminQuickBar />}

        {/* Popular Events - Horizontal Scroll */}
        <View style={styles.sectionNoHorizontalPadding}>
          <View style={styles.sectionHeaderPadded}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Events</Text>
                <Text style={styles.sectionSubtitle}>Book events here</Text>
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => navigation.navigate('AllEvents', { type: 'events' })}
              >
                <Text style={styles.viewButtonText}>View</Text>
                <MaterialIcons name="chevron-right" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
            decelerationRate="fast"
            snapToInterval={HORIZONTAL_CARD_WIDTH + 12}
          >
            {trendingEvents.map((event, index) => renderHorizontalEventCard(event, index))}
          </ScrollView>
        </View>

        {/* Experiences - Horizontal Scroll */}
        <View style={styles.sectionNoHorizontalPadding}>
          <View style={styles.sectionHeaderPadded}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Experiences</Text>
                <Text style={styles.sectionSubtitle}>Book experiences in here</Text>
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => navigation.navigate('AllEvents', { type: 'experiences' })}
              >
                <Text style={styles.viewButtonText}>View</Text>
                <MaterialIcons name="chevron-right" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
            decelerationRate="fast"
            snapToInterval={HORIZONTAL_CARD_WIDTH + 12}
          >
            {upcomingEvents.map((event, index) => renderHorizontalEventCard(event, index))}
          </ScrollView>
        </View>

        {/* Create Event Button for hosts and admins */}
        {(user?.isHost || user?.isAdmin) && (
          <View style={styles.hostSection}>
            <TouchableOpacity
              style={styles.createEventButton}
              onPress={() => navigation.navigate('CreateEvent')}
            >
              <MaterialIcons name="add" size={20} color={COLORS.white} />
              <Text style={styles.hostButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
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
  // Admin Quick Bar
  adminQuickBar: {
    backgroundColor: COLORS.backgroundLight,
    marginHorizontal: SPACING.lg,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  adminQuickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  adminQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  adminQuickAction: {
    alignItems: 'center',
    position: 'relative',
  },
  adminActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminActionText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textGray,
  },
  requestBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.error,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  sectionNoHorizontalPadding: {
    marginTop: SPACING.lg,
  },
  sectionHeaderPadded: {
    paddingHorizontal: SPACING.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: SPACING.md,
  },
  // Horizontal scroll styles
  horizontalScrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: 16,
  },
  horizontalEventCard: {
    width: HORIZONTAL_CARD_WIDTH,
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    overflow: 'hidden',
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
  horizontalEventImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
  },
  horizontalEventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  horizontalEventMeta: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.85,
  },
  hostSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  hostButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default HomeScreen;
