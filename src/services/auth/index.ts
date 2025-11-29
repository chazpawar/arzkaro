import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from '../firebase/config';
import { AuthResponse } from './types';

// Lazy-load GoogleSignin to avoid Expo Go crashes
let GoogleSignin: any = null;
let isGoogleSigninConfigured = false;

// Try to import GoogleSignin (only works in development builds, not Expo Go)
const loadGoogleSignin = () => {
  if (Platform.OS !== 'web' && !GoogleSignin) {
    try {
      // This will fail in Expo Go, but work in development builds
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module = require('@react-native-google-signin/google-signin');
      GoogleSignin = module.GoogleSignin;
      return true;
    } catch {
      console.warn(
        '[AUTH] GoogleSignin native module not available. You need a development build.',
      );
      return false;
    }
  }
  return GoogleSignin !== null;
};

// Configure Google Sign-In for native platforms
const configureGoogleSignIn = () => {
  if (Platform.OS !== 'web' && !isGoogleSigninConfigured && loadGoogleSignin()) {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
    isGoogleSigninConfigured = true;
  }
};

/**
 * Signs in a user with Google using native SDK on mobile, popup on web.
 * @returns Object containing user object or error message
 */
export const googleSignInService = async (): Promise<AuthResponse> => {
  try {
    console.log('[AUTH] googleSignInService called, Platform:', Platform.OS);

    if (Platform.OS === 'web') {
      // Web-based Google Sign-In using popup
      console.log('[AUTH] Starting web Google Sign-In with popup');

      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      // Force Google account selection dialog every time
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      console.log('[AUTH] Calling signInWithPopup with account selection prompt...');

      try {
        const userCredential = await signInWithPopup(auth, provider);
        console.log('[AUTH] Sign-in successful, user:', userCredential.user.email);
        return { user: userCredential.user, error: null };
      } catch (popupError: any) {
        console.error('[AUTH] signInWithPopup ERROR:', popupError);
        return { user: null, error: popupError.message };
      }
    } else {
      // Mobile (iOS/Android) - use native Google Sign-In SDK
      console.log('[AUTH] Starting native Google Sign-In');

      // Configure GoogleSignin if not already configured
      configureGoogleSignIn();

      if (!GoogleSignin) {
        throw new Error(
          'Google Sign-In is not available. You need to use a development build (not Expo Go). ' +
            'Run: eas build --platform android --profile development',
        );
      }

      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get the user's ID token
      const userInfo = await GoogleSignin.signIn();
      console.log('[AUTH] Google Sign-In successful:', userInfo.data?.user.email);

      // Create a Google credential with the token
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential = await signInWithCredential(auth, googleCredential);
      console.log('[AUTH] Firebase sign-in successful, user:', userCredential.user.email);

      return { user: userCredential.user, error: null };
    }
  } catch (error: any) {
    console.error('[AUTH] Google Sign-In Error:', error);
    return { user: null, error: error.message };
  }
};

/**
 * Logs in a user with email and password.
 * @param email User's email
 * @param pass User's password
 * @returns Object containing user object or error message
 */
export const loginService = async (email: string, pass: string): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

/**
 * Signs up a new user with email and password.
 * @param email User's email
 * @param pass User's password
 * @returns Object containing user object or error message
 */
export const signupService = async (email: string, pass: string): Promise<AuthResponse> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

/**
 * Logs out the current user.
 */
export const logoutService = async (): Promise<{ error: string | null }> => {
  try {
    console.log('[AUTH] logoutService called');

    // Sign out from Google on native platforms
    if (Platform.OS !== 'web' && loadGoogleSignin() && GoogleSignin) {
      try {
        configureGoogleSignIn();
        await GoogleSignin.signOut();
        console.log('[AUTH] Google signOut completed');
      } catch (googleError) {
        console.log('[AUTH] Google signOut error (user may not be signed in):', googleError);
        // Continue with Firebase logout even if Google signout fails
      }
    }

    // Sign out from Firebase
    await signOut(auth);
    console.log('[AUTH] Firebase signOut completed');

    return { error: null };
  } catch (error: any) {
    console.error('[AUTH] Logout error:', error);
    return { error: error.message };
  }
};

/**
 * Subscribes to authentication state changes.
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const observeAuthState = (callback: (user: User | null) => void) => {
  console.log('[AUTH] Setting up observeAuthState listener');
  return onAuthStateChanged(auth, (user) => {
    console.log('[AUTH] Auth state changed:', user ? `User: ${user.email}` : 'No user');
    callback(user);
  });
};
