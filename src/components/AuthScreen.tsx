import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithGoogle } from '../../backend/auth';
import { Colors } from '../constants/colors';
import { Spacing, Typography, BorderRadius } from '../constants/styles';

interface AuthScreenProps {
  onSignInSuccess?: () => void;
}

export default function AuthScreen({ onSignInSuccess }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await signInWithGoogle();

      if (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to sign in with Google';
        setError(errorMessage);
      } else {
        onSignInSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const openTerms = () => {
    Linking.openURL('https://arzkaro.com/terms');
  };

  const openPrivacy = () => {
    Linking.openURL('https://arzkaro.com/privacy');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Main Content - White Background */}
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>arz</Text>
            <Text style={styles.logoDot}>.</Text>
          </View>
          <Text style={styles.tagline}>
            Discover concerts, workshops,{'\n'}meetups, and exclusive events{'\n'}happening around
            you.
          </Text>
        </View>
      </View>

      {/* Bottom Section - Orange Background */}
      <View style={styles.bottomSection}>
        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Google Sign In Button */}
        <Pressable
          style={({ pressed }) => [styles.googleButton, pressed && styles.buttonPressed]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <View style={styles.googleIconContainer}>
            <Text style={styles.googleIcon}>G</Text>
          </View>
          <Text style={styles.googleButtonText}>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Text>
        </Pressable>

        {/* Terms and Privacy */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By signing in, you agree to our{' '}
            <Text style={styles.termsLink} onPress={openTerms}>
              Terms of Service
            </Text>{' '}
            and{'\n'}
            <Text style={styles.termsLink} onPress={openPrivacy}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.background,
  },
  logoSection: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.xl,
  },
  logoText: {
    fontSize: 72,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -2,
  },
  logoDot: {
    fontSize: 72,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: -4,
  },
  tagline: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomSection: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.google,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  termsContainer: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 13,
    color: Colors.textInverse,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  googleG: {
    fontSize: 16,
    fontWeight: '700',
  },
});
