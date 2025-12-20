import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { signInWithGoogle } from '../../backend/auth';
import { Colors } from '../constants/Colors';
import { Spacing, Typography, BorderRadius } from '../constants/Styles';
import { useAuth } from '../contexts/auth-context';
import PhoneLoginScreen from './PhoneLoginScreen';
import EmailLoginScreen from './EmailLoginScreen';
import PhoneSignupScreen from './PhoneSignupScreen';
import EmailSignupScreen from './EmailSignupScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';

const GOOGLE_SVG = `<svg width="24" height="24" viewBox="-0.5 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24" fill="#FBBC05"/>
  <path d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333" fill="#EB4335"/>
  <path d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667" fill="#34A853"/>
  <path d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24" fill="#4285F4"/>
</svg>`;

interface AuthScreenProps {
  onSignInSuccess?: () => void;
}

type AuthView = 'main' | 'phone' | 'email' | 'phoneSignup' | 'emailSignup' | 'forgotPassword';

export default function AuthScreen({ onSignInSuccess }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authView, setAuthView] = useState<AuthView>('main');
  const { refreshProfile } = useAuth();

  const handleSkip = () => {
    // Placeholder - No action needed for now
    console.log('Skip button clicked (placeholder)');
  };

  const handlePhoneLogin = () => {
    setAuthView('phone');
  };

  const handleEmailLogin = () => {
    setAuthView('email');
  };

  const handleBack = () => {
    setAuthView('main');
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await signInWithGoogle();

      if (result.error) {
        const errorMessage =
          result.error instanceof Error ? result.error.message : 'Failed to sign in with Google';
        setError(errorMessage);
      } else if (result.data && 'session' in result.data && result.data.session?.user) {
        // OAuth successful, now fetch the profile
        // This is AFTER exchangeCodeForSession has fully completed
        console.log('🔐 [AUTH_SCREEN] OAuth successful, fetching profile...');
        const profile = await refreshProfile(result.data.session.user.id);
        console.log('✅ [AUTH_SCREEN] Profile fetched:', profile?.role);
        onSignInSuccess?.();
      } else {
        // No session returned (user might have cancelled or other issue)
        console.log('⚠️ [AUTH_SCREEN] No session returned from signInWithGoogle');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show phone login screen
  if (authView === 'phone') {
    return (
      <PhoneLoginScreen
        onBack={handleBack}
        onSuccess={onSignInSuccess}
        onSignupPress={() => setAuthView('phoneSignup')}
      />
    );
  }

  // Show email login screen
  if (authView === 'email') {
    return (
      <EmailLoginScreen
        onBack={handleBack}
        onSuccess={onSignInSuccess}
        onSignupPress={() => setAuthView('emailSignup')}
        onForgotPasswordPress={() => setAuthView('forgotPassword')}
      />
    );
  }

  // Show phone signup screen
  if (authView === 'phoneSignup') {
    return <PhoneSignupScreen onBack={handleBack} onSuccess={onSignInSuccess} />;
  }

  // Show email signup screen
  if (authView === 'emailSignup') {
    return <EmailSignupScreen onBack={handleBack} onSuccess={onSignInSuccess} />;
  }

  // Show forgot password screen
  if (authView === 'forgotPassword') {
    return <ForgotPasswordScreen onBack={handleBack} onSuccess={onSignInSuccess} />;
  }

  // Main auth screen
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Skip Button - Top Right */}
      <View style={styles.header}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Main Content - White Background */}
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image source={require('../../assets/arz.png')} style={styles.appLogo} />
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

        {/* Login with Phone Button */}
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          onPress={handlePhoneLogin}
        >
          <Text style={styles.primaryButtonText}>Login with Phone</Text>
        </Pressable>

        {/* Login with Email/Password Button */}
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={handleEmailLogin}
        >
          <Text style={styles.secondaryButtonText}>Login with Email</Text>
        </Pressable>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Sign In Button */}
        <Pressable
          style={({ pressed }) => [styles.googleButton, pressed && styles.buttonPressed]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <SvgXml xml={GOOGLE_SVG} width={24} height={24} style={styles.googleIconSvg} />
          <Text style={styles.googleButtonText}>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
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
  appLogo: {
    width: 220,
    height: 140,
    resizeMode: 'contain',
    marginBottom: Spacing.xl,
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
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.background,
    borderRadius: 50,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.background,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    fontSize: 14,
    color: Colors.textInverse,
    marginHorizontal: Spacing.md,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: 50,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  googleIconSvg: {
    marginRight: Spacing.sm,
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
  googleLogo: {
    width: 20,
    height: 20,
  },
  googleG: {
    fontSize: 16,
    fontWeight: '700',
  },
});
