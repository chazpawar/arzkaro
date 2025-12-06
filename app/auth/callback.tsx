import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { handleOAuthCallback } from '../../backend/auth';

/**
 * OAuth Callback Handler for arzkaro://auth/callback
 * Handles the redirect from OAuth providers (like Google)
 * Works with PKCE flow - authorization code is exchanged for tokens
 */
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the full URL that opened this screen
        const url = await Linking.getInitialURL();

        console.log('Callback URL:', url);

        if (url) {
          // Use the handleOAuthCallback helper which handles PKCE flow
          // It extracts the authorization code and exchanges it for a session
          const session = await handleOAuthCallback(url);

          if (session) {
            console.log('Session created successfully via PKCE!');
          } else {
            console.log('No session created - no authorization code in URL');
          }
        }

        // Navigate to home - AuthContext will detect the new session
        router.replace('/');
      } catch (err) {
        console.error('Callback error:', err);
        router.replace('/');
      }
    };

    handleCallback();
  }, [router]);

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
