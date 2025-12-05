import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Share,
  Pressable,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Spacing, BorderRadius } from '../../src/constants/styles';
import { useTicket } from '../../src/hooks/use-bookings';
import LoadingSpinner from '../../src/components/ui/loading-spinner';

export default function TicketDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Fetch ticket from backend
  const { ticket, loading, error } = useTicket(id);

  const handleShare = async () => {
    if (!ticket || !ticket.event) return;

    try {
      await Share.share({
        message: `I'm going to ${ticket.event.title} on ${formatDate(ticket.event.start_date)}!`,
        title: ticket.event.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

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

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading ticket..." />;
  }

  if (error || !ticket || !ticket.event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.errorText}>{error || 'Ticket not found'}</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Ticket Details',
          headerBackTitle: 'Back',
          headerRight: () => (
            <Pressable onPress={handleShare} style={styles.headerButton}>
              <Ionicons name="share-outline" size={24} color={Colors.text} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Ticket Card */}
          <View style={styles.ticketCard}>
            {/* Event Image Section */}
            <View style={styles.imageSection}>
              {ticket.event.cover_image_url ? (
                <Image source={{ uri: ticket.event.cover_image_url }} style={styles.eventImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="musical-notes" size={48} color={Colors.textInverse} />
                </View>
              )}
              {/* Ticket Type Badge */}
              <View style={styles.ticketTypeBadge}>
                <Ionicons name="star" size={14} color={Colors.text} />
                <Text style={styles.ticketTypeText}>{ticket.ticket_type?.name || 'General'}</Text>
              </View>
            </View>

            {/* Dashed Line Separator */}
            <View style={styles.dashedSeparator}>
              <View style={styles.dashedCircleLeft} />
              <View style={styles.dashedLine} />
              <View style={styles.dashedCircleRight} />
            </View>

            {/* Ticket Number Section */}
            <View style={styles.qrSection}>
              <View style={styles.ticketNumberContainer}>
                <Ionicons name="ticket-outline" size={80} color={Colors.primary} />
              </View>
              <Text style={styles.ticketCode}>{ticket.ticket_number}</Text>
              <Text style={styles.qrHint}>Show this ticket number at the venue entrance</Text>
            </View>

            {/* Dashed Line Separator */}
            <View style={styles.dashedSeparator}>
              <View style={styles.dashedCircleLeft} />
              <View style={styles.dashedLine} />
              <View style={styles.dashedCircleRight} />
            </View>

            {/* Event Details Section */}
            <View style={styles.detailsSection}>
              <Text style={styles.eventTitle}>{ticket.event.title}</Text>

              {/* Date & Time */}
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>DATE & TIME</Text>
                  <Text style={styles.detailValue}>{formatDate(ticket.event.start_date)}</Text>
                  <Text style={styles.detailSubValue}>
                    at {formatTime(ticket.event.start_date)}
                  </Text>
                </View>
              </View>

              {/* Venue */}
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>VENUE</Text>
                  <Text style={styles.detailValue}>{ticket.event.location_name || 'TBA'}</Text>
                  {ticket.event.location_address && (
                    <Text style={styles.detailSubValue}>{ticket.event.location_address}</Text>
                  )}
                </View>
              </View>

              {/* Ticket Type Information */}
              {ticket.ticket_type && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="star-outline" size={20} color={Colors.textSecondary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>TICKET TYPE</Text>
                    <Text style={styles.detailValue}>{ticket.ticket_type.name}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoNoteText}>
              Screenshot this ticket for offline access. Keep it handy for entry!
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  ticketCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageSection: {
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 160,
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketTypeBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  ticketTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  dashedSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dashedCircleLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    marginLeft: -12,
  },
  dashedLine: {
    flex: 1,
    height: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dashedCircleRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    marginRight: -12,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  ticketNumberContainer: {
    padding: Spacing.xl,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketCode: {
    marginTop: Spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  qrHint: {
    marginTop: Spacing.xs,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  detailsSection: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  detailSubValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
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
