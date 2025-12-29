import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, Typography, BorderRadius } from '../constants/Styles';
import { Fonts } from '../constants/Fonts';

interface PhoneLoginScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
  onSignupPress?: () => void;
}

export default function PhoneLoginScreen({
  onBack,
  onSuccess,
  onSignupPress,
}: PhoneLoginScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // TODO: Implement send OTP API call
      console.log('Sending OTP to:', phoneNumber);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // TODO: Implement verify OTP API call
      console.log('Verifying OTP:', otp);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Login with Phone</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{otpSent ? 'Enter OTP' : 'Enter your phone number'}</Text>
              <Text style={styles.subtitle}>
                {otpSent
                  ? `We've sent a 6-digit OTP to +91 ${phoneNumber}`
                  : 'We will send you a one-time password'}
              </Text>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {!otpSent ? (
                // Phone Number Input
                <View style={styles.inputContainer}>
                  <View style={styles.phoneInputWrapper}>
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="Enter phone number"
                      placeholderTextColor={Colors.textTertiary}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      maxLength={10}
                      autoFocus
                    />
                  </View>
                </View>
              ) : (
                // OTP Input
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor={Colors.textTertiary}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>
              )}

              {/* Action Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed,
                  loading && styles.buttonDisabled,
                ]}
                onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>
                  {loading ? 'Please wait...' : otpSent ? 'Verify OTP' : 'Send OTP'}
                </Text>
              </Pressable>

              {/* Resend OTP */}
              {otpSent && (
                <Pressable
                  style={styles.resendButton}
                  onPress={() => {
                    setOtpSent(false);
                    setOtp('');
                    setError(null);
                  }}
                >
                  <Text style={styles.resendText}>Resend OTP</Text>
                </Pressable>
              )}

              {/* Sign Up Link */}
              {!otpSent && (
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don&apos;t have an account? </Text>
                  <Pressable onPress={onSignupPress}>
                    <Text style={styles.signupLink}>Sign Up</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h3,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  title: {
    ...Typography.h2,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  countryCode: {
    ...Typography.body,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginRight: Spacing.sm,
    paddingRight: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  phoneInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  otpInput: {
    ...Typography.h3,
    color: Colors.text,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    textAlign: 'center',
    letterSpacing: 8,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  actionButtonText: {
    ...Typography.body,
    fontFamily: Fonts.semiBold,
    color: Colors.textInverse,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resendButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  resendText: {
    ...Typography.body,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  signupText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  signupLink: {
    ...Typography.body,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
});
