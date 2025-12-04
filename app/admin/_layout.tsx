import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/contexts/auth-context';
import LoadingSpinner from '../../src/components/ui/loading-spinner';

export default function AdminLayout() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    // Redirect non-admins after auth is loaded
    if (!loading && !isAdmin) {
      router.replace('/');
    }
  }, [loading, isAdmin, router]);

  // Show loading while checking auth
  if (loading) {
    return <LoadingSpinner fullScreen text="Checking permissions..." />;
  }

  // Don't render anything if not admin (redirect will happen)
  if (!isAdmin) {
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
          title: 'Admin Dashboard',
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'User Management',
        }}
      />
      <Stack.Screen
        name="host-requests"
        options={{
          title: 'Host Requests',
        }}
      />
      <Stack.Screen
        name="events"
        options={{
          title: 'Event Management',
        }}
      />
    </Stack>
  );
}
