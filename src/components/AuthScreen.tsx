import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { signInWithGoogle } from '../../backend/auth';
import { Colors } from '../constants/Colors';
import { Spacing, Typography, BorderRadius } from '../constants/Styles';
import { useAuth } from '../contexts/auth-context';
import OTPVerificationModal from './OTPVerificationModal';
import EmailSignupModal from './EmailSignupModal';

const GOOGLE_SVG = `<svg width="24" height="24" viewBox="-0.5 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24" fill="#FBBC05"/>
  <path d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333" fill="#EB4335"/>
  <path d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667" fill="#34A853"/>
  <path d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24" fill="#4285F4"/>
</svg>`;

interface AuthScreenProps {
  onSignInSuccess?: () => void;
}

type InputMode = 'phone' | 'email';

export default function AuthScreen({ onSignInSuccess }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showEmailSignupModal, setShowEmailSignupModal] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const { refreshProfile } = useAuth();

  const toggleInputMode = () => {
    // Scale down and fade out
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Switch mode
      setInputMode(inputMode === 'phone' ? 'email' : 'phone');
      // Scale up and fade in
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleSkip = () => {
    // Placeholder - No action needed for now
    console.log('Skip button clicked (placeholder)');
  };

  const handlePhoneContinue = () => {
    if (phoneNumber.trim()) {
      // TODO: Implement actual OTP send logic here
      console.log('Sending OTP to:', '+91' + phoneNumber);
      setShowOTPModal(true);
    }
  };

  const handleEmailContinue = () => {
    if (email.trim()) {
      // Open email signup modal
      console.log('Opening email signup for:', email);
      setShowEmailSignupModal(true);
    }
  };

  const handleContinue = () => {
    if (inputMode === 'phone') {
      handlePhoneContinue();
    } else {
      handleEmailContinue();
    }
  };

  const handleOTPVerifySuccess = () => {
    setShowOTPModal(false);
    // TODO: Handle successful verification (check if user exists, create profile, etc.)
    onSignInSuccess?.();
  };

  const handleEmailSignupSuccess = () => {
    setShowEmailSignupModal(false);
    // TODO: Handle successful signup
    onSignInSuccess?.();
  };

  const handleCloseOTPModal = () => {
    setShowOTPModal(false);
  };

  const handleCloseEmailSignupModal = () => {
    setShowEmailSignupModal(false);
  };

  const handleEmailLogin = () => {
    toggleInputMode();
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
          <Text style={styles.tagline}>Discover experiences{'\n'}happening in your city</Text>
        </View>
      </View>

      {/* Bottom Section - White Card with Orange Border */}
      <View style={styles.bottomSection}>
        <View style={styles.cardContainer}>
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.cardTitle}>Log in or Sign up</Text>

          {/* Animated Input Container */}
          <Animated.View
            style={[
              styles.inputContainer,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {inputMode === 'phone' ? (
              <>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.phoneInputWrapper}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Enter your phone number"
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType="phone-pad"
                  />
                </View>
                <Text style={styles.inputHint}>We will verify your phone number through OTP.</Text>
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.emailInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </>
            )}
          </Animated.View>

          {/* Continue Button */}
          <Pressable
            style={({ pressed }) => [styles.continueButton, pressed && styles.buttonPressed]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Toggle Email/Phone Button */}
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={handleEmailLogin}
          >
            <Ionicons
              name={inputMode === 'phone' ? 'mail-outline' : 'call-outline'}
              size={22}
              color={Colors.text}
              style={styles.emailIcon}
            />
            <Text style={styles.secondaryButtonText}>
              {inputMode === 'phone' ? 'Continue with email' : 'Continue with phone'}
            </Text>
          </Pressable>

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
      </View>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        visible={showOTPModal}
        phoneNumber={'+91' + phoneNumber}
        onClose={handleCloseOTPModal}
        onVerifySuccess={handleOTPVerifySuccess}
      />

      {/* Email Signup Modal */}
      <EmailSignupModal
        visible={showEmailSignupModal}
        email={email}
        onClose={handleCloseEmailSignupModal}
        onSignupSuccess={handleEmailSignupSuccess}
      />
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
    width: 260,
    height: 130,
    resizeMode: 'contain',
    marginBottom: -20,
  },
  tagline: {
    fontSize: 19,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: Spacing.xl,
  },
  bottomSection: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  cardContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 0,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.text,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Spacing.sm,
    paddingRight: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    fontSize: 16,
    color: Colors.text,
    letterSpacing: 0,
  },
  emailInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.text,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: 0,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    alignSelf: 'center',
    width: '70%',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.background,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.background,
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.text,
    paddingVertical: Spacing.sm + 6,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignSelf: 'center',
    width: '80%',
    minHeight: 50,
  },
  emailIcon: {
    marginRight: Spacing.md,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.lg,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.text,
    paddingVertical: Spacing.sm + 6,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'center',
    width: '80%',
    marginBottom: Spacing.xl,
  },
  googleIconSvg: {
    marginRight: Spacing.md,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
