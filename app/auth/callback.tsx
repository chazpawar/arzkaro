import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { createSessionFromUrl } from '../../backend/auth';

/**
 * OAuth Callback Handler for arzkaro://auth/callback
 * Handles the redirect from OAuth providers (like Google)
 * Works with implicit flow - tokens come in URL fragment
 */
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the full URL that opened this screen
        const url = await Linking.getInitialURL();
        // eslint-disable-next-line no-console
        console.log('Callback URL:', url);

        if (url) {
          // Use the createSessionFromUrl helper which handles implicit flow tokens
          const session = await createSessionFromUrl(url);

          if (session) {
            // eslint-disable-next-line no-console
            console.log('Session created successfully!');
          } else {
            // eslint-disable-next-line no-console
            console.log('No session created - no tokens in URL');
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
