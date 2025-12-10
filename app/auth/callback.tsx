import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { handleOAuthCallback } from '../../backend/auth';
import { supabase } from '../../backend/supabase';
import { useAuth } from '../../src/contexts/auth-context';

/**
 * OAuth Callback Handler for arzkaro://auth/callback
 * Handles the redirect from OAuth providers (like Google)
 * Works with PKCE flow - authorization code is exchanged for tokens
 *
 * IMPORTANT: This screen is responsible for triggering profile fetch
 * AFTER the session exchange completes. The onAuthStateChange listener
 * skips profile fetch for SIGNED_IN events because they fire DURING
 * exchangeCodeForSession, not after.
 */
export default function AuthCallback() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the full URL that opened this screen
        const url = await Linking.getInitialURL();

        console.log('📱 [CALLBACK] OAuth callback screen mounted');
        console.log('📱 [CALLBACK] Initial URL:', url);

        // NOTE: The OAuth callback might have already been handled by signInWithGoogle()
        // in backend/auth.ts when WebBrowser.openAuthSessionAsync returned.
        // In that case, we just need to fetch the profile for the current session.

        // First, check if we already have a session (code was already exchanged)
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (existingSession?.user) {
          console.log(
            '✅ [CALLBACK] Session already exists (OAuth was handled by signInWithGoogle)'
          );
          console.log('✅ [CALLBACK] User:', existingSession.user.id);

          // Fetch profile for the existing session
          console.log('📡 [CALLBACK] Fetching profile for existing session...');
          const profile = await refreshProfile(existingSession.user.id);
          console.log('✅ [CALLBACK] Profile fetch completed:', profile?.role);
        } else if (url) {
          // No existing session, try to handle the OAuth callback
          console.log('🔄 [CALLBACK] No existing session, handling OAuth callback...');
          const session = await handleOAuthCallback(url);

          if (session?.user?.id) {
            console.log('✅ [CALLBACK] OAuth callback completed successfully');
            console.log('📡 [CALLBACK] Fetching profile now that session is ready...');
            const profile = await refreshProfile(session.user.id);
            console.log('✅ [CALLBACK] Profile fetch completed:', profile?.role);
          } else {
            console.log('⚠️  [CALLBACK] No session created from OAuth callback');
          }
        } else {
          console.log('⚠️  [CALLBACK] No URL and no existing session');
        }

        // Navigate to home
        console.log('🏠 [CALLBACK] Navigating to home...');
        router.replace('/');
      } catch (err) {
        console.error('❌ [CALLBACK] Error:', err);
        router.replace('/');
      }
    };

    handleCallback();
  }, [router, refreshProfile]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
