import { View, Text, TouchableOpacity, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { googleSignInService, logoutService, observeAuthState } from '../src/services/auth';
import { User } from 'firebase/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  console.log(
    '[UI] Component render - user:',
    user?.email || 'null',
    'loading:',
    loading,
    'initializing:',
    initializing,
  );

  // Handle auth state changes
  useEffect(() => {
    console.log('[UI] useEffect called - setting up auth listener');

    const unsubscribe = observeAuthState((currentUser) => {
      console.log('[UI] observeAuthState callback - user:', currentUser?.email || 'null');
      setUser(currentUser);
      setInitializing(false);
    });

    return () => {
      console.log('[UI] useEffect cleanup - unsubscribing');
      unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    console.log('[UI] handleGoogleSignIn clicked');
    setLoading(true);

    const res = await googleSignInService();
    console.log('[UI] googleSignInService returned:', res);

    if (res.error) {
      console.log('[UI] Sign-in error:', res.error);
      alert(`Sign-In Error: ${res.error}`);
    } else if (res.user) {
      console.log('[UI] Sign-in successful, user:', res.user.email);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    console.log('[UI] handleLogout clicked');
    setLoading(true);
    await logoutService();
    console.log('[UI] Logout completed');
    setLoading(false);
  };

  // Show loading spinner while checking auth state on initial load
  if (initializing) {
    console.log('[UI] Rendering: INITIALIZING SCREEN');
    return (
      <SafeAreaView style={styles.safeArea}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-gray-600 mt-4">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (user) {
    console.log('[UI] Rendering: USER LOGGED IN SCREEN for', user.email);
    return (
      <SafeAreaView style={styles.safeArea}>
        <View className="flex-1 items-center justify-center px-6">
          {/* User Avatar */}
          <View className="mb-8">
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text className="text-white text-4xl font-bold">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Welcome Text */}
          <Text className="text-3xl font-bold text-gray-800 mb-2 text-center">Welcome!</Text>
          <Text className="text-lg text-gray-600 mb-1 text-center">
            {user.displayName || 'Google User'}
          </Text>
          <Text className="text-sm text-gray-500 mb-8 text-center">{user.email}</Text>

          {/* Success Icon */}
          <View className="mb-8 bg-green-100 rounded-full p-4">
            <Text className="text-4xl">✓</Text>
          </View>

          <Text className="text-center text-gray-600 mb-8 px-8">
            You're successfully signed in with Google
          </Text>

          {/* Logout Button */}
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.7} style={styles.logoutButton}>
            <Text className="text-gray-700 font-semibold text-base">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  console.log('[UI] Rendering: LOGIN SCREEN (no user)');
  return (
    <SafeAreaView style={styles.safeArea}>
      <View className="flex-1 items-center justify-center px-6">
        {/* App Logo/Icon */}
        <View className="mb-12">
          <View style={styles.appIcon}>
            <Text className="text-4xl text-white">🔐</Text>
          </View>
        </View>

        {/* Title */}
        <Text className="text-4xl font-bold text-gray-900 mb-3 text-center">
          Welcome to Arzkaro
        </Text>
        <Text className="text-base text-gray-500 mb-12 text-center px-4">
          Sign in with your Google account to continue
        </Text>

        {/* Google Sign-In Button */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.7}
          style={styles.googleButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <>
              {/* Google Logo */}
              <View className="mr-3">
                <Text className="text-2xl">G</Text>
              </View>
              <Text className="text-gray-700 font-semibold text-base">Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text className="text-xs text-gray-400 text-center">
            By continuing, you agree to our Terms of Service{'\n'}and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  appIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#4f46e5',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
  },
  logoutButton: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    paddingHorizontal: 24,
  },
});
