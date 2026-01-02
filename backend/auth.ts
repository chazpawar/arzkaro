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

  console.log('📝 [OAUTH] Found authorization code, exchanging for session...');

  // Supabase client automatically exchanges the code for a session
  // using the stored code_verifier from AsyncStorage
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('❌ [OAUTH] Error exchanging code for session:', error);
    throw error;
  }

  if (!data.session) {
    console.error('❌ [OAUTH] No session returned from exchangeCodeForSession');
    return null;
  }

  console.log('✅ [OAUTH] Session exchange completed');
  return data.session;
};

/**
 * Create an auth request for Google OAuth using Supabase
 * Uses PKCE flow for better security on native platforms
 * Returns the session if successful so caller can fetch profile
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
        const session = await handleOAuthCallback(url);

        // Return the session so caller can fetch profile
        return { data: { session }, error: null };
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

/**
 * Send OTP to email for signup
 * Uses signInWithOtp which is idempotent and automatically handles:
 * - Creating new user if doesn't exist
 * - Resending OTP if user exists but unconfirmed
 * - Preventing login if user exists and is confirmed (use shouldCreateUser: false)
 *
 * Note: The email template must include {{ .Token }} to display the OTP code
 *
 * IMPORTANT: We store full_name and password in user metadata during OTP verification,
 * not during signup, because signInWithOtp doesn't support password parameter.
 */
export const sendSignupOTP = async (email: string, fullName: string, password: string) => {
  try {
    console.log('📝 [EMAIL_OTP] Sending OTP to:', email);

    // Trim and lowercase the email to avoid validation issues
    const cleanEmail = email.trim().toLowerCase();

    // Validate email format locally first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Invalid email format');
    }

    // Validate password
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Use signInWithOtp for idempotent signup
    // This automatically creates the user if they don't exist, or resends OTP if they do
    const { data, error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        // Auto-create user on signup (default is true)
        shouldCreateUser: true,
        // Store metadata that we'll use after OTP verification
        data: {
          full_name: fullName,
          // Store password temporarily - we'll set it after OTP verification
          temp_password: password,
        },
      },
    });

    if (error) {
      console.error('❌ [EMAIL_OTP] Error:', error);

      // Handle specific error cases
      if (error.message?.includes('User already registered')) {
        throw new Error('This email is already registered. Please log in instead.');
      }

      if (error.message?.includes('rate limit')) {
        throw new Error('Too many attempts. Please wait a moment and try again.');
      }

      throw error;
    }

    console.log('✅ [EMAIL_OTP] OTP sent successfully');
    console.log('✅ [EMAIL_OTP] Response data:', JSON.stringify(data, null, 2));

    // signInWithOtp returns { user: null, session: null } on success
    // The user must verify the OTP to complete signup
    return { data, error: null };
  } catch (error) {
    console.error('Send OTP Error:', error);
    return { data: null, error };
  }
};

/**
 * Verify email OTP and create session
 * This verifies the OTP code sent to the user's email
 * After verification, sets the user's password from temp_password in metadata
 */
export const verifyEmailOTP = async (email: string, token: string) => {
  try {
    console.log('📝 [EMAIL_OTP_VERIFY] Verifying OTP for:', email);

    // Trim and lowercase the email to match what was sent
    const cleanEmail = email.trim().toLowerCase();

    // Verify the OTP code using type 'email' for signInWithOtp flow
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: token.trim(),
      type: 'email',
    });

    if (error) {
      console.error('❌ [EMAIL_OTP_VERIFY] Error:', error);
      throw error;
    }

    if (!data.session || !data.user) {
      throw new Error('No session created after OTP verification');
    }

    console.log('✅ [EMAIL_OTP_VERIFY] OTP verified successfully');

    // Set the password from metadata if it exists
    const tempPassword = data.user.user_metadata?.temp_password;
    if (tempPassword) {
      console.log('📝 [EMAIL_OTP_VERIFY] Setting user password...');

      const { error: updateError } = await supabase.auth.updateUser({
        password: tempPassword,
        data: {
          // Remove temp_password from metadata after setting it
          temp_password: null,
        },
      });

      if (updateError) {
        console.error('⚠️ [EMAIL_OTP_VERIFY] Failed to set password:', updateError);
        // Don't throw - user is already authenticated, password can be set later
      } else {
        console.log('✅ [EMAIL_OTP_VERIFY] Password set successfully');
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return { data: null, error };
  }
};

/**
 * Resend OTP to email
 * Uses signInWithOtp which is idempotent
 */
export const resendSignupOTP = async (email: string) => {
  try {
    console.log('📝 [EMAIL_OTP_RESEND] Resending OTP to:', email);

    // Trim and lowercase the email
    const cleanEmail = email.trim().toLowerCase();

    // Use signInWithOtp to resend - it's idempotent
    const { data, error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: false, // Don't create new user on resend
      },
    });

    if (error) {
      console.error('❌ [EMAIL_OTP_RESEND] Error:', error);
      throw error;
    }

    console.log('✅ [EMAIL_OTP_RESEND] OTP resent successfully');
    return { data, error: null };
  } catch (error) {
    console.error('Resend OTP Error:', error);
    return { data: null, error };
  }
};

/**
 * Sign up with email and password (DEPRECATED - Use OTP instead)
 * Creates a new user account and automatically creates a profile via database trigger
 */
export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  try {
    console.log('📝 [EMAIL_SIGNUP] Starting signup for:', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error('❌ [EMAIL_SIGNUP] Error:', error);
      throw error;
    }

    console.log('✅ [EMAIL_SIGNUP] Signup successful');
    return { data, error: null };
  } catch (error) {
    console.error('Email Sign Up Error:', error);
    return { data: null, error };
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('📝 [EMAIL_LOGIN] Starting login for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ [EMAIL_LOGIN] Error:', error);
      throw error;
    }

    console.log('✅ [EMAIL_LOGIN] Login successful');
    return { data, error: null };
  } catch (error) {
    console.error('Email Sign In Error:', error);
    return { data: null, error };
  }
};
