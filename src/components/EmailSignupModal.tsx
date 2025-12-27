import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius, Typography } from '../constants/Styles';
import { Fonts } from '../constants/Fonts';
import { signUpWithEmail } from '../../backend/auth';
import { useAuth } from '../contexts/auth-context';

interface EmailSignupModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onSignupSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function EmailSignupModal({
  visible,
  email: initialEmail,
  onClose,
  onSignupSuccess,
  onSwitchToLogin,
}: EmailSignupModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshProfile } = useAuth();

  // Update email when initialEmail changes
  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const handleSignup = async () => {
    // Validation
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: authError } = await signUpWithEmail(email, password, fullName);

      if (authError) {
        throw authError;
      }

      if (!data?.session) {
        // Email verification might be required
        setError('Account created! Please check your email to verify your account.');
        setTimeout(() => {
          onSignupSuccess();
        }, 2000);
        return;
      }

      console.log('✅ [EMAIL_SIGNUP_MODAL] Signup successful, fetching profile...');
      await refreshProfile(data.session.user.id);

      onSignupSuccess();
    } catch (err: any) {
      console.error('Signup error:', err);

      // Handle specific error messages
      if (err.message?.includes('User already registered')) {
        setError('This email is already registered. Please log in instead.');
      } else if (err.message?.includes('Password')) {
        setError('Password must be at least 8 characters long');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = fullName.trim() !== '' && email.trim() !== '' && password.trim() !== '';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create your account</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Message */}
            {error && (
              <View
                style={[
                  styles.errorContainer,
                  error.includes('check your email') && styles.successContainer,
                ]}
              >
                <Text
                  style={[
                    styles.errorText,
                    error.includes('check your email') && styles.successText,
                  ]}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color={Colors.textSecondary}
                  />
                </Pressable>
              </View>
              <Text style={styles.inputHint}>Password must be at least 8 characters long.</Text>
            </View>
          </ScrollView>

          {/* Create Account Button */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.signupButton, (!isFormValid || loading) && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={!isFormValid || loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'Creating account...' : 'Create account'}
              </Text>
            </Pressable>

            {/* Switch to Login */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>Already have an account? </Text>
              <Pressable onPress={onSwitchToLogin} disabled={loading}>
                <Text style={styles.switchLink}>Log in</Text>
              </Pressable>
            </View>
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
    minHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
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
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.text,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    fontSize: 16,
    color: Colors.text,
    letterSpacing: 0,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.text,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    fontSize: 16,
    color: Colors.text,
    letterSpacing: 0,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  footer: {
    paddingTop: Spacing.md,
  },
  signupButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.background,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  switchText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  switchLink: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
});
