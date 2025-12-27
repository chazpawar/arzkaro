import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius, Typography } from '../constants/Styles';
import { Fonts } from '../constants/Fonts';

interface OTPVerificationModalProps {
  visible: boolean;
  phoneNumber: string;
  onClose: () => void;
  onVerifySuccess: () => void;
}

export default function OTPVerificationModal({
  visible,
  phoneNumber,
  onClose,
  onVerifySuccess,
}: OTPVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // TODO: Implement actual OTP verification logic with Supabase
      console.log('Verifying OTP:', otp, 'for phone:', phoneNumber);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onVerifySuccess();
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setError(null);

      // TODO: Implement actual OTP resend logic
      console.log('Resending OTP to:', phoneNumber);

      // Show success message
      setError('OTP sent successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (err: any) {
      console.error('OTP resend error:', err);
      setError(err.message || 'Failed to resend OTP');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Verify OTP</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </Pressable>
          </View>

          {/* Info Text */}
          <Text style={styles.infoText}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          </Text>

          {/* Error/Success Message */}
          {error && (
            <View
              style={[
                styles.errorContainer,
                error.includes('successfully') && styles.successContainer,
              ]}
            >
              <Text
                style={[styles.errorText, error.includes('successfully') && styles.successText]}
              >
                {error}
              </Text>
            </View>
          )}

          {/* OTP Input */}
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
            />
          </View>

          {/* Verify Button */}
          <Pressable
            style={[styles.verifyButton, (loading || otp.length !== 6) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading || otp.length !== 6}
          >
            <Text style={styles.verifyButtonText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
          </Pressable>

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn&apos;t receive the code? </Text>
            <Pressable onPress={handleResendOTP} disabled={loading}>
              <Text style={styles.resendLink}>Resend</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  infoText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  phoneNumber: {
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  successContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    textAlign: 'center',
  },
  successText: {
    color: '#22c55e',
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  otpInput: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.text,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    fontSize: 32,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 12,
    fontFamily: Fonts.semiBold,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  verifyButtonText: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.background,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  resendText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resendLink: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
});
