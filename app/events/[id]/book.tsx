import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../src/components/ui/button';
import { Colors } from '../../../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../../src/constants/Styles';
import { useAuth } from '../../../src/contexts/auth-context';
import LoadingSpinner from '../../../src/components/ui/loading-spinner';
import { useEvent } from '../../../src/hooks/use-events';

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
}

export default function BookEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Use real event hook
  const { event, ticketTypes, loading, error } = useEvent(id);
  const bookingLoading = false;

  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);

  // If not authenticated, redirect
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Auto-select first ticket type or use default pricing
  React.useEffect(() => {
    if (ticketTypes.length > 0 && !selectedTicketType) {
      setSelectedTicketType(ticketTypes[0] as TicketType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketTypes]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: event?.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Calculate pricing
  const unitPrice = selectedTicketType?.price ?? event?.price ?? 0;
  const totalAmount = unitPrice * quantity;
  const maxQuantity = selectedTicketType
    ? Math.min(10, selectedTicketType.quantity_available - selectedTicketType.quantity_sold)
    : Math.min(10, (event?.max_capacity ?? 100) - (event?.current_bookings ?? 0));

  const canBook = maxQuantity > 0 && quantity <= maxQuantity;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleConfirmBooking = async () => {
    if (!user?.id || !event?.id) return;

    // Mock booking confirmation
    Alert.alert(
      'Booking Confirmed! (Mock)',
      'This is a mock booking. In production, your booking would be saved to the database.',
      [{ text: 'OK', onPress: () => router.replace('/(tabs)/tickets') }]
    );
  };

  // Show loading spinner while fetching event
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorTitle}>Event Not Found</Text>
          <Text style={styles.errorText}>{error || 'This event does not exist.'}</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Book Tickets',
          headerBackTitle: 'Event',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryMedia}>
              {event.cover_image_url ? (
                <Image source={{ uri: event.cover_image_url }} style={styles.summaryImage} />
              ) : (
                <Text style={styles.summaryEmoji}>
                  {event.type === 'event' ? '🎉' : event.type === 'experience' ? '✨' : '🏟️'}
                </Text>
              )}
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={styles.summaryMeta}>
                {formatDate(event.start_date)} · {formatTime(event.start_date)}
              </Text>
              {event.location_name && (
                <View style={styles.summaryLocation}>
                  <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.summaryLocationText} numberOfLines={1}>
                    {event.location_name}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {ticketTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Ticket Type</Text>
              <View style={styles.ticketList}>
                {ticketTypes.map((ticket: TicketType) => {
                  const available = ticket.quantity_available - ticket.quantity_sold;
                  const isSelected = selectedTicketType?.id === ticket.id;
                  const isSoldOut = available <= 0;

                  return (
                    <Pressable
                      key={ticket.id}
                      onPress={() => !isSoldOut && setSelectedTicketType(ticket)}
                      disabled={isSoldOut}
                      style={[
                        styles.ticketOption,
                        isSelected && styles.ticketOptionSelected,
                        isSoldOut && styles.ticketOptionDisabled,
                      ]}
                    >
                      <View style={styles.ticketOptionHeader}>
                        <Text
                          style={[
                            styles.ticketOptionName,
                            isSoldOut && styles.ticketOptionNameDisabled,
                          ]}
                        >
                          {ticket.name}
                        </Text>
                        <Text
                          style={[
                            styles.ticketOptionPrice,
                            isSoldOut && styles.ticketOptionPriceDisabled,
                          ]}
                        >
                          {formatPrice(ticket.price)}
                        </Text>
                      </View>
                      {ticket.description && (
                        <Text style={styles.ticketOptionDescription}>{ticket.description}</Text>
                      )}
                      <Text style={[styles.ticketAvailability, isSoldOut && styles.soldOutText]}>
                        {isSoldOut ? 'Sold Out' : `${available} left`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Quantity</Text>
            <View style={styles.quantityCard}>
              <Pressable
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Text style={styles.quantityButtonSymbol}>-</Text>
              </Pressable>
              <View style={styles.quantityValueBubble}>
                <Text style={styles.quantityValue}>{quantity}</Text>
              </View>
              <Pressable
                style={[
                  styles.quantityButton,
                  quantity >= maxQuantity && styles.quantityButtonDisabled,
                ]}
                onPress={() => handleQuantityChange(1)}
                disabled={quantity >= maxQuantity}
              >
                <Text style={styles.quantityButtonSymbol}>+</Text>
              </Pressable>
            </View>
            {maxQuantity < 10 && (
              <Text style={styles.quantityHint}>
                Maximum {maxQuantity} ticket{maxQuantity !== 1 ? 's' : ''} available
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Price Summary</Text>
            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {selectedTicketType?.name || 'Ticket'} x {quantity}
                </Text>
                <Text style={styles.priceValue}>{formatPrice(totalAmount)}</Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {totalAmount === 0 ? 'Free' : formatPrice(totalAmount)}
                </Text>
              </View>
              {totalAmount === 0 && <Text style={styles.freeTag}>This one&apos;s on us 🎉</Text>}
            </View>
          </View>

          <View style={styles.infoBanner}>
            <View style={styles.infoIcon}>
              <Ionicons name="ticket-outline" size={18} color={Colors.primaryDark} />
            </View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoBannerTitle}>Instant digital tickets</Text>
              <Text style={styles.infoBannerText}>
                You&apos;ll get QR code tickets and access to the event chat as soon as the booking
                goes through.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>Total</Text>
            <Text style={styles.footerValue}>
              {totalAmount === 0 ? 'Free' : formatPrice(totalAmount)}
            </Text>
          </View>
          <Button
            title={bookingLoading ? 'Booking...' : 'Confirm Booking'}
            onPress={handleConfirmBooking}
            variant="primary"
            size="large"
            disabled={!canBook || bookingLoading}
            loading={bookingLoading}
            style={styles.confirmButton}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  summaryMedia: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  summaryImage: {
    width: '100%',
    height: '100%',
  },
  summaryEmoji: {
    fontSize: 32,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  summaryMeta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  summaryLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryLocationText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.bodySmallMedium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketList: {
    gap: Spacing.md,
  },
  ticketOption: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  ticketOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  ticketOptionDisabled: {
    opacity: 0.5,
  },
  ticketOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  ticketOptionName: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  ticketOptionNameDisabled: {
    color: Colors.textTertiary,
  },
  ticketOptionPrice: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  ticketOptionPriceDisabled: {
    color: Colors.textTertiary,
  },
  ticketOptionDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  ticketAvailability: {
    ...Typography.caption,
    color: Colors.success,
  },
  soldOutText: {
    color: Colors.error,
  },
  quantityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.4,
  },
  quantityButtonSymbol: {
    fontSize: 28,
    fontWeight: '500',
    color: Colors.text,
  },
  quantityValueBubble: {
    minWidth: 72,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  quantityValue: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
  },
  quantityHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  priceCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  priceLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  priceValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  priceDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  totalValue: {
    ...Typography.h2,
    color: Colors.primary,
  },
  freeTag: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    ...Typography.bodySmall,
    color: Colors.primaryDark,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: {
    flex: 1,
  },
  infoBannerTitle: {
    ...Typography.bodyMedium,
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  infoBannerText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  footerLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  footerValue: {
    ...Typography.h2,
    color: Colors.text,
  },
  confirmButton: {
    marginLeft: Spacing.md,
    flex: 1,
  },
});
