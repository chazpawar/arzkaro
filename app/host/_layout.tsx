import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/contexts/auth-context';
import LoadingSpinner from '../../src/components/ui/loading-spinner';

export default function HostLayout() {
  const router = useRouter();
  const { isHost, loading } = useAuth();

  useEffect(() => {
    // Redirect non-hosts after auth is loaded
    if (!loading && !isHost) {
      console.warn('🚫 Access denied: User is not a host. Redirecting to home.');
      router.replace('/');
    }
  }, [loading, isHost, router]);

  // Show loading while checking auth
  if (loading) {
    return <LoadingSpinner fullScreen text="Checking permissions..." />;
  }

  // Don't render anything if not host (redirect will happen)
  if (!isHost) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Host Dashboard',
        }}
      />
      <Stack.Screen
        name="events"
        options={{
          title: 'My Events',
        }}
      />
      <Stack.Screen
        name="request"
        options={{
          title: 'Become a Host',
        }}
      />
      <Stack.Screen
        name="scanner"
        options={{
          title: 'Scan Tickets',
          presentation: 'fullScreenModal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
