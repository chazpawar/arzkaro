import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius, Typography } from '../constants/Styles';
import { Fonts } from '../constants/Fonts';
import { verifyEmailOTP, resendSignupOTP } from '../../backend/auth';
import { useAuth } from '../contexts/auth-context';

interface OTPVerificationModalProps {
  visible: boolean;
  email: string;
  fullName: string;
  onClose: () => void;
  onVerifySuccess: () => void;
}

export default function OTPVerificationModal({
  visible,
  email,
  fullName,
  onClose,
  onVerifySuccess,
}: OTPVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshProfile } = useAuth();

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 [OTP_MODAL] Visible prop changed:', visible);
    console.log('🔍 [OTP_MODAL] Email:', email);
    console.log('🔍 [OTP_MODAL] Full Name:', fullName);
  }, [visible, email, fullName]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📝 [OTP_VERIFY] Verifying OTP:', otp, 'for email:', email);

      const { data, error: verifyError } = await verifyEmailOTP(email, otp);

      if (verifyError) {
        throw verifyError;
      }

      if (!data?.session) {
        throw new Error('No session returned after OTP verification');
      }

      console.log('✅ [OTP_VERIFY] OTP verified successfully');

      // Refresh profile to fetch user data
      await refreshProfile(data.session.user.id);

      // Call success callback
      onVerifySuccess();
    } catch (err: any) {
      console.error('OTP verification error:', err);

      // Handle specific error messages
      if (err.message?.includes('invalid') || err.message?.includes('expired')) {
        setError('Invalid or expired OTP. Please try again.');
      } else if (err.message?.includes('rate limit')) {
        setError('Too many attempts. Please wait a moment.');
      } else {
        setError(err.message || 'Failed to verify OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setError(null);
      setLoading(true);

      console.log('📝 [OTP_RESEND] Resending OTP to:', email);

      const { error: resendError } = await resendSignupOTP(email);

      if (resendError) {
        throw resendError;
      }

      console.log('✅ [OTP_RESEND] OTP resent successfully');

      // Show success message
      setError('✓ Verification code sent successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (err: any) {
      console.error('OTP resend error:', err);

      if (err.message?.includes('rate limit')) {
        setError('Please wait a moment before requesting another code.');
      } else {
        setError(err.message || 'Failed to resend OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Verify your email</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </Pressable>
          </View>

          {/* Info Text */}
          <Text style={styles.infoText}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          {/* Error/Success Message */}
          {error && (
            <View style={[styles.errorContainer, error.includes('✓') && styles.successContainer]}>
              <Text style={[styles.errorText, error.includes('✓') && styles.successText]}>
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
            <Text style={styles.verifyButtonText}>{loading ? 'Verifying...' : 'Verify code'}</Text>
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
  emailText: {
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
