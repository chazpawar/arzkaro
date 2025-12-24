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
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { useEvent } from '../../src/hooks/use-events';

// Expandable Text Component
interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  style?: any;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({ text, maxLines = 4, style }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showButton, setShowButton] = React.useState(false);
  const [textHeight, setTextHeight] = React.useState(0);
  const [maxHeight, setMaxHeight] = React.useState(0);

  const onTextLayout = (e: any) => {
    if (!showButton) {
      setTextHeight(e.nativeEvent.layout.height);
    }
  };

  const onMaxTextLayout = (e: any) => {
    if (!showButton && maxHeight === 0) {
      const height = e.nativeEvent.layout.height;
      setMaxHeight(height);
      // Check if text needs truncation
      if (textHeight > height) {
        setShowButton(true);
      }
    }
  };

  return (
    <View>
      <Text
        style={[style, !isExpanded && showButton && { maxHeight }]}
        numberOfLines={!isExpanded && showButton ? maxLines : undefined}
        onLayout={onTextLayout}
      >
        {text}
      </Text>
      {/* Hidden text to measure full height */}
      {!showButton && (
        <Text
          style={[style, { position: 'absolute', opacity: 0 }]}
          numberOfLines={maxLines}
          onLayout={onMaxTextLayout}
        >
          {text}
        </Text>
      )}
      {showButton && (
        <Pressable onPress={() => setIsExpanded(!isExpanded)} style={styles.seeMoreButton}>
          <Text style={styles.seeMoreText}>{isExpanded ? 'See less' : 'See more...'}</Text>
        </Pressable>
      )}
    </View>
  );
};

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showAllGalleryImages, setShowAllGalleryImages] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);

  // Fetch real event data
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

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleCloseImageModal = () => {
    setSelectedImageIndex(null);
  };

  const handleNextImage = () => {
    if (
      selectedImageIndex !== null &&
      event.images &&
      selectedImageIndex < event.images.length - 1
    ) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
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
          <Text style={styles.errorSubtext}>No events yet</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const spotsLeft = (event.max_capacity || 0) - (event.current_bookings || 0);
  const isSoldOut = event.max_capacity ? spotsLeft <= 0 : false;
  const isTrip = event.type === 'trip';

  // Calculate trip duration in days
  const getTripDuration = () => {
    if (!isTrip) return 0;
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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
        <View style={[styles.imageContainer, isTrip && styles.imageContainerTrip]}>
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
          contentContainerStyle={[styles.scrollContent, isTrip && styles.scrollContentTrip]}
          style={styles.scrollView}
        >
          {/* Content */}
          <View style={styles.content}>
            {/* Title & Price */}
            <View style={styles.titleSection}>
              {/* Category Tags */}
              {event.tags && event.tags.length > 0 && (
                <View style={styles.categoryTagsRow}>
                  {event.tags.slice(0, 2).map((tag, index) => (
                    <View key={index} style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.title}>{event.title}</Text>

              {/* Trip-specific layout */}
              {isTrip ? (
                <>
                  {/* Departure & Pickups in one line */}
                  {(event.departure_location || (event.pickups && event.pickups.length > 0)) && (
                    <View style={styles.tripCompactRow}>
                      <Text style={styles.tripCompactText}>
                        {event.departure_location && (
                          <>
                            <Text style={styles.tripCompactLabel}>Departure - </Text>
                            {event.departure_location}
                          </>
                        )}
                        {event.pickups && event.pickups.length > 0 && (
                          <>
                            {event.departure_location && ' | '}
                            <Text style={styles.tripCompactLabel}>Pickups - </Text>
                            {event.pickups.slice(0, 2).join(', ')}
                            {event.pickups.length > 2 && ` +${event.pickups.length - 2}`}
                          </>
                        )}
                      </Text>
                    </View>
                  )}

                  {/* Destination Location */}
                  {event.location_name && (
                    <View style={styles.tripCompactRow}>
                      <Ionicons name="location" size={16} color={Colors.primary} />
                      <Text style={styles.tripCompactText}>{event.location_name}</Text>
                    </View>
                  )}

                  {/* Trip Duration & Dates */}
                  <View style={styles.tripCompactRow}>
                    <Ionicons name="calendar" size={16} color={Colors.primary} />
                    <Text style={styles.tripCompactText}>
                      {formatDateShort(event.start_date)} - {formatDateShort(event.end_date)}
                      {getTripDuration() > 0 && ` (${getTripDuration()} days)`}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {/* Date and Time in one line */}
                  <Text style={styles.dateTimeText}>
                    {formatDate(event.start_date)} | {formatTime(event.start_date)} -{' '}
                    {formatTime(event.end_date)}
                  </Text>
                  {/* Location */}
                  {event.location_name && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={18} color={Colors.primary} />
                      <Text style={styles.locationText}>{event.location_name}</Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Quick Info Cards - Only show for non-trip events */}
            {!isTrip && (
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
            )}

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

            {/* Photo Gallery - Only show for non-trip events */}
            {!isTrip && event.images && event.images.length > 0 && (
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
              <ExpandableText text={event.description} style={styles.description} maxLines={5} />
            </View>

            {/* Terms and Conditions */}
            {event.terms_and_conditions && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                <ExpandableText
                  text={event.terms_and_conditions}
                  style={styles.description}
                  maxLines={5}
                />
              </View>
            )}

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
                    <ExpandableText
                      text={event.itinerary}
                      style={styles.tripDetailText}
                      maxLines={8}
                    />
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
                      <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                        What&apos;s Included
                      </Text>
                    </View>
                    <ExpandableText
                      text={event.whats_included}
                      style={styles.tripDetailText}
                      maxLines={5}
                    />
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
                      <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                        What&apos;s NOT Included
                      </Text>
                    </View>
                    <ExpandableText
                      text={event.whats_not_included}
                      style={styles.tripDetailText}
                      maxLines={5}
                    />
                  </View>
                )}

                {/* Trip Gallery */}
                {event.images && event.images.length > 0 && (
                  <View style={styles.tripGalleryContainer}>
                    <Text style={styles.tripGalleryTitle}>Trip Gallery:</Text>
                    <View style={styles.tripGalleryImagesRow}>
                      {(showAllGalleryImages ? event.images : event.images.slice(0, 3)).map(
                        (imageUrl, index) => (
                          <Pressable
                            key={index}
                            style={styles.tripGalleryImageWrapper}
                            onPress={() => handleImagePress(index)}
                          >
                            <Image source={{ uri: imageUrl }} style={styles.tripGalleryImage} />
                          </Pressable>
                        )
                      )}
                    </View>
                    {event.images.length > 3 && (
                      <Pressable
                        style={styles.tripGallerySeeAll}
                        onPress={() => setShowAllGalleryImages(!showAllGalleryImages)}
                      >
                        <Text style={styles.tripGallerySeeAllText}>
                          {showAllGalleryImages ? 'Show less' : 'See all...'}
                        </Text>
                      </Pressable>
                    )}
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
                      <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Ideal For</Text>
                    </View>
                    <ExpandableText
                      text={event.ideal_for}
                      style={styles.tripDetailText}
                      maxLines={4}
                    />
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
          <View style={[styles.footerContainer, isTrip && styles.footerContainerTrip]}>
            <View style={[styles.footerPillContainer, isTrip && styles.footerPillContainerTrip]}>
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

        {/* Image Viewer Modal */}
        {selectedImageIndex !== null && event.images && (
          <Modal
            visible={true}
            transparent={true}
            animationType="fade"
            onRequestClose={handleCloseImageModal}
          >
            <View style={styles.imageModalContainer}>
              <SafeAreaView style={styles.imageModalSafeArea}>
                {/* Close Button */}
                <Pressable style={styles.imageModalCloseButton} onPress={handleCloseImageModal}>
                  <Ionicons name="close" size={30} color={Colors.textInverse} />
                </Pressable>

                {/* Image Counter */}
                <View style={styles.imageModalCounter}>
                  <Text style={styles.imageModalCounterText}>
                    {selectedImageIndex + 1} / {event.images.length}
                  </Text>
                </View>

                {/* Image */}
                <View style={styles.imageModalImageContainer}>
                  <Image
                    source={{ uri: event.images[selectedImageIndex] }}
                    style={styles.imageModalImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Navigation Buttons */}
                <View style={styles.imageModalNavigation}>
                  <Pressable
                    style={[
                      styles.imageModalNavButton,
                      selectedImageIndex === 0 && styles.imageModalNavButtonDisabled,
                    ]}
                    onPress={handlePreviousImage}
                    disabled={selectedImageIndex === 0}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={32}
                      color={selectedImageIndex === 0 ? Colors.textTertiary : Colors.textInverse}
                    />
                  </Pressable>

                  <Pressable
                    style={[
                      styles.imageModalNavButton,
                      selectedImageIndex === event.images.length - 1 &&
                        styles.imageModalNavButtonDisabled,
                    ]}
                    onPress={handleNextImage}
                    disabled={selectedImageIndex === event.images.length - 1}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={32}
                      color={
                        selectedImageIndex === event.images.length - 1
                          ? Colors.textTertiary
                          : Colors.textInverse
                      }
                    />
                  </Pressable>
                </View>
              </SafeAreaView>
            </View>
          </Modal>
        )}
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
    paddingTop: Dimensions.get('window').height * 0.68, // Start content below image
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
    height: Dimensions.get('window').height * 0.68, // 68% of screen height
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
    backgroundColor: Colors.text,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  categoryTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  dateTimeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
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
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    paddingHorizontal: Spacing.xl + Spacing.md,
    paddingBottom: Spacing.lg,
  },
  footerPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm + 4,
    paddingVertical: Spacing.sm + 4,
    minHeight: 60,
    alignSelf: 'stretch',
  },
  footerPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  bookButtonNested: {
    backgroundColor: Colors.textInverse,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 6,
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
    fontWeight: '700',
    color: Colors.text,
  },
  // Trip-specific styles
  tripDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tripDetailHeaderIcon: {
    marginRight: Spacing.sm,
    marginTop: 0,
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
  // Trip-specific compact layout styles
  imageContainerTrip: {
    height: Dimensions.get('window').height * 0.66, // 66% instead of 68% for trips
  },
  scrollContentTrip: {
    paddingTop: Dimensions.get('window').height * 0.66, // Match trip image height
  },
  tripCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tripCompactText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  tripCompactLabel: {
    fontWeight: '700',
    color: Colors.primary,
  },
  footerContainerTrip: {
    paddingHorizontal: Spacing.xl + 2,
  },
  footerPillContainerTrip: {
    paddingLeft: Spacing.md + 2,
    paddingRight: Spacing.xs + 2,
    paddingVertical: Spacing.xs + 2,
  },
  // Trip Gallery styles
  tripGalleryContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  tripGalleryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  tripGalleryImagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tripGalleryImageWrapper: {
    width: `${(100 - Spacing.sm * 2) / 3}%`,
    aspectRatio: 4 / 3,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
  },
  tripGalleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tripGallerySeeAll: {
    alignSelf: 'flex-end',
  },
  tripGallerySeeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  // Image Modal styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageModalSafeArea: {
    flex: 1,
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalCounter: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  imageModalCounterText: {
    fontSize: 14,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  imageModalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  imageModalNavigation: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  imageModalNavButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalNavButtonDisabled: {
    opacity: 0.3,
  },
  // Expandable Text styles
  seeMoreButton: {
    alignSelf: 'flex-end',
    marginTop: Spacing.xs,
  },
  seeMoreText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
