import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../src/components/ui/button';
import BackButton from '../../src/components/ui/back-button';
import { useAuth } from '../../src/contexts/auth-context';
import { useTicketValidation } from '../../src/hooks/use-bookings';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/Styles';
import { Fonts } from '../../src/constants/Fonts';

export default function HostScannerScreen() {
  const _router = useRouter();
  const { user } = useAuth();
  const { validateTicket, validating, result } = useTicketValidation();
  const [ticketId, setTicketId] = useState('');

  const handleValidate = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to validate tickets');
      return;
    }

    if (!ticketId.trim()) {
      Alert.alert('Error', 'Please enter a ticket ID');
      return;
    }

    const result = await validateTicket(ticketId.trim(), user.id);

    if (result.valid) {
      Alert.alert('✅ Valid Ticket', result.message, [
        { text: 'OK', onPress: () => setTicketId('') },
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
          headerBackTitle: '',
        }}
      />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton variant="minimal" />
          <Text style={styles.headerTitle}>Validate Ticket</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.content}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require('../../assets/others/ticket.png')}
                    style={{ width: 80, height: 80 }}
                    resizeMode="contain"
                  />
                </View>

                <Text style={styles.title}>Validate Ticket</Text>
                <Text style={styles.subtitle}>Enter the 6-character verification code</Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={ticketId}
                    onChangeText={(text) => setTicketId(text.toUpperCase())}
                    placeholder="e.g., A3B7K9"
                    placeholderTextColor={Colors.textTertiary}
                    autoCapitalize="characters"
                    maxLength={6}
                    autoCorrect={false}
                    editable={!validating}
                  />
                </View>

                <Button
                  title={validating ? 'Validating...' : 'Validate Ticket'}
                  onPress={handleValidate}
                  variant="primary"
                  disabled={validating || !ticketId.trim()}
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
                      style={[
                        styles.resultText,
                        result.valid ? styles.successText : styles.errorText,
                      ]}
                    >
                      {result.message}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
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
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 8,
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
