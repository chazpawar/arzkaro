import React from 'react';
import { Redirect } from 'expo-router';
import LoadingSpinner from '../src/components/ui/loading-spinner';
import AuthScreen from '../src/components/AuthScreen';
import { useAuth } from '../src/contexts/auth-context';

export default function HomeScreen() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <Redirect href="/(tabs)/explore" />;
}
