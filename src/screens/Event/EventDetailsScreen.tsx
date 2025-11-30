import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getEventById } from 'src/data/mockData';
import { COLORS, SPACING, SHADOWS } from '@theme';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

const EventDetailsScreen = ({ route, navigation }: any) => {
  const { eventId } = route.params;
  const event = getEventById(eventId);

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color={COLORS.textGray} />
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  const handleBookTicket = () => {
    navigation.navigate('Payment', { event });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner Image */}
        <View style={styles.bannerContainer}>
          <Image source={{ uri: event.bannerImage }} style={styles.banner} />
          
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          
          {event.trending && (
            <View style={styles.trendingBadge}>
              <MaterialIcons name="local-fire-department" size={14} color={COLORS.white} />
              <Text style={styles.trendingText}>Trending</Text>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{event.title}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{event.category.toUpperCase()}</Text>
            </View>
          </View>

          {/* Event Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MaterialIcons name="event" size={22} color={COLORS.black} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoText}>
                  {format(new Date(event.date), 'EEEE, MMM dd, yyyy')} at {event.time}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MaterialIcons name="location-on" size={22} color={COLORS.black} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoText}>{event.location.address}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MaterialIcons name="person" size={22} color={COLORS.black} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Hosted by</Text>
                <Text style={styles.infoText}>{event.hostName}</Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* Event Rules */}
          {event.eventRules.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Event Rules</Text>
              {event.eventRules.map((rule, index) => (
                <View key={index} style={styles.ruleItem}>
                  <MaterialIcons name="check" size={18} color={COLORS.black} />
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Additional Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Info</Text>
            
            <View style={styles.additionalInfo}>
              <View style={styles.additionalInfoItem}>
                <MaterialIcons name="confirmation-number" size={18} color={COLORS.textLight} />
                <Text style={styles.additionalInfoText}>
                  {event.availableTickets} / {event.totalTickets} tickets available
                </Text>
              </View>

              <View style={styles.additionalInfoItem}>
                <MaterialIcons name="access-time" size={18} color={COLORS.textLight} />
                <Text style={styles.additionalInfoText}>Age {event.ageLimit}+</Text>
              </View>

              <View style={styles.additionalInfoItem}>
                <MaterialIcons name="replay" size={18} color={COLORS.textLight} />
                <Text style={styles.additionalInfoText}>{event.refundPolicy}</Text>
              </View>
            </View>
          </View>

          {/* Share Event Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Share Event</Text>
            <View style={styles.shareButtonsRow}>
              <TouchableOpacity style={styles.shareButton}>
                <MaterialIcons name="share" size={22} color={COLORS.black} />
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <MaterialIcons name="content-copy" size={22} color={COLORS.black} />
                <Text style={styles.shareButtonText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Organizer Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Need Help?</Text>
            <TouchableOpacity style={styles.contactCard}>
              <View style={styles.contactIconContainer}>
                <MaterialIcons name="support-agent" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Contact Organizer</Text>
                <Text style={styles.contactSubtitle}>Get help with your booking</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.textGray} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* STICKY FOOTER BUTTON */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Ticket Price</Text>
            <Text style={styles.price}>₹{event.ticketPrice}</Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.footerButton,
              event.availableTickets === 0 && styles.footerButtonDisabled
            ]}
            onPress={handleBookTicket}
            disabled={event.availableTickets === 0}
          >
            <MaterialIcons name="shopping-cart" size={20} color={COLORS.white} />
            <Text style={styles.footerButtonText}>
              {event.availableTickets > 0 ? 'Book Now' : 'Sold Out'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Secure Booking Info */}
        <View style={styles.secureInfo}>
          <MaterialIcons name="verified-user" size={14} color={COLORS.success} />
          <Text style={styles.secureText}>Secure booking · Protected payment</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.textGray,
    marginTop: SPACING.md,
  },
  bannerContainer: {
    position: 'relative',
  },
  banner: {
    width: width,
    height: width * 0.6,
    backgroundColor: COLORS.backgroundLight,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  trendingBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  trendingText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.sm,
    lineHeight: 32,
  },
  categoryBadge: {
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoContent: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: '500',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 15,
    color: COLORS.textLight,
    lineHeight: 24,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  ruleText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  additionalInfo: {
    gap: SPACING.sm,
  },
  additionalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  additionalInfoText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  // Share Section
  shareButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
  },
  // Contact Section
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  contactSubtitle: {
    fontSize: 13,
    color: COLORS.textGray,
    marginTop: 2,
  },
  // STICKY FOOTER
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.large,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  price: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.black,
  },
  footerButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  footerButtonDisabled: {
    backgroundColor: COLORS.textGray,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  secureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    gap: 6,
  },
  secureText: {
    fontSize: 11,
    color: COLORS.textGray,
  },
});

export default EventDetailsScreen;
