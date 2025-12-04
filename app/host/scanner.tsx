import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import TicketScanner from '../../src/components/tickets/ticket-scanner';
import { useAuth } from '../../src/contexts/auth-context';
import { useTicketValidation } from '../../src/hooks/use-bookings';
import { Colors } from '../../src/constants/colors';

export default function HostScannerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { validateTicket } = useTicketValidation();

  const handleScan = async (qrCode: string) => {
    if (!user?.id) {
      return { valid: false, message: 'You must be logged in to scan tickets' };
    }
    return await validateTicket(qrCode, user.id);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <TicketScanner onScan={handleScan} onClose={handleClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.text,
  },
});
