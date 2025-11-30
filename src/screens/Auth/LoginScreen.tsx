import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useAuth } from '@context/AuthContext';
import { COLORS, SPACING, SHADOWS } from '@theme';
import { MOCK_USERS } from 'src/data/mockData';

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { login } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      // For development: login as first regular user from mock data
      const regularUser = MOCK_USERS.find(u => !u.isAdmin) || MOCK_USERS[0];
      await login(regularUser.email, 'password');
      
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleAdminSignIn = async () => {
    try {
      // For development: login as admin user from mock data
      const adminUser = MOCK_USERS.find(u => u.isAdmin);
      if (adminUser) {
        await login(adminUser.email, 'password');
      }
      
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'AdminDashboard' }],
        })
      );
    } catch (error) {
      console.error('Admin login error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Main Content - Logo and Greeting */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>arz</Text>
          <View style={styles.logoDot} />
        </View>
        <Text style={styles.greeting}>
          Discover concerts, workshops, meetups, and exclusive events happening around you.
        </Text>
      </View>

      {/* Bottom Section with Sign In Buttons - Orange accent background */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <Image
            source={{ uri: 'https://www.google.com/favicon.ico' }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        {/* Temporary Admin Button for Development */}
        <TouchableOpacity style={styles.adminButton} onPress={handleAdminSignIn}>
          <Text style={styles.adminButtonText}>Sign in as Admin (Dev)</Text>
        </TouchableOpacity>

        {/* Terms and Conditions */}
        <Text style={styles.termsText}>
          By signing in, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.lg,
  },
  logoText: {
    fontSize: 72,
    fontWeight: '800',
    color: COLORS.black,
    letterSpacing: -2,
  },
  logoDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    marginBottom: 17,
    marginLeft: 4,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  bottomSection: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    gap: SPACING.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: SPACING.lg,
    borderRadius: 9999,
    ...SHADOWS.medium,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: SPACING.sm,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  adminButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
    paddingVertical: 16,
    paddingHorizontal: SPACING.lg,
    borderRadius: 9999,
  },
  adminButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  termsText: {
    fontSize: 12,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: SPACING.sm,
    opacity: 0.9,
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});

export default LoginScreen;
