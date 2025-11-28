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
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

// Complete the web browser session after auth redirect
WebBrowser.maybeCompleteAuthSession();

/**
 * Signs in a user with Google using expo-auth-session (cross-platform compatible).
 * Works on web, iOS, and Android with Expo Go.
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
      // Mobile (iOS/Android) - use expo-auth-session
      // This function should be called from a component that has access to the hook
      return {
        user: null,
        error:
          'Please use the useGoogleAuth hook for mobile platforms. See updated implementation.',
      };
    }
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    return { user: null, error: error.message };
  }
};

/**
 * Hook for Google authentication using expo-auth-session.
 * This works on all platforms including Expo Go.
 * Usage: const [request, response, promptAsync] = useGoogleAuth();
 */
export const useGoogleAuth = () => {
  const redirectUri = makeRedirectUri({
    scheme: 'arzkaro', // matches your app.json scheme
  });

  console.log('[AUTH] Google Auth redirectUri:', redirectUri);

  return Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Use web client ID for Android
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    // Force account selection
    selectAccount: true,
  });
};

/**
 * Exchange Google auth code for Firebase credential and sign in
 * @param idToken Google ID token from auth response
 * @returns Object containing user object or error message
 */
export const signInWithGoogleCredential = async (idToken: string): Promise<AuthResponse> => {
  try {
    console.log('[AUTH] Exchanging Google ID token for Firebase credential');

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);

    console.log('[AUTH] Firebase sign-in successful, user:', userCredential.user.email);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('[AUTH] Firebase sign-in error:', error);
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
