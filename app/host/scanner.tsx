import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../src/components/ui/button';
import { useAuth } from '../../src/contexts/auth-context';
import { useTicketValidation } from '../../src/hooks/use-bookings';
import { Colors } from '../../src/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/styles';

export default function HostScannerScreen() {
  const { user } = useAuth();
  const { validateTicket, validating, result } = useTicketValidation();
  const [ticketNumber, setTicketNumber] = useState('');

  const handleValidate = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to validate tickets');
      return;
    }

    if (!ticketNumber.trim()) {
      Alert.alert('Error', 'Please enter a ticket number');
      return;
    }

    const result = await validateTicket(ticketNumber.trim().toUpperCase(), user.id);

    if (result.valid) {
      Alert.alert('✅ Valid Ticket', result.message, [
        { text: 'OK', onPress: () => setTicketNumber('') },
      ]);
    } else {
      Alert.alert('❌ Invalid Ticket', result.message, [{ text: 'OK' }]);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Validate Ticket',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="ticket-outline" size={80} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Validate Ticket</Text>
          <Text style={styles.subtitle}>Enter the ticket number to validate entry</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={ticketNumber}
              onChangeText={setTicketNumber}
              placeholder="TKT-12345-ABCD"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!validating}
            />
          </View>

          <Button
            title={validating ? 'Validating...' : 'Validate Ticket'}
            onPress={handleValidate}
            variant="primary"
            disabled={validating || !ticketNumber.trim()}
            style={styles.validateButton}
          />

          {result && (
            <View
              style={[
                styles.resultContainer,
                result.valid ? styles.successResult : styles.errorResult,
              ]}
            >
              <Ionicons
                name={result.valid ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={result.valid ? Colors.success : Colors.error}
              />
              <Text
                style={[styles.resultText, result.valid ? styles.successText : styles.errorText]}
              >
                {result.message}
              </Text>
            </View>
          )}
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
  content: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 1,
  },
  validateButton: {
    width: '100%',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  successResult: {
    backgroundColor: `${Colors.success}20`,
  },
  errorResult: {
    backgroundColor: `${Colors.error}20`,
  },
  resultText: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  successText: {
    color: Colors.success,
  },
  errorText: {
    color: Colors.error,
  },
});
