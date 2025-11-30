import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@theme';
import Input from '@components/common/Input';
import { useTickets } from '@context/TicketContext';
import { GooglePayIcon, PhonePeIcon, VisaIcon, WalletIcon } from '@components/common/PaymentIcons';

const PAYMENT_METHODS = [
  { id: 'gpay', name: 'GPay' },
  { id: 'phonepe', name: 'PhonePe' },
  { id: 'card', name: 'Card' },
  { id: 'wallet', name: 'Wallet' },
];

const PaymentScreen = ({ route, navigation }: any) => {
  const { event } = route.params || {};
  const { purchaseTicket } = useTickets();
  const [selectedMethod, setSelectedMethod] = useState('gpay');
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const ticketPrice = event?.ticketPrice || 500;
  const serviceFee = 50;
  const totalAmount = (ticketPrice * quantity) + serviceFee;

  const handlePayment = async () => {
    if (!event) {
      Alert.alert('Error', 'Event information not found');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const ticket = await purchaseTicket(event, quantity, selectedMethod);
      
      setLoading(false);
      
      Alert.alert(
        'Payment Successful!',
        `Your ticket for ${event.title} has been booked successfully!`,
        [
          {
            text: 'View Ticket',
            onPress: () => navigation.navigate('TicketDetail', { ticketId: ticket.id }),
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Payment Failed', 'Something went wrong. Please try again.');
    }
  };

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'gpay':
      case 'phonepe':
        return (
          <View style={styles.formContainer}>
            <Input
              placeholder="Enter UPI ID (e.g., name@upi)"
              value={upiId}
              onChangeText={setUpiId}
              leftIcon={<MaterialIcons name="alternate-email" size={18} color={COLORS.textGray} />}
            />
            <Text style={styles.upiHint}>
              {selectedMethod === 'gpay' ? 'Pay using Google Pay' : 'Pay using PhonePe'}
            </Text>
          </View>
        );
      
      case 'card':
        return (
          <View style={styles.formContainer}>
            <Input
              placeholder="Card Number"
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="numeric"
              maxLength={19}
            />
            <Input
              placeholder="Name on Card"
              value={cardName}
              onChangeText={setCardName}
              autoCapitalize="characters"
            />
            <View style={styles.cardRow}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Input
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Input
                  placeholder="CVV"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
            </View>
          </View>
        );
      
      case 'wallet':
        return (
          <View style={styles.formContainer}>
            {['Paytm', 'Amazon Pay', 'Mobikwik'].map((wallet) => (
              <TouchableOpacity key={wallet} style={styles.bankOption}>
                <View style={styles.walletIcon}>
                  <Text style={styles.walletIconText}>{wallet[0]}</Text>
                </View>
                <Text style={styles.bankName}>{wallet}</Text>
                <MaterialIcons name="chevron-right" size={18} color={COLORS.textGray} />
              </TouchableOpacity>
            ))}
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Event Summary */}
        {event && (
          <View style={styles.eventCard}>
            <Image source={{ uri: event.bannerImage }} style={styles.eventImage} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
              <View style={styles.eventMeta}>
                <MaterialIcons name="event" size={12} color={COLORS.textLight} />
                <Text style={styles.eventMetaText}>{event.date} at {event.time}</Text>
              </View>
              <View style={styles.eventMeta}>
                <MaterialIcons name="location-on" size={12} color={COLORS.textLight} />
                <Text style={styles.eventMetaText} numberOfLines={1}>{event.location.address}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Ticket Quantity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Tickets</Text>
          </View>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[styles.quantityButton, quantity === 1 && styles.quantityButtonDisabled]}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity === 1}
            >
              <MaterialIcons name="remove" size={18} color={quantity === 1 ? COLORS.textGray : COLORS.black} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.quantityButton, quantity === 10 && styles.quantityButtonDisabled]}
              onPress={() => setQuantity(Math.min(10, quantity + 1))}
              disabled={quantity === 10}
            >
              <MaterialIcons name="add" size={18} color={quantity === 10 ? COLORS.textGray : COLORS.black} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {PAYMENT_METHODS.map((method) => {
              const isActive = selectedMethod === method.id;
              const renderIcon = () => {
                const iconSize = 36;
                switch (method.id) {
                  case 'gpay':
                    return <GooglePayIcon size={iconSize} />;
                  case 'phonepe':
                    return <PhonePeIcon size={iconSize} />;
                  case 'card':
                    return <VisaIcon size={iconSize} />;
                  case 'wallet':
                    return <WalletIcon size={iconSize} />;
                  default:
                    return null;
                }
              };
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    isActive && styles.paymentMethodActive,
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                >
                  {renderIcon()}
                  <Text style={[
                    styles.paymentMethodName,
                    isActive && styles.paymentMethodNameActive
                  ]}>{method.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Payment Form */}
        {renderPaymentForm()}

        {/* Price Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Details</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Ticket × {quantity}</Text>
            <Text style={styles.priceValue}>₹{(ticketPrice * quantity).toLocaleString()}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Fee</Text>
            <Text style={styles.priceValue}>₹{serviceFee}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Security */}
        <View style={styles.securityBadge}>
          <MaterialIcons name="lock" size={14} color={COLORS.textLight} />
          <Text style={styles.securityText}>Secure & encrypted payment</Text>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerPrice}>₹{totalAmount.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonLoading]}
          onPress={handlePayment}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.payButtonText}>{loading ? "Processing..." : "Pay Now"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  eventImage: {
    width: 70,
    height: 70,
    backgroundColor: COLORS.backgroundLight,
  },
  eventInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  eventMetaText: {
    fontSize: 11,
    color: COLORS.textLight,
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quantityButtonDisabled: {
    opacity: 0.4,
  },
  quantityText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    minWidth: 36,
    textAlign: 'center',
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethod: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 6,
  },
  paymentMethodActive: {
    backgroundColor: COLORS.backgroundLight,
    borderColor: COLORS.black,
    borderWidth: 2,
  },
  paymentMethodName: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.black,
  },
  paymentMethodNameActive: {
    fontWeight: '600',
    color: COLORS.black,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  upiHint: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  cardRow: {
    flexDirection: 'row',
  },
  bankOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
    backgroundColor: COLORS.white,
  },
  bankName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.black,
    marginLeft: 10,
  },
  walletIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIconText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  priceValue: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.black,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
  },
  securityText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? 28 : SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerLeft: {},
  footerLabel: {
    fontSize: 10,
    color: COLORS.textGray,
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  payButton: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  payButtonLoading: {
    opacity: 0.7,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default PaymentScreen;
