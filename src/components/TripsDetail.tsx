import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';
import { Fonts } from '../constants/Fonts';
import type { Event } from '../types';
import { getEventBookings } from '../services/booking-service';

const TRIP_CATEGORIES = [
  { id: 'All', label: 'All', image: require('../../assets/trips/AllTrips.png') },
  { id: 'Adventure', label: 'Adventure', image: require('../../assets/trips/Adventure.png') },
  { id: 'Leisure', label: 'Leisure', image: require('../../assets/trips/Leisure.png') },
  { id: 'Offbeat', label: 'Offbeat', image: require('../../assets/trips/Offbeat.png') },
  { id: 'Spiritual', label: 'Spiritual', image: require('../../assets/trips/Spiritual.png') },
  { id: 'Nature', label: 'Nature', image: require('../../assets/trips/Nature.png') },
  { id: 'Festival', label: 'Festival', image: require('../../assets/trips/Festival.png') },
  { id: 'Food & Culture', label: 'Food & Culture', image: require('../../assets/trips/Food.png') },
  { id: 'Getaway', label: 'Getaway', image: require('../../assets/trips/Getaway.png') },
];

interface TripsDetailProps {
  events: Event[];
  onTripPress?: (tripId: string) => void;
  showInline?: boolean; // If true, shows content inline without full-page takeover
}

interface AttendeeAvatar {
  id: string;
  avatar_url: string | null;
  full_name: string | null;
}

type EventAttendees = Record<string, AttendeeAvatar[]>;

// Helper function to calculate duration in days
function calculateDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const nights = diffDays > 0 ? diffDays - 1 : 0;
  return `${diffDays}D, ${nights}N`;
}

// Helper function to get avatar color
function getAvatarColor(index: number): string {
  const colors = ['#FF6B6B', '#4ECDC4', '#95E1D3'];
  return colors[index % colors.length];
}

