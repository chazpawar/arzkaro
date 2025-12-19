import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';
import type { Event } from '../types';

// Dummy data generator for clubs/groups
const generateClubs = (category: string) => {
  return [
    {
      id: '1',
      name: `${category} Club of India`,
      image:
        'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      rating: 4.5,
      members: 26,
      location: 'Pitampura',
    },
    {
      id: '2',
      name: `Just ${category} It`,
      image:
        'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      rating: 4.8,
      members: 88,
      location: 'Rohini',
    },
    {
      id: '3',
      name: `Northern Daredevils`,
      image:
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      rating: 0,
      members: 12,
      location: 'Pitampura',
    },
  ];
};

interface CategoryDetailProps {
  type: 'events' | 'experiences';
  tags: { id: string; label: string; icon: string }[];
  selectedTag: string;
  onSelectTag: (tagId: string) => void;
  events: Event[];
  onEventPress: (eventId: string) => void;
}

export default function CategoryDetail({
  type,
  tags,
  selectedTag,
  onSelectTag,
  events,
  onEventPress,
}: CategoryDetailProps) {
  const clubs = generateClubs(selectedTag === 'all' ? 'Sports' : selectedTag);

  const renderClubCard = (club: any) => (
    <View key={club.id} style={styles.clubCard}>
      <Image source={{ uri: club.image }} style={styles.clubImage} />
      <View style={styles.clubContent}>
        <Text style={styles.clubCategory}>
          {selectedTag === 'all' ? 'General' : selectedTag} Club
        </Text>
        <Text style={styles.clubName} numberOfLines={2}>
          {club.name}
        </Text>

        <View style={styles.ratingRow}>
          {club.rating > 0 ? (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{club.rating} ★</Text>
            </View>
          ) : (
            <View style={styles.noRatingBadge}>
              <Text style={styles.noRatingText}>-- ★</Text>
            </View>
          )}
          <Text style={styles.memberCount}>
            ({club.rating > 0 ? club.members : 'No ratings yet'})
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.locationText}>{club.location}</Text>
          <Pressable style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Book Now</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Horizontal Tags ScrollView (Circular Icons) */}
      <View style={styles.tagsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContent}
        >
          {tags.map((tag) => {
            const isSelected = selectedTag === tag.id;
            return (
              <Pressable key={tag.id} style={styles.tagItem} onPress={() => onSelectTag(tag.id)}>
                <View style={[styles.tagIconCircle, isSelected && styles.tagIconCircleSelected]}>
                  <Ionicons
                    name={tag.icon as any}
                    size={32}
                    color={isSelected ? '#FFF' : Colors.primary}
                  />
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                </View>
                <Text style={[styles.tagLabel, isSelected && styles.tagLabelSelected]}>
                  {tag.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Text style={styles.sectionHeader}>
        {clubs.length} {selectedTag === 'all' ? 'Popular' : selectedTag} Clubs
      </Text>

      {/* Clubs List */}
      <View style={styles.clubsList}>{clubs.map(renderClubCard)}</View>

      <Text style={styles.sectionHeader}>
        Upcoming {type === 'events' ? 'Events' : 'Experiences'}
      </Text>

      {/* Events List */}
      <View style={styles.eventsList}>
        {events.length > 0 ? (
          events.map((event) => (
            <Pressable
              key={event.id}
              style={styles.eventCard}
              onPress={() => onEventPress(event.id)}
            >
              <Image
                source={{ uri: event.cover_image_url || 'https://via.placeholder.com/150' }}
                style={styles.eventImage}
              />
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>{new Date(event.start_date).toDateString()}</Text>
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>No {type} found for this category.</Text>
        )}
      </View>
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
    gap: Spacing.lg,
  },
  tagItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tagIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    top: 0,
    right: 0,
    backgroundColor: '#FFB800',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  tagLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 6,
  },
  tagLabelSelected: {
    color: Colors.text,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    textAlign: 'left',
  },
  clubsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
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
  clubImage: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginRight: Spacing.lg,
    backgroundColor: '#f0f0f0',
  },
  clubContent: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 100,
  },
  clubCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  clubName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  noRatingBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  noRatingText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  memberCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md, // Reduced padding
    paddingVertical: 6, // Reduced padding
    borderRadius: BorderRadius.full,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 12, // Reduced font size
    fontWeight: '600',
  },
  eventsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  eventCard: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  eventImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});
