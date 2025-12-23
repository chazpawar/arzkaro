import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';
import { signInWithEmail } from '../../backend/auth';
import { useAuth } from '../contexts/auth-context';

interface EmailLoginModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onLoginSuccess: () => void;
  onSwitchToSignup: () => void;
}

export default function EmailLoginModal({
  visible,
  email: initialEmail,
  onClose,
  onLoginSuccess,
  onSwitchToSignup,
}: EmailLoginModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshProfile } = useAuth();

  // Update email when initialEmail changes
  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const handleLogin = async () => {
    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('📧 [EMAIL_LOGIN] Attempting login:', email);

      const result = await signInWithEmail(email.trim(), password);

      if (result.error) {
        const errorMessage = result.error.message || 'Failed to sign in';
        console.error('❌ [EMAIL_LOGIN] Error:', errorMessage);
        Alert.alert('Error', errorMessage);
        setLoading(false);
        return;
      }

      if (result.data?.user) {
        console.log('✅ [EMAIL_LOGIN] Login successful');
        // Refresh profile to get the latest data
        await refreshProfile(result.data.user.id);
        onLoginSuccess();
        // Reset form
        setPassword('');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('❌ [EMAIL_LOGIN] Exception:', err);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isComplete = email.trim() !== '' && password.trim() !== '';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Welcome back</Text>
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
                autoComplete="email"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={true}
                autoCapitalize="none"
                autoComplete="password"
              />
            </View>

            {/* Switch to Signup */}
            <Pressable onPress={onSwitchToSignup} style={styles.switchButton}>
              <Text style={styles.switchText}>
                Don't have an account? <Text style={styles.switchTextBold}>Sign up</Text>
              </Text>
            </Pressable>
          </ScrollView>

          {/* Login Button */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.loginButton, !isComplete && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={!isComplete || loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text
                  style={[
                    styles.loginButtonText,
                    !isComplete && styles.loginButtonTextDisabled,
                  ]}
                >
                  Log in
                </Text>
              )}
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
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
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
    fontWeight: '600',
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
  switchButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  switchTextBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  footer: {
    paddingTop: Spacing.md,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: Colors.border,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.background,
  },
  loginButtonTextDisabled: {
    color: Colors.textTertiary,
  },
});
