// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { Platform } from 'react-native';

// Initialize WebBrowser for auth sessions
WebBrowser.maybeCompleteAuthSession();

/**
 * Parse OAuth callback URL and extract tokens or authorization code
 * PKCE flow returns an authorization code in the URL
 */
const parseOAuthCallback = (
  url: string
): { code?: string; error?: string; error_description?: string } => {
  try {
    // Try to parse from query params (PKCE flow)
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      const query = url.substring(queryIndex + 1);
      const params = new URLSearchParams(query);
      const code = params.get('code') || undefined;
      const error = params.get('error') || undefined;
      const error_description = params.get('error_description') || undefined;

      if (code || error) {
        return { code, error, error_description };
      }
    }

    // Also check hash fragment for backward compatibility
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const fragment = url.substring(hashIndex + 1);
      const params = new URLSearchParams(fragment);
      const code = params.get('code') || undefined;
      const error = params.get('error') || undefined;
      const error_description = params.get('error_description') || undefined;

      if (code || error) {
        return { code, error, error_description };
      }
    }

    return {};
  } catch (err) {
    console.error('Error parsing OAuth callback URL:', err);
    return {};
  }
};

/**
 * Handle OAuth callback - exchange code for session (PKCE flow)
 * Supabase client handles the code exchange automatically
 */
export const handleOAuthCallback = async (url: string) => {
  console.log('Handling OAuth callback URL:', url);

  const { code, error: urlError, error_description } = parseOAuthCallback(url);

  if (urlError) {
    console.error('OAuth error:', urlError, error_description);
    throw new Error(error_description || urlError);
  }

  if (!code) {
    console.log('No authorization code found in URL');
    return null;
  }

  console.log('Found authorization code, exchanging for session...');

  // Supabase client automatically exchanges the code for a session
  // using the stored code_verifier from AsyncStorage
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Error exchanging code for session:', error);
    throw error;
  }

  console.log('Session created successfully!');
  return data.session;
};

/**
 * Create an auth request for Google OAuth using Supabase
 * Uses PKCE flow for better security on native platforms
 */
export const signInWithGoogle = async () => {
  try {
    // Use custom scheme with /auth/callback path
    const redirectUrl = 'arzkaro://auth/callback';

    console.log('Redirect URL:', redirectUrl);

    // Start OAuth flow with Supabase - PKCE flow is automatic
    // skipBrowserRedirect is needed for React Native to handle the redirect manually
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: Platform.OS !== 'web', // Let native app handle the redirect
        // Request offline access to get refresh token
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;

    console.log('OAuth URL:', data?.url);

    // For native platforms, open the OAuth URL in browser
    if (Platform.OS !== 'web' && data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success') {
        const { url } = result;
        // Exchange the authorization code for a session
        await handleOAuthCallback(url);
      } else if (result.type === 'cancel') {
        console.log('User cancelled OAuth flow');
        return { data: null, error: new Error('User cancelled') };
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
