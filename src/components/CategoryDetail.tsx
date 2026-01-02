import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';
import type { Event } from '../types';
import { Fonts } from '../constants/Fonts';

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
  const scrollViewRef = React.useRef<ScrollView>(null);
  const scaleAnims = React.useRef<Record<string, Animated.Value>>({});

  // Find the selected main category to check for subcategories
  const selectedMainCategory = tags.find((tag) => tag.id === selectedTag);
  const hasSubcategories =
    selectedMainCategory?.subcategories && selectedMainCategory.subcategories.length > 0;

  // Initialize scale animations for all tags
  React.useEffect(() => {
    tags.forEach((tag) => {
      if (!scaleAnims.current[tag.id]) {
        scaleAnims.current[tag.id] = new Animated.Value(1);
      }
    });
    // Also initialize for subcategories
    tags.forEach((tag) => {
      if (tag.subcategories) {
        tag.subcategories.forEach((sub) => {
          if (!scaleAnims.current[sub.id]) {
            scaleAnims.current[sub.id] = new Animated.Value(1);
          }
        });
      }
    });
  }, [tags]);

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

  // Prepare tags to display based on selection - with reordering
  const displayTags = React.useMemo(() => {
    let result: any[] = [];

    if (selectedTag === 'all' || selectedTag === 'All') {
      // Show all tags when 'all' or 'All' is selected
      result = tags;
    } else if (hasSubcategories) {
      // Show selected category + its subcategories
      const mainCategory = tags.find((tag) => tag.id === selectedTag);
      if (mainCategory && mainCategory.subcategories) {
        // Create a structure with main category first, then subcategories
        result = [
          mainCategory,
          ...mainCategory.subcategories.map((sub) => ({
            id: sub.id,
            label: sub.label,
            icon: sub.icon,
            isSubcategory: true,
          })),
        ];
      }
    } else {
      // If no subcategories, show all tags but reordered
      const selectedIndex = tags.findIndex((tag) => tag.id === selectedTag);
      if (selectedIndex > 0) {
        // Move selected to first position
        result = [
          tags[selectedIndex],
          ...tags.slice(0, selectedIndex),
          ...tags.slice(selectedIndex + 1),
        ];
      } else {
        result = tags;
      }
    }

    return result;
  }, [tags, selectedTag, hasSubcategories]);

  // Scroll to start and animate scale when selection changes
  React.useEffect(() => {
    if (selectedTag !== 'all' && selectedTag !== 'All' && scrollViewRef.current) {
      // Scroll to beginning
      scrollViewRef.current.scrollTo({ x: 0, animated: true });

      // Animate scale for selected tag
      Object.keys(scaleAnims.current).forEach((tagId) => {
        const isSelected = tagId === selectedTag;
        Animated.spring(scaleAnims.current[tagId], {
          toValue: isSelected ? 1.15 : 1,
          useNativeDriver: true,
          friction: 6,
        }).start();
      });
    } else if (selectedTag === 'all' || selectedTag === 'All') {
      // Reset all scales when back to 'all' or 'All'
      Object.keys(scaleAnims.current).forEach((tagId) => {
        Animated.spring(scaleAnims.current[tagId], {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
        }).start();
      });
    }
  }, [selectedTag]);

  // Animate scale for subcategory selection
  React.useEffect(() => {
    if (selectedSubcategory && scaleAnims.current[selectedSubcategory]) {
      // Scale the selected subcategory
      Object.keys(scaleAnims.current).forEach((tagId) => {
        if (selectedMainCategory?.subcategories?.some((sub) => sub.id === tagId)) {
          const isSelected = tagId === selectedSubcategory;
          Animated.spring(scaleAnims.current[tagId], {
            toValue: isSelected ? 1.15 : 1,
            useNativeDriver: true,
            friction: 6,
          }).start();
        }
      });
    } else if (!selectedSubcategory && selectedMainCategory) {
      // Reset subcategory scales when none selected
      selectedMainCategory.subcategories?.forEach((sub) => {
        if (scaleAnims.current[sub.id]) {
          Animated.spring(scaleAnims.current[sub.id], {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
          }).start();
        }
      });
    }
  }, [selectedSubcategory, selectedMainCategory]);

  return (
    <View style={styles.container}>
      {/* Horizontal Tags ScrollView (Circular Icons) */}
      <View style={styles.tagsContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContent}
        >
          {/* Back Button - Show when not on 'all' */}
          {selectedTag !== 'all' && (
            <Pressable
              style={styles.backButtonContainer}
              onPress={() => {
                onSelectTag('all');
                setSelectedSubcategory(null);
              }}
            >
              <View style={styles.backButtonCircle}>
                <Ionicons name="chevron-back" size={18} color={Colors.text} />
              </View>
            </Pressable>
          )}

          {displayTags.map((tag) => {
            // For subcategories, check if it matches the selected subcategory
            const isSubcategory =
              tag.isSubcategory ||
              selectedMainCategory?.subcategories?.some((sub) => sub.id === tag.id);
            const isSelected = isSubcategory
              ? selectedSubcategory === tag.id
              : selectedTag === tag.id;

            // Get or create animation value for this tag
            if (!scaleAnims.current[tag.id]) {
              scaleAnims.current[tag.id] = new Animated.Value(1);
            }

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
                <Animated.View
                  style={[
                    styles.tagIconContainer,
                    {
                      transform: [{ scale: scaleAnims.current[tag.id] }],
                    },
                  ]}
                >
                  <Image source={tag.icon} style={styles.tagIcon} resizeMode="contain" />
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    </View>
                  )}
                </Animated.View>
                <Text style={[styles.tagLabel, isSelected && styles.tagLabelSelected]}>
                  {tag.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Show content when: 1) Not inline mode (dedicated page), or 2) specific category is selected */}
      {(!showInline || selectedTag !== 'all') && (
        <>
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
                          <Image
                            source={require('../../assets/others/location.png')}
                            style={{ width: 14, height: 14 }}
                            resizeMode="contain"
                          />
                          <Text style={styles.clubLocationText} numberOfLines={1}>
                            {event.location_name || 'Location TBA'}
                          </Text>
                        </View>
                        <View style={styles.clubTimingRow}>
                          <Image
                            source={require('../../assets/others/dateandtime.png')}
                            style={{ width: 18, height: 18 }}
                            resizeMode="contain"
                          />
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
    gap: Spacing.sm,
    alignItems: 'center',
  },
  backButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagItem: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 2,
  },
  tagIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    height: 68,
  },
  tagIcon: {
    width: 56,
    height: 56,
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
  subcategoriesContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subcategoriesTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
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
    fontFamily: Fonts.medium,
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
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  subcategoryCardSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.medium,
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
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
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
    fontFamily: Fonts.bold,
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
