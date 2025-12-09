import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../../src/contexts/auth-context';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { Colors } from '../../src/constants/Colors';

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
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="users" />
      <Stack.Screen name="host-requests" />
      <Stack.Screen name="events" />
    </Stack>
  );
}
