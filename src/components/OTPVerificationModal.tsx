import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';

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
  const inputRef = useRef<TextInput>(null);

  const handleOtpChange = (text: string) => {
    // Only allow digits and limit to 6 characters
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(cleaned);
  };

  const handleContinue = async () => {
    if (otp.length === 6) {
      setLoading(true);
      // TODO: Implement actual OTP verification logic here
      console.log('Verifying OTP:', otp, 'for phone:', phoneNumber);

      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        onVerifySuccess();
      }, 1000);
    }
  };

  const handleResendOTP = () => {
    // TODO: Implement resend OTP logic
    console.log('Resending OTP to:', phoneNumber);
  };

  const isComplete = otp.length === 6;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Confirm your number</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </Pressable>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Enter the code we&apos;ve sent by SMS to {phoneNumber}:
          </Text>

          {/* OTP Input */}
          <Pressable onPress={() => inputRef.current?.focus()}>
            <View style={styles.otpInputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.otpInput}
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
                placeholder="------"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </Pressable>

          {/* Resend SMS Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Haven&apos;t received an SMS? </Text>
            <Pressable onPress={handleResendOTP}>
              <Text style={styles.link}>Send again</Text>
            </Pressable>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Continue Button */}
          <Pressable
            style={[styles.continueButton, !isComplete && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!isComplete || loading}
          >
            <Text
              style={[styles.continueButtonText, !isComplete && styles.continueButtonTextDisabled]}
            >
              {loading ? 'Verifying...' : 'Continue'}
            </Text>
          </Pressable>
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
    paddingBottom: Spacing.xxl + Spacing.xl,
    minHeight: '93%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  otpInputContainer: {
    borderWidth: 1,
    borderColor: Colors.text,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  otpInput: {
    fontSize: 32,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 20,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  linkText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  link: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  spacer: {
    flex: 1,
    minHeight: Spacing.xxl,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: Colors.border,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.background,
  },
  continueButtonTextDisabled: {
    color: Colors.textTertiary,
  },
});