export default function TripsDetail({
  events,
  onTripPress,
  showInline: _showInline = false,
}: TripsDetailProps) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [eventAttendees, setEventAttendees] = useState<EventAttendees>({});

  // Fetch attendees for all events
  useEffect(() => {
    const fetchAttendees = async () => {
      const attendeesData: EventAttendees = {};

      await Promise.all(
        events.map(async (event) => {
          try {
            const bookings = await getEventBookings(event.id);
            // Get unique users and their avatars (limit to first 3)
            const uniqueUsers = new Map<string, AttendeeAvatar>();

            bookings.forEach((booking: any) => {
              if (booking.user && booking.status === 'confirmed') {
                uniqueUsers.set(booking.user.id, {
                  id: booking.user.id,
                  avatar_url: booking.user.avatar_url,
                  full_name: booking.user.full_name,
                });
              }
            });

            attendeesData[event.id] = Array.from(uniqueUsers.values()).slice(0, 3);
          } catch (error) {
            console.error(`Failed to fetch attendees for event ${event.id}:`, error);
            attendeesData[event.id] = [];
          }
        })
      );

      setEventAttendees(attendeesData);
    };

    if (events.length > 0) {
      fetchAttendees();
    }
  }, [events]);

  // Filter events based on selected category
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'All') {
      return events;
    }

    return events.filter((event) => {
      // Check if event's category matches the selected filter
      if (event.category?.toLowerCase() === activeFilter.toLowerCase()) {
        return true;
      }

      // Check if event's tags include the selected filter
      if (event.tags && Array.isArray(event.tags)) {
        return event.tags.some((tag) => tag.toLowerCase() === activeFilter.toLowerCase());
      }

      return false;
    });
  }, [events, activeFilter]);

  const displayTrips =
    filteredEvents.length > 0
      ? filteredEvents.map((event) => ({
          id: event.id,
          title: event.title,
          image:
            event.cover_image_url ||
            'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
          date: new Date(event.start_date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          price: event.price,
          location: event.location_name || 'Unknown Location',
          duration: calculateDuration(event.start_date, event.end_date),
          hostName: event.host?.full_name || 'Arzkaro',
          attendeesCount: event.current_bookings || 0,
          attendees: eventAttendees[event.id] || [],
        }))
      : [];

  return (
    <View style={styles.container}>
      {/* Horizontal Tags ScrollView */}
      <View style={styles.tagsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContent}
        >
          {TRIP_CATEGORIES.map((cat) => {
            const isSelected = activeFilter === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={styles.tagItem}
                onPress={() => {
                  // If it's "All" and already selected, do nothing
                  if (cat.id === 'All' && isSelected) {
                    return;
                  }
                  setActiveFilter(cat.id);
                }}
              >
                <View style={[styles.tagIconCircle, isSelected && styles.tagIconCircleSelected]}>
                  <Image
                    source={cat.image}
                    style={[styles.categoryImage, cat.id === 'Nature' && styles.categoryImageLarge]}
                    resizeMode="contain"
                  />
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    </View>
                  )}
                </View>
                <Text style={[styles.tagLabel, isSelected && styles.tagLabelSelected]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Text style={styles.sectionHeader}>{displayTrips.length} Popular Trips</Text>

      {/* Trips List */}
      {displayTrips.length > 0 ? (
        <ScrollView contentContainerStyle={styles.tripsList} scrollEnabled={false}>
          {displayTrips.map((trip) => (
            <Pressable key={trip.id} style={styles.tripCard} onPress={() => onTripPress?.(trip.id)}>
              {/* Left Side - Trip Image */}
              <Image source={{ uri: trip.image }} style={styles.tripImage} />

              {/* Right Side - Trip Details */}
              <View style={styles.tripContent}>
                {/* Host Row with Logo and Name */}
                <View style={styles.hostRow}>
                  <Image
                    source={require('../../assets/arz.png')}
                    style={styles.hostLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.hostName}>{trip.hostName}</Text>
                </View>

                {/* Trip Title */}
                <Text style={styles.tripTitle} numberOfLines={2}>
                  {trip.title}
                </Text>

                {/* Location */}
                <View style={styles.infoRow}>
                  <Image
                    source={require('../../assets/others/location.png')}
                    style={styles.icon}
                    resizeMode="contain"
                  />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {trip.location}
                  </Text>
                </View>

                {/* Date */}
                <View style={styles.infoRow}>
                  <Image
                    source={require('../../assets/others/dateandtime.png')}
                    style={styles.icon}
                    resizeMode="contain"
                  />
                  <Text style={styles.infoText}>{trip.date}</Text>
                </View>

                {/* Duration and Attendees Row */}
                <View style={styles.bottomRow}>
                  <Text style={styles.duration}>{trip.duration}</Text>

                  {/* Attendees Avatars - Only show if there are attendees */}
                  {trip.attendees.length > 0 && (
                    <View style={styles.attendeesRow}>
                      <View style={styles.avatarStack}>
                        {trip.attendees.map((attendee, index) => (
                          <View
                            key={attendee.id}
                            style={[styles.avatar, index > 0 && styles.avatarOverlap]}
                          >
                            {attendee.avatar_url ? (
                              <Image
                                source={{ uri: attendee.avatar_url }}
                                style={styles.avatarImage}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.avatarPlaceholder,
                                  { backgroundColor: getAvatarColor(index) },
                                ]}
                              >
                                <Text style={styles.avatarText}>
                                  {attendee.full_name?.charAt(0).toUpperCase() || '?'}
                                </Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                      <Text style={styles.joinedText}>+{trip.attendeesCount} Joined</Text>
                    </View>
                  )}
                </View>

                {/* Price Button */}
                <View style={styles.priceButtonContainer}>
                  <Pressable style={styles.priceButton}>
                    <Text style={styles.priceText}>{trip.price}/-</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Image
            source={require('../../assets/others/location.png')}
            style={{ width: 64, height: 64, opacity: 0.3 }}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>No trips found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tagsContainer: {
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  tagsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tagItem: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 2,
  },
  tagIconCircle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    height: 68,
  },
  tagIconCircleSelected: {
    // No background or border changes needed
  },
  checkBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
    zIndex: 10,
  },
  categoryImage: {
    width: 56,
    height: 56,
  },
  categoryImageLarge: {
    width: 76,
    height: 76,
  },
  tagLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
    marginTop: 4,
  },
  tagLabelSelected: {
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  sectionHeader: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginHorizontal: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    textAlign: 'left',
  },
  tripsList: {
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  tripCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: 180,
  },
  tripImage: {
    width: 160,
    height: 180,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.border,
  },
  tripContent: {
    flex: 1,
    paddingLeft: Spacing.lg,
    justifyContent: 'space-between',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  hostLogo: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  hostName: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  tripTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  duration: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: '#fff',
  },
  joinedText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  priceButtonContainer: {
    alignItems: 'flex-end',
    marginTop: Spacing.xs,
  },
  priceButton: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  priceText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
