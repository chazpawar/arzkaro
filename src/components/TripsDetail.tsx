import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { Spacing, BorderRadius } from '../constants/Styles';
import type { Event } from '../types';

// Dummy trip data since backend only has events mostly
export const DUMMY_TRIPS = [
  {
    id: 'trip1',
    title: 'Manali Backpacking',
    image:
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    date: '15-20 Dec',
    price: '₹8,499',
    rating: 4.7,
    location: 'Himachal Pradesh',
  },
  {
    id: 'trip2',
    title: 'Goa Beach Party',
    image:
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    date: '24-28 Dec',
    price: '₹12,999',
    rating: 4.5,
    location: 'Goa',
  },
  {
    id: 'trip3',
    title: 'Kasol & Kheerganga',
    image:
      'https://images.unsplash.com/photo-1455620611406-966ca6889d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    date: '10-14 Jan',
    price: '₹7,999',
    rating: 4.8,
    location: 'Himachal Pradesh',
  },
];

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
}

export default function TripsDetail({ events, onTripPress }: TripsDetailProps) {
  const [activeFilter, setActiveFilter] = useState('All');

  // Use passed events if available, otherwise fallback to empty (or we could keep DUMMY_TRIPS as a fallback if we really want, but better to move to real data)
  // For now, let's map the passed events to the structure we need, or update the UI to use Event type directly.
  // The UI expects: id, image, location, rating, title, date, price

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
          }),
          price: `₹${event.price}`,
          rating: 4.5, // Placeholder
          location: event.location_name || 'Unknown Location',
        }))
      : DUMMY_TRIPS;

  return (
    <View style={styles.container}>
      {/* Horizontal Tags ScrollView (Circular Icons like CategoryDetail) */}
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
      <ScrollView contentContainerStyle={styles.tripsList} scrollEnabled={false}>
        {displayTrips.map((trip) => (
          <Pressable key={trip.id} style={styles.tripCard} onPress={() => onTripPress?.(trip.id)}>
            <Image source={{ uri: trip.image }} style={styles.tripImage} />
            <View style={styles.tripContent}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripLocation}>{trip.location}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{trip.rating} ★</Text>
                </View>
              </View>

              <Text style={styles.tripTitle}>{trip.title}</Text>
              <Text style={styles.tripDate}>{trip.date}</Text>

              <View style={styles.tripFooter}>
                <Text style={styles.tripPrice}>
                  {trip.price} <Text style={styles.perPerson}>/ person</Text>
                </Text>
                <View style={styles.bookButton}>
                  <Text style={styles.bookButtonText}>View</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Circular Tags Styles (Matched to CategoryDetail)
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
  // Section Header
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
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  // Card Styles (Matched to new big card style)
  tripCard: {
    flexDirection: 'row', // Make it horizontal
    alignItems: 'center', // Align items center vertically
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm, // Add padding like other cards
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tripImage: {
    width: 100, // Fixed width like other cards
    height: 100, // Fixed height like other cards
    borderRadius: BorderRadius.lg, // Match border radius style
    marginRight: Spacing.md,
  },
  tripContent: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.sm, // Reduced padding
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4, // Reduced margin
  },
  tripLocation: {
    fontSize: 12, // Smaller font
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  ratingBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#FFF',
  },
  tripTitle: {
    fontSize: 16, // Smaller title
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  tripDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
  },
  tripPrice: {
    fontSize: 16, // Smaller price
    fontFamily: Fonts.extraBold,
    color: Colors.primary,
  },
  perPerson: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  bookButtonText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#FFF',
  },
});
