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
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Fonts } from '../../src/constants/Fonts';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import BackButton from '../../src/components/ui/back-button';
import { useEvent } from '../../src/hooks/use-events';
import { getEventBookings, getUserBookings } from '../../src/services/booking-service';
import { useAuth } from '../../src/contexts/auth-context';
import { shareEvent } from '../../src/utils/share-utils';

// Icon imports from assets/others
const LocationIcon = require('../../assets/others/location.png');
const DateTimeIcon = require('../../assets/others/dateandtime.png');

// Mock data for demo experiences/trips

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [showAllGalleryImages, setShowAllGalleryImages] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);
  const [showAllItineraryDays, setShowAllItineraryDays] = React.useState(false);
  const [showFullDescription, setShowFullDescription] = React.useState(false);
  const [showTermsModal, setShowTermsModal] = React.useState(false);
  const [showCancellationModal, setShowCancellationModal] = React.useState(false);
  const [showAllThingsToKnow, setShowAllThingsToKnow] = React.useState(false);
  const [bookedUsers, setBookedUsers] = React.useState<
    { id: string; full_name: string | null; avatar_url: string | null }[]
  >([]);
  const [isCurrentUserMember, setIsCurrentUserMember] = React.useState(false);

  // Check if this is a mock event

  // Use real event hook (skip if mock)
  const { event, ticketTypes, loading, error } = useEvent(id);

  // Check if current user is a member (has booked this event)
  React.useEffect(() => {
    if (user?.id && event?.id) {
      getUserBookings(user.id)
        .then((bookings) => {
          const hasBooking = bookings.some(
            (b) => (b.event as { id: string }).id === event.id && b.status === 'confirmed'
          );
          setIsCurrentUserMember(hasBooking);
        })
        .catch((err) => {
          console.error('Error checking user membership:', err);
          setIsCurrentUserMember(false);
        });
    }
  }, [user?.id, event?.id]);

  // Fetch booked users for avatar display - for everyone
  React.useEffect(() => {
    if (event?.id) {
      getEventBookings(event.id)
        .then((bookings) => {
          // Deduplicate users by ID and only show unique users
          const uniqueUsersMap = new Map();
          bookings
            .filter((b) => b.user)
            .forEach((b) => {
              const userId = (
                b.user as { id: string; full_name: string | null; avatar_url: string | null }
              ).id;
              if (!uniqueUsersMap.has(userId)) {
                uniqueUsersMap.set(userId, {
                  id: userId,
                  full_name: (
                    b.user as { id: string; full_name: string | null; avatar_url: string | null }
                  ).full_name,
                  avatar_url: (
                    b.user as { id: string; full_name: string | null; avatar_url: string | null }
                  ).avatar_url,
                });
              }
            });

          // Get first 3 unique users
          const users = Array.from(uniqueUsersMap.values()).slice(0, 3);

          // Only update if the users actually changed to prevent unnecessary re-renders
          setBookedUsers((prevUsers) => {
            const hasChanged =
              prevUsers.length !== users.length ||
              prevUsers.some((prev, idx) => prev.id !== users[idx]?.id);
            return hasChanged ? users : prevUsers;
          });
        })
        .catch((err) => {
          console.error('Error fetching booked users:', err);
        });
    }
  }, [event?.id]);

  // Use mock event if available, otherwise real event

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

  // Default Terms & Conditions for Experiences
  const DEFAULT_TERMS_EXPERIENCE = `Participation in this experience is voluntary and at your own risk.

You confirm that you are physically and mentally fit to take part.

Please follow all instructions given by the host during the experience.

The host and platform are not responsible for any injury, loss, damage, or accident that may occur during the experience.

Personal belongings are the participant's responsibility.

Respectful behaviour towards the host and other participants is expected.

The host reserves the right to remove any participant for misbehavior, unsafe conduct, or disruption, without refund.

Please arrive on time. Late entry may not be allowed once the experience has started.

No refund will be provided for late arrival or no-show.

Cancellation and refund terms are defined by the host for each experience and are mentioned on the experience page. Unless stated otherwise, bookings are non-refundable.

The host may cancel or reschedule the experience due to unavoidable circumstances. In such cases, participants will be offered a refund or rescheduled slot, as decided by the host.

Photos or videos may be taken during the experience for promotional purposes. If you do not wish to be featured, please inform the host before the experience begins.

Unlawful resale (or attempted unlawful resale) of a ticket would lead to seizure or cancellation of that ticket without refund or other compensation.

These terms and conditions are subject to change from time to time at the discretion of the organizer.`;

  // Default Terms & Conditions for Trips
  const DEFAULT_TERMS_TRIP = `Terms and Conditions

1. Booking & Payment
All bookings are subject to confirmation of full payment.
No reservation will be considered valid unless payment is successfully completed.
No boarding will be allowed without valid government-issued identification.

2. Travel Insurance & Liability
We do not provide any insurance coverage for accidents, injuries, illness, loss of belongings, theft, or death.
Guests are strongly advised to arrange personal travel and medical insurance prior to the trip.
The tour organiser and its staff shall not be responsible for any injury, illness, accident, or loss occurring during the trip.

3. Health, Safety & Conduct
Participants must follow all instructions given by trip leaders, guides, or trek instructors at all times.
Smoking is strictly prohibited inside the transport vehicles.
Any form of misbehavior, intoxication, abuse, or indiscipline will result in immediate termination of participation, with no refund.
The driver has the discretion to switch off systems such as AC, music, or other vehicle features if required for safety reasons.

4. Respect & Zero-Tolerance Policy
We maintain a strict zero-tolerance policy towards disrespect or harassment, especially towards female co-passengers.
Any such behaviour will result in immediate removal from the trip.
The responsible individual(s) must arrange their own travel and accommodation at their own expense.
We will not be liable for any costs incurred after removal from the trip.

5. Itinerary & Schedule Changes
Trip schedules and itineraries are subject to change due to weather conditions, road situations, safety concerns, government restrictions, or unforeseen circumstances.
No refunds will be provided for itinerary changes, delayed departures, missed sightseeing, or canceled activities due to such reasons.
Only the locations mentioned in the itinerary will be covered. Any additional sightseeing must be managed independently by the guest.

6. Delays, Breakdowns & Force Majeure
We are not responsible for delays caused by traffic, road construction, weather conditions, transport breakdowns, or natural calamities.
In case of vehicle breakdown, we request guests to remain patient while repairs or alternate arrangements are made.
Such delays do not qualify for refunds or compensation.

7. Accommodation & Damages
The person making the booking is financially responsible for any damage caused to hotel rooms, camps, vehicles, or property during the trip.
Any damage costs must be settled immediately upon demand.

8. Luggage & Personal Belongings
Guests are advised to travel light and carry only essential items.
The management is not responsible for lost, stolen, or misplaced belongings during the trip.

9. Departure Timings
Departure times are strict and non-negotiable.
Guests must report on time and stay in contact with the trip coordinator.
The organizer will attempt to contact delayed guests, but shall not be responsible if the guest is unreachable.

10. Cancellations & Refunds
No refund shall be provided in cases of:
Misbehavior or rule violations
Missed departures
Itinerary changes due to uncontrollable circumstances
Voluntary withdrawal from the trip

11. Participation at Own Risk
All trips and activities involve a degree of physical, mental, and environmental risk.
By joining the trip, participants acknowledge that they are voluntarily participating at their own risk and are physically and mentally fit for the trip.
We shall not be held liable for any injury, loss, or damage arising from participation in any activity.

12. Medical Disclosure & Fitness
Participants must disclose any pre-existing medical conditions, allergies, injuries, or physical limitations before booking.
We reserve the right to deny participation if a guest's condition poses a risk to themselves or others.
The organizer is not responsible for any medical emergencies arising due to undisclosed conditions.

13. Minimum Group Size
Trips are subject to a minimum number of participants.
In case the minimum group size is not met, we reserve the right to reschedule or cancel the trip, offering either:
An alternative date, or
A full refund (excluding any non-recoverable transaction fees, if applicable).

14. Photography & Media Usage
We may capture photos and videos during the trip for promotional, marketing, and social media purposes.
By participating, guests grant us royalty-free permission to use such content without compensation.
If a participant does not wish to be featured, they must inform the organiser in writing before the trip begins.

15. Alcohol, Drugs & Illegal Substances
Consumption of illegal drugs or prohibited substances is strictly forbidden.
Any participant found violating local laws will be immediately removed from the trip, and we will not be responsible for any legal consequences.

16. Local Laws & Regulations
All participants must comply with local laws, customs, and regulations of the destination.
The organiser will not be responsible for any penalties, fines, or legal issues arising from non-compliance.

17. Acceptance of Terms
By booking the trip and making payment, the participant confirms that they have read, understood, and agreed to all Terms & Conditions.`;

  // Default Cancellation Policy for Experiences
  const DEFAULT_CANCELLATION_EXPERIENCE = `Standard Cancellation Policy:

• Full Refund: Cancel 7+ days before the event
• 50% Refund: Cancel 3-6 days before the event  
• No Refund: Cancel less than 3 days before the event

Refund Processing:
- Refunds will be processed within 5-7 business days
- Original payment method will be credited

Host Cancellation:
- If the host cancels, you will receive a full refund

Weather/Emergency:
- In case of extreme weather or emergencies, the host will reschedule or provide a full refund

For cancellation requests, please contact Arzkaro support.`;

  // Default Cancellation Policy for Trips
  const DEFAULT_CANCELLATION_TRIP = `Cancellation Policy

1. General Policy
All cancellation requests must be made in writing via email or the official communication channel used for booking.
The date of receipt of the cancellation request will be considered as the official cancellation date.
Refunds, if applicable, will be processed within 7–10 working days to the original mode of payment.

2. Cancellation by the Participant
A. Standard Cancellation Charges
More than 15 days before the trip start date: 75% refund of the total trip cost.
7 to 14 days before the trip start date: 50% refund of the total trip cost.
Less than 7 days before the trip start date: No refund.
Any transaction or payment gateway charges are non-refundable.

B. No-Show Policy
If a participant fails to report at the designated departure point on time, it will be treated as a No-Show.
No refund will be provided in case of a No-Show.

C. Partial Participation
No refunds will be provided for:
Late arrival
Early departure
Missed activities or sightseeing
Voluntary withdrawal from the trip

3. Cancellation by the Organiser
We reserve the right to cancel or reschedule a trip due to:
Insufficient number of participants
Natural calamities
Weather conditions
Government restrictions
Safety concerns
Force majeure events

In such cases, participants will be offered one of the following options:
A full refund, or
Adjustment of the amount towards a future trip

No additional compensation will be provided beyond the refund of the trip amount.

4. Non-Refundable Scenarios
No refund will be issued in the following situations:
Removal from the trip due to misbehaviour, intoxication, or violation of rules
Medical emergencies arising from undisclosed health conditions
Itinerary changes due to weather, road conditions, or safety reasons
Transport delays or breakdowns
Cancellation of sightseeing or activities due to uncontrollable circumstances
Force majeure events

5. Transfer Policy
Bookings are non-transferable.
Name changes or transfers to another person are not permitted unless explicitly approved in writing by the organiser.

6. Refund Method
Refunds will be processed to the original payment method only.
Cash refunds will not be provided.
Any convenience fee, platform fee, or service charge is non-refundable.

7. Policy Acceptance
By confirming a booking and making payment, the participant acknowledges that they have read, understood, and agreed to this Cancellation & Refund Policy.`;

  const getTermsText = () => {
    if (event?.terms_and_conditions?.trim()) {
      return event.terms_and_conditions.trim();
    }
    return event?.type === 'trip' ? DEFAULT_TERMS_TRIP : DEFAULT_TERMS_EXPERIENCE;
  };

  const getCancellationText = () => {
    if (event?.cancellation_policy?.trim()) {
      return event.cancellation_policy.trim();
    }
    return event?.type === 'trip' ? DEFAULT_CANCELLATION_TRIP : DEFAULT_CANCELLATION_EXPERIENCE;
  };

  const handleBookNow = () => {
    router.push(`/events/${id}/book`);
  };

  const handleShare = async () => {
    if (event) {
      await shareEvent(event.id, event.title);
    }
  };

  const handleSocialLink = (platform: string, url: string | undefined) => {
    if (!url) return;

    let fullUrl = url;

    // Add https:// if not present
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Handle platform-specific URL formats
      if (platform === 'instagram' && !url.includes('instagram.com')) {
        fullUrl = `https://instagram.com/${url.replace('@', '')}`;
      } else if (platform === 'twitter' && !url.includes('twitter.com')) {
        fullUrl = `https://twitter.com/${url.replace('@', '')}`;
      } else if (platform === 'linkedin' && !url.includes('linkedin.com')) {
        fullUrl = `https://linkedin.com/in/${url}`;
      } else if (platform === 'youtube' && !url.includes('youtube.com')) {
        fullUrl = `https://youtube.com/@${url}`;
      } else {
        fullUrl = `https://${url}`;
      }
    }

    Linking.openURL(fullUrl).catch((err) => {
      console.error('Failed to open URL:', err);
    });
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

  // Show loading spinner while fetching event (but not for mock events)
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
          <Pressable style={styles.errorBackButton} onPress={() => router.back()}>
            <Text style={styles.errorBackButtonText}>Go Back</Text>
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
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Buttons */}
        <View style={styles.headerContainer}>
          <BackButton />
          <Pressable style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={Colors.text} />
          </Pressable>
        </View>
      </SafeAreaView>
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
              {/* Joined Users Count - Top Right - Clickable for everyone */}
              {event.current_bookings > 0 && (
                <TouchableOpacity
                  style={styles.joinedUsersContainer}
                  onPress={() => {
                    console.log(
                      'Joined members pressed! Navigating to:',
                      `/events/${id}/attendees`
                    );
                    router.push(`/events/${id}/attendees`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.joinedAvatarsStack}>
                    {/* Display avatars only if current user is a member */}
                    {isCurrentUserMember && bookedUsers.length > 0
                      ? // Show real user avatars for members
                        bookedUsers
                          .filter(
                            (user, index, self) => index === self.findIndex((u) => u.id === user.id)
                          )
                          .map((user, index) => (
                            <View
                              key={user.id}
                              style={[
                                styles.joinedAvatar,
                                { marginLeft: index > 0 ? -8 : 0, zIndex: 3 - index },
                              ]}
                            >
                              {user.avatar_url ? (
                                <Image
                                  source={{ uri: user.avatar_url }}
                                  style={styles.joinedAvatarImage}
                                />
                              ) : (
                                <Text style={styles.joinedAvatarText}>
                                  {user.full_name?.charAt(0).toUpperCase() || '?'}
                                </Text>
                              )}
                            </View>
                          ))
                      : // Show generic placeholders for non-members
                        [...Array(Math.min(3, event.current_bookings))].map((_, index) => (
                          <View
                            key={`placeholder-${index}`}
                            style={[
                              styles.joinedAvatar,
                              { marginLeft: index > 0 ? -8 : 0, zIndex: 3 - index },
                            ]}
                          >
                            <Ionicons name="person" size={16} color={Colors.textSecondary} />
                          </View>
                        ))}
                  </View>
                  <View style={styles.joinedUsersTextContainer}>
                    <Text style={styles.joinedUsersText}>
                      +{event.current_bookings} have joined
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              )}

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
                      <Text style={styles.tripDeparturePickupText}>
                        {event.departure_location && (
                          <>
                            <Text style={styles.tripDeparturePickupLabel}>Departure - </Text>
                            {event.departure_location}
                          </>
                        )}
                        {event.pickups && event.pickups.length > 0 && (
                          <>
                            {event.departure_location && ' | '}
                            <Text style={styles.tripDeparturePickupLabel}>Pickups - </Text>
                            {event.pickups[0]}
                            {event.pickups.length > 1 && '...'}
                          </>
                        )}
                      </Text>
                    </View>
                  )}

                  {/* Destination Location */}
                  {event.location_name && (
                    <View style={styles.tripCompactRow}>
                      <Image
                        source={LocationIcon}
                        style={{ width: 20, height: 20 }}
                        resizeMode="contain"
                      />
                      <Text style={styles.tripCompactText}>{event.location_name}</Text>
                    </View>
                  )}

                  {/* Trip Duration & Dates */}
                  <View style={styles.tripCompactRow}>
                    <Image
                      source={DateTimeIcon}
                      style={{ width: 24, height: 24 }}
                      resizeMode="contain"
                    />
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
                      <Image
                        source={LocationIcon}
                        style={{ width: 22, height: 22 }}
                        resizeMode="contain"
                      />
                      <Text style={styles.locationText}>{event.location_name}</Text>
                    </View>
                  )}
                </>
              )}
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

                {/* About this Event */}
                <View style={styles.aboutEventContainer}>
                  <Text style={styles.aboutEventTitle}>About this Event</Text>
                  <Text
                    style={styles.aboutEventText}
                    numberOfLines={showFullDescription ? undefined : 4}
                  >
                    {event.description}
                  </Text>
                  {event.description && event.description.length > 200 && (
                    <Pressable onPress={() => setShowFullDescription(!showFullDescription)}>
                      <Text style={styles.aboutEventSeeMore}>
                        {showFullDescription ? 'Show less' : 'See more...'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* What's Included & Not Included */}
                {(event.whats_included || event.whats_not_included) && (
                  <View style={styles.whatsIncludedSection}>
                    {event.whats_included && (
                      <View style={styles.whatsIncludedGroup}>
                        <Text style={styles.whatsIncludedGroupTitle}>What&apos;s Included</Text>
                        {(() => {
                          // Parse JSON string if needed
                          const includedItems = (() => {
                            if (Array.isArray(event.whats_included)) {
                              return event.whats_included;
                            }
                            if (typeof event.whats_included === 'string') {
                              try {
                                const parsed = JSON.parse(event.whats_included);
                                return Array.isArray(parsed) ? parsed : [event.whats_included];
                              } catch {
                                return [event.whats_included];
                              }
                            }
                            return [];
                          })();

                          return includedItems.map((item: string, index: number) => (
                            <View key={index} style={styles.whatsIncludedItemRow}>
                              <Text style={styles.whatsIncludedIcon}>✓</Text>
                              <Text style={styles.whatsIncludedItemText}>{item}</Text>
                            </View>
                          ));
                        })()}
                      </View>
                    )}

                    {event.whats_not_included && (
                      <View style={styles.whatsNotIncludedGroup}>
                        <Text style={styles.whatsNotIncludedGroupTitle}>
                          What&apos;s NOT Included
                        </Text>
                        {(() => {
                          // Parse JSON string if needed
                          const notIncludedItems = (() => {
                            if (Array.isArray(event.whats_not_included)) {
                              return event.whats_not_included;
                            }
                            if (typeof event.whats_not_included === 'string') {
                              try {
                                const parsed = JSON.parse(event.whats_not_included);
                                return Array.isArray(parsed) ? parsed : [event.whats_not_included];
                              } catch {
                                return [event.whats_not_included];
                              }
                            }
                            return [];
                          })();

                          return notIncludedItems.map((item: string, index: number) => (
                            <View key={index} style={styles.whatsNotIncludedItemRow}>
                              <Text style={styles.whatsNotIncludedIcon}>✗</Text>
                              <Text style={styles.whatsNotIncludedItemText}>{item}</Text>
                            </View>
                          ));
                        })()}
                      </View>
                    )}
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

                {/* Itinerary */}
                {event.itinerary &&
                  typeof event.itinerary === 'string' &&
                  (() => {
                    try {
                      const parsedItinerary = JSON.parse(event.itinerary);
                      if (!Array.isArray(parsedItinerary)) return null;
                      return (
                        <View style={styles.itineraryContainer}>
                          <Text style={styles.itineraryTitle}>Itinerary:</Text>
                          {(showAllItineraryDays
                            ? parsedItinerary
                            : parsedItinerary.slice(0, 3)
                          ).map((dayPlan: any, index: number) => (
                            <View key={index} style={styles.itineraryDay}>
                              <Text style={styles.itineraryDayTitle}>
                                Day {dayPlan.day}: {dayPlan.title}
                              </Text>
                              {dayPlan.activities &&
                                dayPlan.activities.map((activity: string, actIndex: number) => (
                                  <Text key={actIndex} style={styles.itineraryActivity}>
                                    • {activity}
                                  </Text>
                                ))}
                            </View>
                          ))}
                          {parsedItinerary.length > 3 && (
                            <Pressable
                              style={styles.itinerarySeeMore}
                              onPress={() => setShowAllItineraryDays(!showAllItineraryDays)}
                            >
                              <Text style={styles.itinerarySeeMoreText}>
                                {showAllItineraryDays ? 'Show less' : 'See more...'}
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      );
                    } catch (_e) {
                      return null;
                    }
                  })()}

                {/* Things to Know Section - For Trips */}
                {event.things_to_know && event.things_to_know.length > 0 && (
                  <View style={styles.thingsToKnowSection}>
                    <Text style={styles.thingsToKnowTitle}>Things to know:</Text>
                    <View style={styles.thingsToKnowList}>
                      {(showAllThingsToKnow
                        ? event.things_to_know
                        : event.things_to_know.slice(0, 3)
                      ).map((item: string, index: number, array: string[]) => (
                        <View
                          key={index}
                          style={[
                            styles.thingsToKnowItem,
                            index === array.length - 1 && styles.thingsToKnowItemLast,
                          ]}
                        >
                          <Text style={styles.thingsToKnowBullet}>•</Text>
                          <Text style={styles.thingsToKnowText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                    {event.things_to_know.length > 3 && (
                      <Pressable
                        style={styles.thingsToKnowSeeAll}
                        onPress={() => setShowAllThingsToKnow(!showAllThingsToKnow)}
                      >
                        <Text style={styles.thingsToKnowSeeAllText}>
                          {showAllThingsToKnow ? 'Show less' : 'See all...'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Host Section - For trips (shown after Things to Know) */}
                <View style={styles.hostProfileSection}>
                  <View style={styles.hostProfileCard}>
                    <View style={styles.hostProfileHeader}>
                      {/* Avatar */}
                      {event.host?.avatar_url ? (
                        <Image
                          source={{ uri: event.host.avatar_url }}
                          style={styles.hostProfileAvatarImage}
                        />
                      ) : (
                        <View style={styles.hostProfileAvatar}>
                          <Text style={styles.hostProfileAvatarText}>
                            {event.host?.full_name?.charAt(0).toUpperCase() || 'H'}
                          </Text>
                        </View>
                      )}

                      {/* Host Info */}
                      <View style={styles.hostProfileInfo}>
                        <Text style={styles.hostedBy}>Hosted by</Text>
                        <Text style={styles.hostProfileName}>
                          {event.host?.full_name || 'Host'}
                        </Text>

                        {/* Bio - Always show */}
                        <Text style={styles.hostProfileBio} numberOfLines={2}>
                          {(event.host as any)?.bio || 'No bio available'}
                        </Text>

                        {/* Social Icons - Always show */}
                        <View style={styles.socialIcons}>
                          <TouchableOpacity
                            style={[
                              styles.socialIcon,
                              !(event.host as any)?.instagram && styles.socialIconDisabled,
                            ]}
                            onPress={() =>
                              handleSocialLink('instagram', (event.host as any)?.instagram)
                            }
                            disabled={!(event.host as any)?.instagram}
                          >
                            <Ionicons
                              name="logo-instagram"
                              size={20}
                              color={
                                (event.host as any)?.instagram ? '#E4405F' : Colors.textTertiary
                              }
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.socialIcon,
                              !(event.host as any)?.youtube && styles.socialIconDisabled,
                            ]}
                            onPress={() =>
                              handleSocialLink('youtube', (event.host as any)?.youtube)
                            }
                            disabled={!(event.host as any)?.youtube}
                          >
                            <Ionicons
                              name="logo-youtube"
                              size={20}
                              color={(event.host as any)?.youtube ? '#FF0000' : Colors.textTertiary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.socialIcon,
                              !(event.host as any)?.linkedin && styles.socialIconDisabled,
                            ]}
                            onPress={() =>
                              handleSocialLink('linkedin', (event.host as any)?.linkedin)
                            }
                            disabled={!(event.host as any)?.linkedin}
                          >
                            <Ionicons
                              name="logo-linkedin"
                              size={20}
                              color={
                                (event.host as any)?.linkedin ? '#0077B5' : Colors.textTertiary
                              }
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.socialIcon,
                              !(event.host as any)?.twitter && styles.socialIconDisabled,
                            ]}
                            onPress={() =>
                              handleSocialLink('twitter', (event.host as any)?.twitter)
                            }
                            disabled={!(event.host as any)?.twitter}
                          >
                            <Ionicons
                              name="logo-twitter"
                              size={20}
                              color={(event.host as any)?.twitter ? '#1DA1F2' : Colors.textTertiary}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Terms & Conditions Button - For Trips */}
                <Pressable style={styles.policyButton} onPress={() => setShowTermsModal(true)}>
                  <Text style={styles.policyButtonText}>Terms & Conditions</Text>
                </Pressable>

                {/* Cancellation Policy Button - For Trips */}
                <Pressable
                  style={styles.policyButton}
                  onPress={() => setShowCancellationModal(true)}
                >
                  <Text style={styles.policyButtonText}>Cancellation policy</Text>
                </Pressable>
              </>
            )}

            {/* About this Event - for non-trip events */}
            {event.type !== 'trip' && (
              <>
                <View style={styles.aboutEventContainer}>
                  <Text style={styles.aboutEventTitle}>About this Event</Text>
                  <Text
                    style={styles.aboutEventText}
                    numberOfLines={showFullDescription ? undefined : 4}
                  >
                    {event.description}
                  </Text>
                  {event.description && event.description.length > 200 && (
                    <Pressable onPress={() => setShowFullDescription(!showFullDescription)}>
                      <Text style={styles.aboutEventSeeMore}>
                        {showFullDescription ? 'Show less' : 'See more...'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Things to Know Section */}
                {event.things_to_know && event.things_to_know.length > 0 && (
                  <View style={styles.thingsToKnowSection}>
                    <Text style={styles.thingsToKnowTitle}>Things to know:</Text>
                    <View style={styles.thingsToKnowList}>
                      {(showAllThingsToKnow
                        ? event.things_to_know
                        : event.things_to_know.slice(0, 3)
                      ).map((item: string, index: number, array: string[]) => (
                        <View
                          key={index}
                          style={[
                            styles.thingsToKnowItem,
                            index === array.length - 1 && styles.thingsToKnowItemLast,
                          ]}
                        >
                          <Text style={styles.thingsToKnowBullet}>•</Text>
                          <Text style={styles.thingsToKnowText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                    {event.things_to_know.length > 3 && (
                      <Pressable
                        style={styles.thingsToKnowSeeAll}
                        onPress={() => setShowAllThingsToKnow(!showAllThingsToKnow)}
                      >
                        <Text style={styles.thingsToKnowSeeAllText}>
                          {showAllThingsToKnow ? 'Show less' : 'See all...'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Host Section - For experiences (shown after Things to Know) */}
                <View style={styles.hostProfileSection}>
                  <View style={styles.hostProfileCard}>
                    <View style={styles.hostProfileHeader}>
                      {/* Avatar */}
                      {event.host?.avatar_url ? (
                        <Image
                          source={{ uri: event.host.avatar_url }}
                          style={styles.hostProfileAvatarImage}
                        />
                      ) : (
                        <View style={styles.hostProfileAvatar}>
                          <Text style={styles.hostProfileAvatarText}>
                            {event.host?.full_name?.charAt(0).toUpperCase() || 'H'}
                          </Text>
                        </View>
                      )}

                      {/* Host Info */}
                      <View style={styles.hostProfileInfo}>
                        <Text style={styles.hostedBy}>Hosted by</Text>
                        <Text style={styles.hostProfileName}>
                          {event.host?.full_name || 'Host'}
                        </Text>

                        {/* Bio - Always show */}
                        <Text style={styles.hostProfileBio} numberOfLines={2}>
                          {(event.host as any)?.bio || 'No bio available'}
                        </Text>

                        {/* Social Icons - Always show */}
                        <View style={styles.socialIcons}>
                          <TouchableOpacity
                            style={[
                              styles.socialIcon,
                              !(event.host as any)?.instagram && styles.socialIconDisabled,
                            ]}
                            onPress={() =>
                              handleSocialLink('instagram', (event.host as any)?.instagram)
                            }
                            disabled={!(event.host as any)?.instagram}
                          >
                            <Ionicons
                              name="logo-instagram"
                              size={20}
                              color={
                                (event.host as any)?.instagram ? '#E4405F' : Colors.textTertiary
                              }
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.socialIcon,
                              !(event.host as any)?.youtube && styles.socialIconDisabled,
                            ]}
                            onPress={() =>
                              handleSocialLink('youtube', (event.host as any)?.youtube)
                            }
                            disabled={!(event.host as any)?.youtube}
                          >
                            <Ionicons
                              name="logo-youtube"
                              size={20}
                              color={(event.host as any)?.youtube ? '#FF0000' : Colors.textTertiary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.socialIcon,
                              !(event.host as any)?.linkedin && styles.socialIconDisabled,
                            ]}
                            onPress={() =>
                              handleSocialLink('linkedin', (event.host as any)?.linkedin)
                            }
                            disabled={!(event.host as any)?.linkedin}
                          >
                            <Ionicons
                              name="logo-linkedin"
                              size={20}
                              color={
                                (event.host as any)?.linkedin ? '#0077B5' : Colors.textTertiary
                              }
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.socialIcon,
                              !(event.host as any)?.twitter && styles.socialIconDisabled,
                            ]}
                            onPress={() =>
                              handleSocialLink('twitter', (event.host as any)?.twitter)
                            }
                            disabled={!(event.host as any)?.twitter}
                          >
                            <Ionicons
                              name="logo-twitter"
                              size={20}
                              color={(event.host as any)?.twitter ? '#1DA1F2' : Colors.textTertiary}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Terms & Conditions Button */}
                <Pressable style={styles.policyButton} onPress={() => setShowTermsModal(true)}>
                  <Text style={styles.policyButtonText}>Terms & Conditions</Text>
                </Pressable>

                {/* Cancellation Policy Button */}
                <Pressable
                  style={styles.policyButton}
                  onPress={() => setShowCancellationModal(true)}
                >
                  <Text style={styles.policyButtonText}>Cancellation policy</Text>
                </Pressable>
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

        {/* Terms & Conditions Modal */}
        {showTermsModal && (
          <Modal
            visible={true}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTermsModal(false)}
          >
            <Pressable style={styles.policyModalContainer} onPress={() => setShowTermsModal(false)}>
              <Pressable style={styles.policyModalContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.policyModalHeader}>
                  <Text style={styles.policyModalTitle}>Terms & Conditions</Text>
                  <Pressable
                    onPress={() => setShowTermsModal(false)}
                    style={styles.policyModalClose}
                  >
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </Pressable>
                </View>
                <ScrollView style={styles.policyModalScroll}>
                  <Text style={styles.policyModalText}>{getTermsText()}</Text>
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>
        )}

        {/* Cancellation Policy Modal */}
        {showCancellationModal && (
          <Modal
            visible={true}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCancellationModal(false)}
          >
            <Pressable
              style={styles.policyModalContainer}
              onPress={() => setShowCancellationModal(false)}
            >
              <Pressable style={styles.policyModalContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.policyModalHeader}>
                  <Text style={styles.policyModalTitle}>Cancellation Policy</Text>
                  <Pressable
                    onPress={() => setShowCancellationModal(false)}
                    style={styles.policyModalClose}
                  >
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </Pressable>
                </View>
                <ScrollView style={styles.policyModalScroll}>
                  <Text style={styles.policyModalText}>{getCancellationText()}</Text>
                </ScrollView>
              </Pressable>
            </Pressable>
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
    paddingTop: Dimensions.get('window').height * 0.675, // Start content below image
    paddingBottom: 100,
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: Dimensions.get('window').height * 0.675, // 67.5% of screen height
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
    fontFamily: Fonts.bold,
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
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  dateTimeText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
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
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  joinedUsersContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    zIndex: 10,
    elevation: 10,
  },
  joinedAvatarsStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
    overflow: 'hidden',
  },
  joinedAvatarImage: {
    width: '100%',
    height: '100%',
  },
  joinedAvatarText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#FFF',
  },
  joinedUsersTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinedUsersText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  price: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  availabilitySection: {
    marginBottom: Spacing.lg,
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
    fontFamily: Fonts.semiBold,
  },
  soldOut: {
    color: Colors.error,
    fontFamily: Fonts.semiBold,
  },
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
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
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  hostInfo: {
    flex: 1,
  },
  hostedBy: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  hostName: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  hostStats: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 26,
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
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  ticketTypeAvailable: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  ticketTypePrice: {
    fontSize: 18,
    fontFamily: Fonts.bold,
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
  errorBackButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  errorBackButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
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
    fontFamily: Fonts.bold,
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
    fontFamily: Fonts.bold,
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
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tripDetailValue: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.medium,
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
    fontFamily: Fonts.medium,
  },
  // Trip-specific compact layout styles
  imageContainerTrip: {
    height: Dimensions.get('window').height * 0.675, // 67.5% for trips
  },
  scrollContentTrip: {
    paddingTop: Dimensions.get('window').height * 0.675, // Match trip image height
  },
  tripCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tripCompactText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
    flex: 1,
  },
  tripCompactLabel: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.primary,
  },
  // Departure/Pickup specific styles (maroon and bold)
  tripDeparturePickupText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.maroon,
    flex: 1,
  },
  tripDeparturePickupLabel: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.maroon,
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
    marginBottom: Spacing.lg,
  },
  tripGalleryTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
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
    fontFamily: Fonts.medium,
    textDecorationLine: 'underline',
  },
  // Itinerary styles
  itineraryContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  itineraryTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  itineraryDay: {
    marginBottom: Spacing.lg,
  },
  itineraryDayTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  itineraryActivity: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginLeft: Spacing.sm,
  },
  itinerarySeeMore: {
    alignSelf: 'flex-end',
    marginTop: Spacing.sm,
  },
  itinerarySeeMoreText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Fonts.medium,
    textDecorationLine: 'underline',
  },
  // About Event styles
  aboutEventContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  aboutEventTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  aboutEventText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  aboutEventSeeMore: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Fonts.medium,
    textDecorationLine: 'underline',
    marginTop: Spacing.sm,
    alignSelf: 'flex-end',
  },
  // What's Included/Not Included styles
  whatsIncludedSection: {
    marginBottom: Spacing.lg,
  },
  whatsIncludedGroup: {
    marginBottom: Spacing.lg,
  },
  whatsIncludedGroupTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  whatsIncludedItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  whatsIncludedIcon: {
    fontSize: 14,
    color: Colors.success,
    marginRight: Spacing.xs,
    lineHeight: 22,
  },
  whatsIncludedItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  whatsNotIncludedGroup: {
    marginBottom: Spacing.sm,
  },
  whatsNotIncludedGroupTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  whatsNotIncludedItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  whatsNotIncludedIcon: {
    fontSize: 14,
    color: Colors.error,
    marginRight: Spacing.xs,
    lineHeight: 22,
  },
  whatsNotIncludedItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    flex: 1,
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
    fontFamily: Fonts.semiBold,
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
  // Experience Host Profile Card Styles (copied from profile.tsx)
  hostProfileSection: {
    marginBottom: Spacing.lg,
  },
  hostProfileCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.text,
    padding: Spacing.md,
  },
  hostProfileHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  hostProfileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostProfileAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  hostProfileAvatarText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  hostProfileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hostProfileName: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
  },
  hostProfileBio: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  socialIcons: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  socialIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  socialIconDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  // Things to Know Styles (matching itinerary style with border and padding)
  thingsToKnowSection: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  thingsToKnowTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  thingsToKnowList: {
    alignSelf: 'stretch',
  },
  thingsToKnowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  thingsToKnowItemLast: {
    marginBottom: 0,
  },
  thingsToKnowBullet: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
    lineHeight: 22,
  },
  thingsToKnowText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  thingsToKnowSeeAll: {
    alignSelf: 'flex-end',
    marginTop: Spacing.sm,
  },
  thingsToKnowSeeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Fonts.medium,
    textDecorationLine: 'underline',
  },
  // Policy Button Styles
  policyButton: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  policyButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  // Policy Modal Styles
  policyModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  policyModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    paddingTop: Spacing.lg,
  },
  policyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  policyModalTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  policyModalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyModalScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  policyModalText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
  },
  shareButton: {
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
        elevation: 4,
      },
    }),
  },
});
