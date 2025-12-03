import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { Platform } from 'react-native';

// Initialize WebBrowser for auth sessions
WebBrowser.maybeCompleteAuthSession();

/**
 * Parse tokens from URL - handles both query params and hash fragments
 * Implicit flow returns tokens in the URL fragment (#access_token=...)
 */
const parseTokensFromUrl = (url: string): { access_token?: string; refresh_token?: string; error?: string } => {
  try {
    // Try to parse from hash fragment first (implicit flow)
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const fragment = url.substring(hashIndex + 1);
      const params = new URLSearchParams(fragment);
      const access_token = params.get('access_token') || undefined;
      const refresh_token = params.get('refresh_token') || undefined;
      const error = params.get('error') || undefined;
      
      if (access_token || error) {
        return { access_token, refresh_token, error };
      }
    }
    
    // Fallback to query params
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      const query = url.substring(queryIndex + 1);
      const params = new URLSearchParams(query);
      return {
        access_token: params.get('access_token') || undefined,
        refresh_token: params.get('refresh_token') || undefined,
        error: params.get('error') || undefined,
      };
    }
    
    return {};
  } catch (err) {
    console.error('Error parsing URL tokens:', err);
    return {};
  }
};

/**
 * Create a session from the callback URL (implicit flow)
 * Tokens come directly in the URL fragment
 */
export const createSessionFromUrl = async (url: string) => {
  console.log('Creating session from URL:', url);
  
  const { access_token, refresh_token, error: urlError } = parseTokensFromUrl(url);
  
  if (urlError) {
    throw new Error(urlError);
  }
  
  if (!access_token) {
    console.log('No access_token found in URL');
    return null;
  }
  
  console.log('Found tokens, setting session...');
  
  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token: refresh_token || '',
  });
  
  if (error) throw error;
  
  console.log('Session set successfully!');
  return data.session;
};

/**
 * Create an auth request for Google OAuth using Supabase
 * This works cross-platform (iOS, Android, Web)
 */
export const signInWithGoogle = async () => {
  try {
    // Use custom scheme with /auth/callback path
    const redirectUrl = 'arzkaro://auth/callback';
    
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
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success') {
        const { url } = result;
        await createSessionFromUrl(url);
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
