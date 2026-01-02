import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';
import { Fonts } from '../constants/Fonts';
import type { Event } from '../types';

const TRIP_CATEGORIES = [
  { id: 'All', label: 'All', icon: 'grid-outline' },
  { id: 'Weekend', label: 'Weekend', icon: 'calendar-outline' },
  { id: 'Budget', label: 'Budget', icon: 'wallet-outline' },
  { id: 'Luxury', label: 'Luxury', icon: 'diamond-outline' },
  { id: 'Adventure', label: 'Adventure', icon: 'compass-outline' },
];

interface TripsDetailProps {
  events: Event[];
  onTripPress?: (tripId: string) => void;
  showInline?: boolean; // If true, shows content inline without full-page takeover
}

// Helper function to calculate duration in days
function calculateDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const nights = diffDays > 0 ? diffDays - 1 : 0;
  return `${diffDays}D, ${nights}N`;
}

export default function TripsDetail({
  events,
  onTripPress,
  showInline: _showInline = false,
}: TripsDetailProps) {
  const [activeFilter, setActiveFilter] = useState('All');

  const displayTrips =
    events.length > 0
      ? events.map((event) => ({
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
                onPress={() => setActiveFilter(cat.id)}
              >
                <View style={[styles.tagIconCircle, isSelected && styles.tagIconCircleSelected]}>
                  <Ionicons
                    name={cat.icon as any}
                    size={28}
                    color={isSelected ? '#FFF' : Colors.primary}
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

                  {/* Attendees Avatars */}
                  <View style={styles.attendeesRow}>
                    <View style={styles.avatarStack}>
                      {/* Mock avatars */}
                      <View style={[styles.avatar, { backgroundColor: '#FF6B6B' }]}>
                        <Text style={styles.avatarText}>A</Text>
                      </View>
                      <View
                        style={[
                          styles.avatar,
                          styles.avatarOverlap,
                          { backgroundColor: '#4ECDC4' },
                        ]}
                      >
                        <Text style={styles.avatarText}>B</Text>
                      </View>
                      <View
                        style={[
                          styles.avatar,
                          styles.avatarOverlap,
                          { backgroundColor: '#95E1D3' },
                        ]}
                      >
                        <Text style={styles.avatarText}>C</Text>
                      </View>
                    </View>
                    <Text style={styles.joinedText}>+{trip.attendeesCount} Joined</Text>
                  </View>
                </View>

                {/* Price Button */}
                <Pressable style={styles.priceButton}>
                  <Text style={styles.priceText}>{trip.price}/-</Text>
                </Pressable>
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
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagIconCircleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    borderWidth: 2,
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
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    textAlign: 'left',
  },
  tripsList: {
    paddingHorizontal: Spacing.lg,
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
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
  priceButton: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: Spacing.xs,
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
