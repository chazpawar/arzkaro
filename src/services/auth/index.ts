import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from '../firebase/config';
import { AuthResponse } from './types';

// Only import and configure GoogleSignin for native platforms
let GoogleSignin: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    offlineAccess: true,
  });
}

/**
 * Signs in a user with Google.
 * Uses popup flow on web (works better with Expo web and localhost)
 * Uses native Google Sign-In on iOS/Android
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
      // This ensures users can choose a different account even after signing in
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
      // Native Google Sign-In (iOS/Android)
      if (!GoogleSignin) {
        return { user: null, error: 'Google Sign-In not available' };
      }

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        return { user: null, error: 'Failed to get Google ID token' };
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);
      return { user: userCredential.user, error: null };
    }
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
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

    // Sign out from Firebase
    await signOut(auth);
    console.log('[AUTH] Firebase signOut completed');

    // Sign out from Google if on native platforms
    if (Platform.OS !== 'web' && GoogleSignin) {
      try {
        await GoogleSignin.signOut();
        console.log('[AUTH] Google native signOut completed');
      } catch (googleError) {
        // Ignore Google sign out errors
        console.warn('[AUTH] Google sign out error:', googleError);
      }
    }

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
