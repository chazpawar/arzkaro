import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING } from '@theme';
import { useTickets } from '@context/TicketContext';
import Header from '@components/common/Header';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - (SPACING.lg * 2);

const TicketsScreen = ({ navigation }: any) => {
  const { tickets, isLoading } = useTickets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      // Tickets will auto-refresh from context
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  };

  const renderTicketCard = (ticket: typeof tickets[0]) => (
    <TouchableOpacity
      key={ticket.id}
      style={styles.ticketCard}
      onPress={() => navigation.navigate('TicketDetail', { ticketId: ticket.id })}
      activeOpacity={0.9}
    >
      {/* Top section with event details */}
      <View style={styles.cardHeader}>
        <Text style={styles.eventTitle} numberOfLines={1}>{ticket.eventTitle}</Text>
        <Text style={styles.eventMeta} numberOfLines={1}>
          {formatDate(ticket.eventDate)} | {ticket.eventTime}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.locationText} numberOfLines={1}>{ticket.eventLocation}</Text>
        </View>
      </View>

      {/* Square image with small padding */}
      <View style={styles.cardImageContainer}>
        <Image source={{ uri: ticket.eventBanner }} style={styles.ticketImage} />
        
        {/* Price and View button overlay at bottom of image */}
        <View style={styles.imageOverlay}>
          <Text style={styles.priceText}>₹{ticket.amount.toLocaleString()}</Text>
          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Ticket</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons name="confirmation-number" size={64} color={COLORS.border} />
      </View>
      <Text style={styles.emptyTitle}>No tickets booked</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tickets List */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header with Logo and Search */}
        <Header
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search tickets..."
        />

        {/* Tickets */}
        <View style={styles.ticketsContainer}>
          {tickets.length > 0 ? (
            tickets.map(renderTicketCard)
          ) : (
            renderEmptyState()
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  ticketsContainer: {
    padding: SPACING.lg,
  },
  ticketCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.85,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.85,
    flex: 1,
  },
  cardImageContainer: {
    paddingTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingBottom: SPACING.xs,
    position: 'relative',
  },
  ticketImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: SPACING.xs + SPACING.sm,
    left: SPACING.xs + SPACING.sm,
    right: SPACING.xs + SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  viewButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textGray,
  },
});

export default TicketsScreen;
