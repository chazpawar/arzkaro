import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { useEvent } from '../../src/hooks/use-events';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Use real event hook
  const { event, ticketTypes, loading, error } = useEvent(id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return 'Free';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const handleBookNow = () => {
    router.push(`/events/${id}/book`);
  };

  // Show loading spinner while fetching event
  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner fullScreen />
      </View>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.errorText}>{error || 'Event not found'}</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const spotsLeft = (event.max_capacity || 0) - (event.current_bookings || 0);
  const isSoldOut = event.max_capacity ? spotsLeft <= 0 : false;

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: '',
          headerLeft: () => (
            <Pressable style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </Pressable>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Sticky Cover Image */}
        <View style={styles.imageContainer}>
          {event.cover_image_url ? (
            <Image
              source={{ uri: event.cover_image_url }}
              style={styles.coverImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="musical-notes" size={64} color={Colors.textTertiary} />
            </View>
          )}
          <View style={styles.imageOverlay} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {/* Content */}
          <View style={styles.content}>
            {/* Title & Price */}
            <View style={styles.titleSection}>
              {/* Category Tag */}
              {event.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{event.category}</Text>
                </View>
              )}
              <Text style={styles.title}>{event.title}</Text>
            </View>

            {/* Quick Info Cards */}
            <View style={styles.quickInfoContainer}>
              <View style={styles.quickInfoCard}>
                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={Colors.primary}
                  style={styles.quickInfoIcon}
                />
                <View>
                  <Text style={styles.quickInfoLabel}>DATE</Text>
                  <Text style={styles.quickInfoValue}>{formatDate(event.start_date)}</Text>
                </View>
              </View>

              <View style={styles.quickInfoCard}>
                <Ionicons
                  name="time-outline"
                  size={22}
                  color={Colors.primary}
                  style={styles.quickInfoIcon}
                />
                <View>
                  <Text style={styles.quickInfoLabel}>TIME</Text>
                  <Text style={styles.quickInfoValue}>
                    {formatTime(event.start_date)} - {formatTime(event.end_date)}
                  </Text>
                </View>
              </View>

              <View style={styles.quickInfoCard}>
                <Ionicons
                  name="location-outline"
                  size={22}
                  color={Colors.primary}
                  style={styles.quickInfoIcon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickInfoLabel}>VENUE</Text>
                  <Text style={styles.quickInfoValue}>{event.location_name || 'TBA'}</Text>
                  {event.location_address && (
                    <Text style={styles.quickInfoSubValue}>{event.location_address}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Availability */}
            {event.max_capacity && (
              <View style={styles.availabilitySection}>
                <View style={styles.availabilityBar}>
                  <View
                    style={[
                      styles.availabilityFill,
                      {
                        width: `${((event.current_bookings || 0) / event.max_capacity) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.availabilityText}>
                  {isSoldOut ? (
                    <Text style={styles.soldOut}>Sold Out</Text>
                  ) : (
                    <>
                      <Text style={styles.spotsLeft}>{spotsLeft} spots left</Text>
                      <Text> out of {event.max_capacity}</Text>
                    </>
                  )}
                </Text>
              </View>
            )}

            {/* Host Section */}
            <Pressable
              style={styles.hostSection}
              onPress={() => router.push(`/profile?userId=${event.host_id}`)}
            >
              <View style={styles.hostAvatar}>
                {event.host?.avatar_url ? (
                  <Image source={{ uri: event.host.avatar_url }} style={styles.hostAvatarImage} />
                ) : (
                  <Text style={styles.hostAvatarText}>
                    {event.host?.full_name?.charAt(0) || 'H'}
                  </Text>
                )}
              </View>
              <View style={styles.hostInfo}>
                <Text style={styles.hostedBy}>Hosted by</Text>
                <Text style={styles.hostName}>{event.host?.full_name || 'Host'}</Text>
                <Text style={styles.hostStats}>View profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            </Pressable>

            {/* Photo Gallery */}
            {event.images && event.images.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Photo Gallery</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryContainer}
                >
                  {event.images.map((imageUrl, index) => (
                    <View key={index} style={styles.galleryImageWrapper}>
                      <Image source={{ uri: imageUrl }} style={styles.galleryImage} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this Event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>

            {/* Trip-Specific Details */}
            {event.type === 'trip' && (
              <>
                {/* Departure & Pickups */}
                {(event.departure_location || (event.pickups && event.pickups.length > 0)) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Departure & Pickups</Text>
                    {event.departure_location && (
                      <View style={styles.tripDetailRow}>
                        <Ionicons
                          name="location"
                          size={20}
                          color={Colors.primary}
                          style={styles.tripDetailIcon}
                        />
                        <View style={styles.tripDetailContent}>
                          <Text style={styles.tripDetailLabel}>Departure Location</Text>
                          <Text style={styles.tripDetailValue}>{event.departure_location}</Text>
                        </View>
                      </View>
                    )}
                    {event.pickups && event.pickups.length > 0 && (
                      <View style={styles.tripDetailRow}>
                        <Ionicons
                          name="navigate"
                          size={20}
                          color={Colors.primary}
                          style={styles.tripDetailIcon}
                        />
                        <View style={styles.tripDetailContent}>
                          <Text style={styles.tripDetailLabel}>Pickup Points</Text>
                          <View style={styles.pickupChipsContainer}>
                            {event.pickups.map((pickup, index) => (
                              <View key={index} style={styles.pickupChip}>
                                <Text style={styles.pickupChipText}>{pickup}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Itinerary */}
                {event.itinerary && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Itinerary</Text>
                    <Text style={styles.tripDetailText}>{event.itinerary}</Text>
                  </View>
                )}

                {/* What's Included */}
                {event.whats_included && (
                  <View style={styles.section}>
                    <View style={styles.tripDetailHeader}>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={Colors.success}
                        style={styles.tripDetailHeaderIcon}
                      />
                      <Text style={styles.sectionTitle}>What&apos;s Included</Text>
                    </View>
                    <Text style={styles.tripDetailText}>{event.whats_included}</Text>
                  </View>
                )}

                {/* What's NOT Included */}
                {event.whats_not_included && (
                  <View style={styles.section}>
                    <View style={styles.tripDetailHeader}>
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color={Colors.error}
                        style={styles.tripDetailHeaderIcon}
                      />
                      <Text style={styles.sectionTitle}>What&apos;s NOT Included</Text>
                    </View>
                    <Text style={styles.tripDetailText}>{event.whats_not_included}</Text>
                  </View>
                )}

                {/* Ideal For */}
                {event.ideal_for && (
                  <View style={styles.section}>
                    <View style={styles.tripDetailHeader}>
                      <Ionicons
                        name="people"
                        size={22}
                        color={Colors.primary}
                        style={styles.tripDetailHeaderIcon}
                      />
                      <Text style={styles.sectionTitle}>Ideal For</Text>
                    </View>
                    <Text style={styles.tripDetailText}>{event.ideal_for}</Text>
                  </View>
                )}
              </>
            )}

            {/* Ticket Types */}
            {ticketTypes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ticket Options</Text>
                {ticketTypes.map((ticket) => (
                  <View key={ticket.id} style={styles.ticketTypeCard}>
                    <View style={styles.ticketTypeInfo}>
                      <Text style={styles.ticketTypeName}>{ticket.name}</Text>
                      <Text style={styles.ticketTypeAvailable}>
                        {ticket.quantity_available} available
                      </Text>
                    </View>
                    <Text style={styles.ticketTypePrice}>{formatPrice(ticket.price)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <View style={styles.tagsSection}>
                {event.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Book Now Footer */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.footerContainer}>
            <View style={styles.footerPillContainer}>
              <Text style={styles.footerPriceValue}>{formatPrice(event.price)}</Text>
              <Pressable
                style={[styles.bookButtonNested, isSoldOut && styles.bookButtonDisabled]}
                onPress={handleBookNow}
                disabled={isSoldOut}
              >
                <Text style={styles.bookButtonNestedText}>
                  {isSoldOut ? 'Sold Out' : 'Book Ticket'}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Dimensions.get('window').height * 0.75, // Start content below image
    paddingBottom: 100,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: Dimensions.get('window').height * 0.75, // 75% of screen height to show full image
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0, // Behind content
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: -Spacing.xl, // Overlap with image for smooth transition
    zIndex: 2,
    minHeight: Dimensions.get('window').height, // Ensure content is scrollable
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  quickInfoContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  quickInfoIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  quickInfoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  quickInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  quickInfoSubValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  availabilitySection: {
    marginBottom: Spacing.xl,
  },
  availabilityBar: {
    height: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 3,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  availabilityFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  availabilityText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  spotsLeft: {
    color: Colors.primary,
    fontWeight: '600',
  },
  soldOut: {
    color: Colors.error,
    fontWeight: '600',
  },
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  hostAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  hostAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  hostInfo: {
    flex: 1,
  },
  hostedBy: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  hostStats: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  galleryContainer: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  galleryImageWrapper: {
    width: 280,
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ticketTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ticketTypeInfo: {
    flex: 1,
  },
  ticketTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  ticketTypeAvailable: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  ticketTypePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  footer: {
    backgroundColor: Colors.background,
    paddingTop: Spacing.md,
    paddingBottom: 0,
  },
  footerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  footerPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  footerPriceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textInverse,
    flex: 1,
  },
  bookButtonNested: {
    backgroundColor: Colors.textInverse,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.6,
  },
  bookButtonNestedText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  // Trip-specific styles
  tripDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tripDetailHeaderIcon: {
    marginRight: Spacing.xs,
  },
  tripDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  tripDetailIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  tripDetailContent: {
    flex: 1,
  },
  tripDetailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tripDetailValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  tripDetailText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  pickupChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  pickupChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  pickupChipText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});
