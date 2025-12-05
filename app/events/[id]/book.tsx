import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../src/components/ui/button';
import Card from '../../../src/components/ui/card';
import LoadingSpinner from '../../../src/components/ui/loading-spinner';
import { Colors } from '../../../src/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../../src/constants/styles';
import { useEvent } from '../../../src/hooks/use-events';
import { useCreateBooking } from '../../../src/hooks/use-bookings';
import { useAuth } from '../../../src/contexts/auth-context';

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
  const { event, ticketTypes, loading, error } = useEvent(id);
  const { createBooking, loading: bookingLoading, error: bookingError } = useCreateBooking();

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

    try {
      await createBooking(
        {
          event_id: event.id,
          ticket_type_id: selectedTicketType?.id,
          quantity,
        },
        user.id
      );

      // Navigate to tickets tab after successful booking
      Alert.alert(
        'Booking Confirmed!',
        'Your booking has been confirmed. Check your tickets tab.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/tickets') }]
      );
    } catch (_err) {
      Alert.alert(
        'Booking Failed',
        bookingError || 'Unable to complete your booking. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading event..." />;
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
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Event Summary */}
          <Card style={styles.eventSummary} variant="outlined">
            <View style={styles.eventRow}>
              {event.cover_image_url ? (
                <Image source={{ uri: event.cover_image_url }} style={styles.eventImage} />
              ) : (
                <View style={styles.eventImagePlaceholder}>
                  <Text style={styles.eventImagePlaceholderText}>
                    {event.type === 'event' ? '🎉' : event.type === 'experience' ? '✨' : '🏔️'}
                  </Text>
                </View>
              )}
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {event.title}
                </Text>
                <Text style={styles.eventDate}>
                  {formatDate(event.start_date)} at {formatTime(event.start_date)}
                </Text>
                {event.location_name && (
                  <Text style={styles.eventLocation} numberOfLines={1}>
                    📍 {event.location_name}
                  </Text>
                )}
              </View>
            </View>
          </Card>

          {/* Ticket Type Selection */}
          {ticketTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Ticket Type</Text>
              {ticketTypes.map((ticket: TicketType) => {
                const available = ticket.quantity_available - ticket.quantity_sold;
                const isSelected = selectedTicketType?.id === ticket.id;
                const isSoldOut = available <= 0;

                return (
                  <Pressable
                    key={ticket.id}
                    onPress={() => !isSoldOut && setSelectedTicketType(ticket)}
                    disabled={isSoldOut}
                  >
                    <Card
                      style={[
                        styles.ticketTypeCard,
                        isSelected && styles.ticketTypeCardSelected,
                        isSoldOut && styles.ticketTypeCardDisabled,
                      ]}
                      variant="outlined"
                    >
                      <View style={styles.ticketTypeHeader}>
                        <View style={styles.ticketTypeInfo}>
                          <View style={styles.ticketTypeNameRow}>
                            {isSelected && (
                              <View style={styles.checkmark}>
                                <Text style={styles.checkmarkText}>✓</Text>
                              </View>
                            )}
                            <Text
                              style={[
                                styles.ticketTypeName,
                                isSoldOut && styles.ticketTypeNameDisabled,
                              ]}
                            >
                              {ticket.name}
                            </Text>
                          </View>
                          {ticket.description && (
                            <Text style={styles.ticketTypeDescription}>{ticket.description}</Text>
                          )}
                          <Text
                            style={[styles.ticketTypeAvailability, isSoldOut && styles.soldOutText]}
                          >
                            {isSoldOut ? 'Sold Out' : `${available} available`}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.ticketTypePrice,
                            isSoldOut && styles.ticketTypePriceDisabled,
                          ]}
                        >
                          {formatPrice(ticket.price)}
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Quantity Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <Card style={styles.quantityCard} variant="outlined">
              <View style={styles.quantityRow}>
                <Pressable
                  style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                  onPress={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Text
                    style={[
                      styles.quantityButtonText,
                      quantity <= 1 && styles.quantityButtonTextDisabled,
                    ]}
                  >
                    -
                  </Text>
                </Pressable>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <Pressable
                  style={[
                    styles.quantityButton,
                    quantity >= maxQuantity && styles.quantityButtonDisabled,
                  ]}
                  onPress={() => handleQuantityChange(1)}
                  disabled={quantity >= maxQuantity}
                >
                  <Text
                    style={[
                      styles.quantityButtonText,
                      quantity >= maxQuantity && styles.quantityButtonTextDisabled,
                    ]}
                  >
                    +
                  </Text>
                </Pressable>
              </View>
              {maxQuantity < 10 && (
                <Text style={styles.maxQuantityNote}>
                  Maximum {maxQuantity} ticket{maxQuantity !== 1 ? 's' : ''} available
                </Text>
              )}
            </Card>
          </View>

          {/* Price Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Summary</Text>
            <Card style={styles.priceSummaryCard} variant="outlined">
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {selectedTicketType?.name || 'Ticket'} x {quantity}
                </Text>
                <Text style={styles.priceValue}>{formatPrice(totalAmount)}</Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
              </View>
              {totalAmount === 0 && (
                <View style={styles.freeEventBadge}>
                  <Text style={styles.freeEventText}>🎉 Free Event!</Text>
                </View>
              )}
            </Card>
          </View>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Text style={styles.infoNoteIcon}>ℹ️</Text>
            <Text style={styles.infoNoteText}>
              You&apos;ll receive digital tickets with QR codes after booking. You&apos;ll also be
              added to the event group chat automatically.
            </Text>
          </View>

          {/* Spacer for footer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Confirm Booking Footer */}
        <View style={styles.footer}>
          <View style={styles.footerPrice}>
            <Text style={styles.footerPriceLabel}>Total</Text>
            <Text style={styles.footerPriceValue}>
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
    backgroundColor: Colors.background,
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
  eventSummary: {
    margin: Spacing.lg,
    marginBottom: 0,
  },
  eventRow: {
    flexDirection: 'row',
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  eventImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventImagePlaceholderText: {
    fontSize: 32,
  },
  eventInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  eventTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: 4,
  },
  eventDate: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  eventLocation: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  section: {
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  ticketTypeCard: {
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  ticketTypeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  ticketTypeCardDisabled: {
    opacity: 0.5,
  },
  ticketTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ticketTypeInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  ticketTypeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  checkmarkText: {
    color: Colors.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  ticketTypeName: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  ticketTypeNameDisabled: {
    color: Colors.textTertiary,
  },
  ticketTypeDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  ticketTypeAvailability: {
    ...Typography.caption,
    color: Colors.success,
  },
  soldOutText: {
    color: Colors.error,
  },
  ticketTypePrice: {
    ...Typography.h4,
    color: Colors.primary,
  },
  ticketTypePriceDisabled: {
    color: Colors.textTertiary,
  },
  quantityCard: {
    padding: Spacing.md,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.surfaceSecondary,
  },
  quantityButtonText: {
    fontSize: 24,
    color: Colors.text,
    fontWeight: '500',
  },
  quantityButtonTextDisabled: {
    color: Colors.textTertiary,
  },
  quantityValue: {
    ...Typography.h2,
    color: Colors.text,
    minWidth: 60,
    textAlign: 'center',
    marginHorizontal: Spacing.lg,
  },
  maxQuantityNote: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  priceSummaryCard: {
    padding: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  priceLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  priceValue: {
    ...Typography.body,
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
    ...Typography.h3,
    color: Colors.primary,
  },
  freeEventBadge: {
    backgroundColor: Colors.successLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  freeEventText: {
    ...Typography.bodyMedium,
    color: Colors.success,
  },
  infoNote: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceSecondary,
    margin: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  infoNoteIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  infoNoteText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  footerPrice: {
    flex: 1,
  },
  footerPriceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  footerPriceValue: {
    ...Typography.h3,
    color: Colors.text,
  },
  confirmButton: {
    minWidth: 160,
  },
});
