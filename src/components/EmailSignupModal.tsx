import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { Spacing, BorderRadius } from '../constants/Styles';
import { signUpWithEmail } from '../../backend/auth';
import { useAuth } from '../contexts/auth-context';

interface EmailSignupModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onSignupSuccess: () => void;
}

export default function EmailSignupModal({
  visible,
  email: initialEmail,
  onClose,
  onSignupSuccess,
}: EmailSignupModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const { refreshProfile } = useAuth();

  // Update email when initialEmail changes
  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const handleContinue = async () => {
    // Validation
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !dateOfBirth.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    // Password validation
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      console.log('📧 [EMAIL_SIGNUP] Attempting signup:', { email, fullName });

      const result = await signUpWithEmail(email.trim(), password, fullName);

      if (result.error) {
        const errorMessage = result.error.message || 'Failed to create account';
        console.error('❌ [EMAIL_SIGNUP] Error:', errorMessage);
        Alert.alert('Error', errorMessage);
        setLoading(false);
        return;
      }

      if (result.data?.user) {
        console.log('✅ [EMAIL_SIGNUP] Account created successfully');
        // Refresh profile to get the latest data
        await refreshProfile(result.data.user.id);
        Alert.alert('Success', 'Account created successfully! You can now sign in.', [
          {
            text: 'OK',
            onPress: () => {
              onSignupSuccess();
              // Reset form
              setFirstName('');
              setLastName('');
              setDateOfBirth('');
              setPassword('');
            },
          },
        ]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('❌ [EMAIL_SIGNUP] Exception:', err);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isComplete =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    dateOfBirth.trim() !== '' &&
    email.trim() !== '' &&
    password.trim() !== '';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Complete your profile</Text>
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
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="numbers-and-punctuation"
              />
              <Text style={styles.inputHint}>You must be 18 or older to sign up.</Text>
            </View>

            {/* Email */}
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
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={true}
                autoCapitalize="none"
              />
              <Text style={styles.inputHint}>Password must be at least 8 characters long.</Text>
            </View>
          </ScrollView>

          {/* Continue Button */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.continueButton, !isComplete && styles.continueButtonDisabled]}
              onPress={handleContinue}
              disabled={!isComplete || loading}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  !isComplete && styles.continueButtonTextDisabled,
                ]}
              >
                {loading ? 'Creating account...' : 'Continue'}
              </Text>
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
    minHeight: '93%',
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
  inputHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  footer: {
    paddingTop: Spacing.md,
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
    fontFamily: Fonts.bold,
    color: Colors.background,
  },
  continueButtonTextDisabled: {
    color: Colors.textTertiary,
  },
});
