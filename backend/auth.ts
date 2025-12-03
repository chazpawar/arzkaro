import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { Platform } from 'react-native';

// Initialize WebBrowser for auth sessions
WebBrowser.maybeCompleteAuthSession();

/**
 * Create an auth request for Google OAuth using Supabase
 * This works cross-platform (iOS, Android, Web)
 */
export const signInWithGoogle = async () => {
  try {
    // For iOS simulator, we must use a hardcoded deep link URL
    // makeRedirectUri defaults to localhost in dev which doesn't work
    const redirectUrl = Platform.OS === 'ios' || Platform.OS === 'android'
      ? 'arzkaro://auth/callback'
      : makeRedirectUri({ path: 'auth/callback' });

    console.log('Redirect URL:', redirectUrl);

    // Start OAuth flow with Supabase - use skipBrowserRedirect for native
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // Important for native apps!
        // Request offline access to get refresh token
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;

    console.log('OAuth URL:', data?.url);
    console.log('Full OAuth URL details:', JSON.stringify(data, null, 2));

    // For native platforms, open the OAuth URL in browser
    if (Platform.OS !== 'web' && data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );

      if (result.type === 'success') {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const errorParam = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        if (errorParam) {
          throw new Error(errorDescription || 'OAuth error occurred');
        }

        // Exchange the code for a session
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Google Sign In Error:', error);
    return { data: null, error };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};
