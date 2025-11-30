import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Event } from '@types';
import { COLORS, SIZES, SHADOWS, SPACING } from '@theme';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: event.bannerImage }} style={styles.image} />
      
      {event.trending && (
        <View style={styles.trendingBadge}>
          <MaterialIcons name="local-fire-department" size={14} color={COLORS.white} />
          <Text style={styles.trendingText}>Trending</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="event" size={16} color={COLORS.textLight} />
          <Text style={styles.infoText}>
            {format(new Date(event.date), 'MMM dd, yyyy')} • {event.time}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={16} color={COLORS.textLight} />
          <Text style={styles.infoText} numberOfLines={1}>
            {event.location.address}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>From</Text>
            <Text style={styles.price}>₹{event.ticketPrice}</Text>
          </View>

          <View style={styles.ticketsContainer}>
            <Text style={styles.ticketsText}>
              {event.availableTickets} left
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.backgroundLight,
  },
  trendingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.black,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  trendingText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.sm,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textLight,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
  },
  ticketsContainer: {
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ticketsText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
});

export default EventCard;
