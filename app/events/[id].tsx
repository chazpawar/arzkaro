import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Spacing, BorderRadius } from '../../src/constants/styles';
import { useEvent } from '../../src/hooks/use-events';
import LoadingSpinner from '../../src/components/ui/loading-spinner';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);

  // Fetch event from backend
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
    return `Rs.${price.toLocaleString('en-IN')}`;
  };

  const handleBookNow = () => {
    router.push(`/events/${id}/book`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading event..." />;
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
          headerRight: () => (
            <Pressable style={styles.headerButton} onPress={() => setIsSaved(!isSaved)}>
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={24}
                color={isSaved ? Colors.error : Colors.text}
              />
            </Pressable>
          ),
        }}
      />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Cover Image */}
          <View style={styles.imageContainer}>
            {event.cover_image_url ? (
              <Image source={{ uri: event.cover_image_url }} style={styles.coverImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="musical-notes" size={64} color={Colors.textTertiary} />
              </View>
            )}
            <View style={styles.imageOverlay} />
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{event.category || 'Event'}</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Title & Price */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.price}>From {formatPrice(event.price)}</Text>
            </View>

            {/* Quick Info Cards */}
            <View style={styles.quickInfoContainer}>
              <View style={styles.quickInfoCard}>
                <View style={styles.quickInfoIcon}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.quickInfoLabel}>Date</Text>
                  <Text style={styles.quickInfoValue}>{formatDate(event.start_date)}</Text>
                </View>
              </View>

              <View style={styles.quickInfoCard}>
                <View style={styles.quickInfoIcon}>
                  <Ionicons name="time-outline" size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.quickInfoLabel}>Time</Text>
                  <Text style={styles.quickInfoValue}>
                    {formatTime(event.start_date)} - {formatTime(event.end_date)}
                  </Text>
                </View>
              </View>

              <View style={styles.quickInfoCard}>
                <View style={styles.quickInfoIcon}>
                  <Ionicons name="location-outline" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickInfoLabel}>Venue</Text>
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

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this Event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>

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
          <View style={styles.footerContent}>
            <View style={styles.footerPrice}>
              <Text style={styles.footerPriceLabel}>From</Text>
              <Text style={styles.footerPriceValue}>{formatPrice(event.price)}</Text>
            </View>
            <Pressable
              style={[styles.bookButton, isSoldOut && styles.bookButtonDisabled]}
              onPress={handleBookNow}
              disabled={isSoldOut}
            >
              <Text style={styles.bookButtonText}>{isSoldOut ? 'Sold Out' : 'Book Now'}</Text>
            </Pressable>
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
  scrollContent: {
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
    position: 'relative',
    height: 280,
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
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textInverse,
    textTransform: 'capitalize',
  },
  content: {
    padding: Spacing.lg,
  },
  titleSection: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
  },
  quickInfoContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
  },
  quickInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  quickInfoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  quickInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  quickInfoSubValue: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
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
    fontWeight: '600',
  },
  soldOut: {
    color: Colors.error,
    fontWeight: '600',
  },
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  hostAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  hostAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textInverse,
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
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  ticketTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  ticketTypeInfo: {
    flex: 1,
  },
  ticketTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  ticketTypeAvailable: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  ticketTypePrice: {
    fontSize: 16,
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
});
