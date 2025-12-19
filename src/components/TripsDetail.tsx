import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Image } from 'react-native';
import { Colors } from '../constants/Colors';
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

interface TripsDetailProps {
  events: Event[]; // In case we want to use real data later
}

export default function TripsDetail({ events: _events }: TripsDetailProps) {
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Weekend', 'Budget', 'Luxury', 'Adventure'];

  return (
    <View style={styles.container}>
      {/* Filters ScrollView */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <Pressable
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sectionHeader}>Popular Trips</Text>

      {/* Trips List */}
      <ScrollView contentContainerStyle={styles.tripsList} scrollEnabled={false}>
        {DUMMY_TRIPS.map((trip) => (
          <View key={trip.id} style={styles.tripCard}>
            <Image source={{ uri: trip.image }} style={styles.tripImage} />
            <View style={styles.tripContent}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripLocation}>{trip.location}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>★ {trip.rating}</Text>
                </View>
              </View>
              <Text style={styles.tripTitle}>{trip.title}</Text>
              <Text style={styles.tripDate}>{trip.date}</Text>
              <View style={styles.tripFooter}>
                <Text style={styles.tripPrice}>
                  {trip.price} <Text style={styles.perPerson}>/ person</Text>
                </Text>
                <Pressable style={styles.bookButton}>
                  <Text style={styles.bookButtonText}>View</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: Spacing.md,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    color: Colors.text,
  },
  tripsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
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
  tripImage: {
    width: '100%',
    height: 200,
  },
  tripContent: {
    padding: Spacing.md,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tripLocation: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  tripDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  tripPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  perPerson: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  bookButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
});
