import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import EditProfileForm from '../src/components/edit-profile-form';
import LoadingSpinner from '../src/components/ui/loading-spinner';
import EmptyState from '../src/components/ui/empty-state';
import { Colors } from '../src/constants/Colors';
import { Spacing } from '../src/constants/Styles';
import { useAuth } from '../src/contexts/auth-context';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, refreshProfile, isAuthenticated } = useAuth();

  const handleSuccess = async () => {
    // Refresh the profile data in the auth context
    await refreshProfile();
    // Navigate back to profile tab
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Sign In Required"
          emoji="🔒"
          message="Please sign in to edit your profile."
          action={{
            label: 'Sign In',
            onPress: () => router.push('/'),
          }}
        />
      </SafeAreaView>
    );
  }

  // Loading profile
  if (!profile) {
    return <LoadingSpinner fullScreen text="Loading profile..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
      </View>

      {/* Edit Profile Form */}
      <EditProfileForm profile={profile} onSuccess={handleSuccess} onCancel={handleCancel} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
});
