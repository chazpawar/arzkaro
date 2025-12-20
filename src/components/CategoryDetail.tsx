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
      location: 'Pitampura',
      timing: '5:00 PM',
    },
    {
      id: '2',
      name: `Just ${category} It`,
      image:
        'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      location: 'Rohini',
      timing: '6:00 PM',
    },
    {
      id: '3',
      name: `Northern Daredevils`,
      image:
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      location: 'Pitampura',
      timing: '7:00 PM',
    },
    {
      id: '4',
      name: `${category} Warriors`,
      image:
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      location: 'Dwarka',
      timing: '5:30 PM',
    },
  ];
};

interface CategoryDetailProps {
  type: 'events' | 'experiences';
  tags: {
    id: string;
    label: string;
    icon: any;
    subcategories?: { id: string; label: string; icon: any }[];
  }[];
  selectedTag: string;
  onSelectTag: (tagId: string) => void;
  events: Event[];
  onEventPress: (eventId: string) => void;
  showInline?: boolean; // New prop to control inline vs full page view
}

export default function CategoryDetail({
  type,
  tags,
  selectedTag,
  onSelectTag,
  events,
  onEventPress,
  showInline = false,
}: CategoryDetailProps) {
  const [selectedSubcategory, setSelectedSubcategory] = React.useState<string | null>(null);

  const clubs = generateClubs(
    selectedSubcategory || (selectedTag === 'all' ? 'Sports' : selectedTag)
  );

  // Find the selected main category to check for subcategories
  const selectedMainCategory = tags.find((tag) => tag.id === selectedTag);
  const hasSubcategories =
    selectedMainCategory?.subcategories && selectedMainCategory.subcategories.length > 0;

  // Reset subcategory when main category changes
  React.useEffect(() => {
    setSelectedSubcategory(null);
  }, [selectedTag]);

  // Filter events based on subcategory selection
  const filteredEvents = React.useMemo(() => {
    if (!selectedSubcategory) {
      return events;
    }
    // Filter events by subcategory - assuming event.tags or event.category contains subcategory
    return events.filter((event) => {
      // Check if event tags include the subcategory
      if (
        event.tags &&
        event.tags.some((tag) => tag.toLowerCase() === selectedSubcategory.toLowerCase())
      ) {
        return true;
      }
      // Also check if event category matches
      if (event.category?.toLowerCase() === selectedSubcategory.toLowerCase()) {
        return true;
      }
      return false;
    });
  }, [events, selectedSubcategory]);

  // Prepare tags to display based on selection
  const displayTags = React.useMemo(() => {
    if (selectedTag === 'all') {
      // Show all tags when 'all' is selected
      return tags;
    } else if (hasSubcategories) {
      // Show selected category + its subcategories
      const mainCategory = tags.find((tag) => tag.id === selectedTag);
      if (mainCategory && mainCategory.subcategories) {
        return [
          mainCategory,
          ...mainCategory.subcategories.map((sub) => ({
            id: sub.id,
            label: sub.label,
            icon: sub.icon,
          })),
        ];
      }
    }
    // If no subcategories, just show the selected category
    return tags.filter((tag) => tag.id === selectedTag);
  }, [tags, selectedTag, hasSubcategories]);

  const renderClubCard = (club: any) => (
    <Pressable
      key={club.id}
      style={styles.clubCard}
      onPress={() => {
        // You can add club-specific navigation here if needed
        // For now, we'll leave it as is since clubs are dummy data
      }}
    >
      <View style={styles.clubCardInner}>
        <Image source={{ uri: club.image }} style={styles.clubImage} />
        <View style={styles.clubContent}>
          <Text style={styles.clubName} numberOfLines={1}>
            {club.name}
          </Text>
          <View style={styles.clubInfoRow}>
            <View style={styles.clubLocationRow}>
              <Ionicons name="location" size={14} color={Colors.primary} />
              <Text style={styles.clubLocationText} numberOfLines={1}>
                {club.location}
              </Text>
            </View>
            <View style={styles.clubTimingRow}>
              <Ionicons name="time-outline" size={14} color={Colors.primary} />
              <Text style={styles.clubTimingText}>{club.timing}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
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
          {displayTags.map((tag) => {
            // For subcategories, check if it matches the selected subcategory
            const isSubcategory = selectedMainCategory?.subcategories?.some(
              (sub) => sub.id === tag.id
            );
            const isSelected = isSubcategory
              ? selectedSubcategory === tag.id
              : selectedTag === tag.id;

            return (
              <Pressable
                key={tag.id}
                style={styles.tagItem}
                onPress={() => {
                  if (isSubcategory) {
                    // If it's a subcategory, set the subcategory
                    setSelectedSubcategory(selectedSubcategory === tag.id ? null : tag.id);
                  } else {
                    // If it's a main category, handle normal selection
                    onSelectTag(tag.id);
                  }
                }}
              >
                <View style={styles.tagIconContainer}>
                  <Image source={tag.icon} style={styles.tagIcon} resizeMode="contain" />
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

      {/* Only show content below if showInline is true OR a specific category is selected */}
      {(showInline || selectedTag !== 'all') && (
        <>
          {/* Show clubs only when 'all' is selected or no subcategories */}
          {(selectedTag === 'all' || !hasSubcategories) && (
            <>
              <Text style={styles.sectionHeader}>
                {clubs.length}{' '}
                {selectedSubcategory
                  ? selectedSubcategory
                  : selectedTag === 'all'
                    ? 'Popular'
                    : selectedTag}{' '}
                Clubs
              </Text>

              {/* Clubs List */}
              <View style={styles.clubsGrid}>{clubs.map(renderClubCard)}</View>
            </>
          )}

          <Text style={styles.sectionHeader}>
            {hasSubcategories && selectedTag !== 'all'
              ? selectedSubcategory
                ? `${selectedSubcategory} Events`
                : `${selectedTag} Events`
              : `Upcoming ${type === 'events' ? 'Events' : 'Experiences'}`}
          </Text>

          {/* Events Grid - Same as Clubs Grid */}
          <View style={styles.eventsGrid}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <Pressable
                  key={event.id}
                  style={styles.clubCard}
                  onPress={() => onEventPress(event.id)}
                >
                  <View style={styles.clubCardInner}>
                    <Image
                      source={{ uri: event.cover_image_url || 'https://via.placeholder.com/150' }}
                      style={styles.clubImage}
                    />
                    <View style={styles.clubContent}>
                      <Text style={styles.clubName} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <View style={styles.clubInfoRow}>
                        <View style={styles.clubLocationRow}>
                          <Ionicons name="location" size={14} color={Colors.primary} />
                          <Text style={styles.clubLocationText} numberOfLines={1}>
                            {event.location_name || 'Location TBA'}
                          </Text>
                        </View>
                        <View style={styles.clubTimingRow}>
                          <Ionicons name="time-outline" size={14} color={Colors.primary} />
                          <Text style={styles.clubTimingText}>
                            {new Date(event.start_date).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>No {type} found for this category.</Text>
            )}
          </View>
        </>
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
    gap: Spacing.lg,
  },
  tagItem: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  tagIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
  },
  tagIcon: {
    width: 64,
    height: 64,
  },
  checkBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
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
  subcategoriesContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subcategoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  subcategoriesContent: {
    gap: Spacing.sm,
  },
  subcategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  subcategoryIcon: {
    width: 20,
    height: 20,
  },
  subcategoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  subcategoryCardsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  subcategoryCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  subcategoryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  subcategoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subcategoryCardIcon: {
    width: 32,
    height: 32,
  },
  subcategoryCardTextContainer: {
    flex: 1,
  },
  subcategoryCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subcategoryCardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  breadcrumbContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  breadcrumbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
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
  clubsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  clubCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  clubCardInner: {
    padding: Spacing.sm,
  },
  clubImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#f0f0f0',
  },
  clubContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    alignItems: 'center',
    minHeight: 50,
  },
  clubName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 18,
    textAlign: 'center',
    height: 18,
  },
  clubInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  clubLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  clubLocationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  clubTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clubTimingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    width: '100%',
  },
});
