import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { Database } from './types/database.types';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string | undefined;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined;

// Check if we have valid credentials
export const hasValidCredentials = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
);

if (!hasValidCredentials) {
  console.warn(
    'Missing or invalid Supabase environment variables. Please create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Create a placeholder client if credentials are missing (for development)
const placeholderUrl = 'https://placeholder.supabase.co';
const placeholderKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder';

// Create typed client with Database types
export const supabase = createClient<Database>(
  supabaseUrl || placeholderUrl,
  supabaseAnonKey || placeholderKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // Use implicit flow for React Native - tokens come in URL fragment
      // PKCE doesn't work well because code_verifier is lost when app restarts
      flowType: 'implicit',
    },
  }
);

// Get the redirect URL for OAuth flows
export const getRedirectUrl = () => {
  if (Platform.OS === 'web') {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`;
  }
  // For native apps, use custom scheme
  // This will be configured in app.config.js
  return 'arzkaro://auth/callback';
};
