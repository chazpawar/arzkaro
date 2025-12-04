import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/styles';

interface TicketQRCodeProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
  logo?: any; // Logo source for center of QR code
  logoSize?: number;
  logoBackgroundColor?: string;
  logoBorderRadius?: number;
}

/**
 * TicketQRCode - Displays a QR code for ticket validation
 *
 * Usage:
 * <TicketQRCode value="ticket-qr-code-string" size={200} />
 */
export default function TicketQRCode({
  value,
  size = 200,
  backgroundColor = Colors.surface,
  color = Colors.text,
  logo,
  logoSize = 40,
  logoBackgroundColor = Colors.surface,
  logoBorderRadius = 8,
}: TicketQRCodeProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <QRCode
        value={value}
        size={size}
        backgroundColor={backgroundColor}
        color={color}
        logo={logo}
        logoSize={logoSize}
        logoBackgroundColor={logoBackgroundColor}
        logoBorderRadius={logoBorderRadius}
        // Higher error correction for better scanning
        ecl="M"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
