import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, SPACING, SHADOWS } from '@theme';
import { useTickets } from '@context/TicketContext';
import { useAuth } from '@context/AuthContext';

const TicketDetailScreen = ({ navigation, route }: any) => {
  const { ticketId } = route.params || {};
  const { getTicketById } = useTickets();
  const { user } = useAuth();
  
  const ticket = getTicketById(ticketId);

  // If ticket not found, show error
  if (!ticket) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Details</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={COLORS.textGray} />
          <Text style={styles.errorTitle}>Ticket Not Found</Text>
          <Text style={styles.errorSubtitle}>The ticket you're looking for doesn't exist.</Text>
          <TouchableOpacity 
            style={styles.backToTicketsButton}
            onPress={() => navigation.navigate('TicketsTab')}
          >
            <Text style={styles.backToTicketsText}>Back to Tickets</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPurchaseDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my ticket for ${ticket.eventTitle}!\n\nDate: ${formatDate(ticket.eventDate)}\nVenue: ${ticket.eventLocation}\n\nBooked via ArzKaro App`,
        title: ticket.eventTitle,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownload = () => {
    Alert.alert('Download Ticket', 'Ticket will be downloaded as PDF');
  };

  const handleGetDirections = () => {
    Alert.alert('Get Directions', 'Opening maps for directions to venue');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Details</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Ticket Card */}
        <View style={styles.ticketCard}>
          {/* Event Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: ticket.eventBanner }} style={styles.eventImage} />
            <View style={styles.imageOverlay} />
            <View style={styles.ticketTypeBadge}>
              <View style={styles.badgeContainer}>
                <MaterialIcons name="star" size={12} color={COLORS.white} />
                <Text style={styles.badgeText}>{ticket.ticketType}</Text>
              </View>
            </View>
          </View>

          {/* Ticket Cut Design */}
          <View style={styles.ticketCutContainer}>
            <View style={styles.ticketCutLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.ticketCutRight} />
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <QRCode
                value={ticket.qrCode}
                size={160}
                color={COLORS.black}
                backgroundColor={COLORS.white}
              />
            </View>
            <Text style={styles.qrCode}>{ticket.qrCode}</Text>
            <Text style={styles.qrHint}>Show this QR code at the venue entrance</Text>
          </View>

          {/* Event Details */}
          <View style={styles.eventDetails}>
            <Text style={styles.eventTitle}>{ticket.eventTitle}</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MaterialIcons name="event" size={18} color={COLORS.black} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>{formatDate(ticket.eventDate)}</Text>
                <Text style={styles.detailSubtext}>at {ticket.eventTime}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MaterialIcons name="location-on" size={18} color={COLORS.black} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Venue</Text>
                <Text style={styles.detailValue}>{ticket.eventLocation}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MaterialIcons name="event-seat" size={18} color={COLORS.black} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Seat Information</Text>
                <Text style={styles.detailValue}>{ticket.seatInfo}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Booking Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Booking Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Booking ID</Text>
            <Text style={styles.infoValue}>{ticket.paymentId}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Purchased On</Text>
            <Text style={styles.infoValue}>{formatPurchaseDate(ticket.purchaseDate)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ticket Holder</Text>
            <Text style={styles.infoValue}>{ticket.userName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{ticket.userEmail}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quantity</Text>
            <Text style={styles.infoValue}>{ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''}</Text>
          </View>
          
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Total Amount</Text>
            <Text style={styles.infoPriceValue}>₹{ticket.amount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <MaterialIcons name="info-outline" size={18} color={COLORS.black} />
            <Text style={styles.notesTitle}>Important Notes</Text>
          </View>
          <View style={styles.notesList}>
            <Text style={styles.noteItem}>• Please arrive 30 minutes before the event</Text>
            <Text style={styles.noteItem}>• Carry a valid photo ID for verification</Text>
            <Text style={styles.noteItem}>• Outside food and drinks are not allowed</Text>
            <Text style={styles.noteItem}>• This ticket is non-transferable</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionItem} onPress={handleDownload}>
            <MaterialIcons name="file-download" size={24} color={COLORS.primary} />
            <Text style={styles.actionText}>Download PDF</Text>
          </TouchableOpacity>
          
          <View style={styles.actionDivider} />
          
          <TouchableOpacity style={styles.actionItem} onPress={handleGetDirections}>
            <MaterialIcons name="directions" size={24} color={COLORS.primary} />
            <Text style={styles.actionText}>Get Directions</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  headerPlaceholder: {
    width: 40,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  ticketCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  imageContainer: {
    height: 150,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundLight,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  ticketTypeBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    backgroundColor: COLORS.black,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  ticketCutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: -12,
  },
  ticketCutLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundLight,
    marginLeft: -12,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  ticketCutRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundLight,
    marginRight: -12,
  },
  qrSection: {
    alignItems: 'center',
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  qrContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  qrCode: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: SPACING.md,
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  qrHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
  eventDetails: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.textGray,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '600',
  },
  detailSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingTop: SPACING.md,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: '500',
  },
  infoPriceValue: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '800',
  },
  notesCard: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  notesList: {
    gap: 6,
  },
  noteItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  actionDivider: {
    width: 1,
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.md,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 6,
  },
  // Error states
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  errorSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  backToTicketsButton: {
    backgroundColor: COLORS.black,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  backToTicketsText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default TicketDetailScreen;
