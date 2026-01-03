import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../src/components/ui/back-button';
import { Colors } from '../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../src/constants/Styles';
import { Fonts } from '../src/constants/Fonts';
import { useAuth } from '../src/contexts/auth-context';
import { supabase } from '../backend/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  // Load user's current profile visibility setting
  React.useEffect(() => {
    const loadProfileSettings = async () => {
      if (!user?.id) return;

      try {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('is_public')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('[Settings] Error loading profile settings:', error);
          return;
        }

        if (data) {
          setIsPublic(data.is_public ?? true);
        }
      } catch (error) {
        console.error('[Settings] Error in loadProfileSettings:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfileSettings();
  }, [user?.id]);

  // Handle account visibility toggle
  const handleVisibilityToggle = async (value: boolean) => {
    if (!user?.id) return;

    try {
      setUpdatingVisibility(true);
      setIsPublic(value); // Optimistically update UI

      const { error } = await supabase
        .from('profiles')
        .update({ is_public: value })
        .eq('id', user.id);

      if (error) {
        console.error('[Settings] Error updating profile visibility:', error);
        // Revert on error
        setIsPublic(!value);
        Alert.alert('Error', 'Failed to update account visibility. Please try again.');
        return;
      }

      console.log(`[Settings] Profile visibility updated to: ${value ? 'Public' : 'Private'}`);
    } catch (error) {
      console.error('[Settings] Error in handleVisibilityToggle:', error);
      // Revert on error
      setIsPublic(!value);
      Alert.alert('Error', 'Failed to update account visibility. Please try again.');
    } finally {
      setUpdatingVisibility(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.\n\nAll your data including:\n• Profile information\n• Event bookings\n• Messages\n• Photos\n\nwill be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'This is your last chance. Are you absolutely sure you want to permanently delete your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, delete permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);

              if (!user?.id) {
                throw new Error('No user found');
              }

              console.log('[Settings] Starting account deletion for user:', user.id);

              // Get the current session token
              const {
                data: { session },
                error: sessionError,
              } = await supabase.auth.getSession();

              if (sessionError || !session) {
                throw new Error('No active session found');
              }

              // Call the Edge Function to delete user account
              // This function has service role access to delete auth users
              console.log('[Settings] Calling delete-user-account Edge Function...');

              const { data, error } = await supabase.functions.invoke('delete-user-account', {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              });

              console.log('[Settings] Response data:', data);
              console.log('[Settings] Response error:', error);

              if (error) {
                console.error('[Settings] Edge Function error:', error);
                console.error('[Settings] Error details:', JSON.stringify(error, null, 2));

                // Try to extract more error details
                let errorMessage = 'Failed to delete account. Please contact support.';

                // Check if data contains error info (sometimes errors return in data)
                if (data?.error) {
                  console.error('[Settings] Error from data:', data.error);
                  errorMessage = data.error;
                  if (data.details) {
                    console.error('[Settings] Error details from data:', data.details);
                    errorMessage += ` (${data.details})`;
                  }
                }

                throw new Error(errorMessage);
              }

              if (!data?.success) {
                console.error('[Settings] Edge Function returned unsuccessful:', data);
                throw new Error(data?.error || 'Failed to delete account. Please contact support.');
              }

              console.log('[Settings] Account deleted successfully:', data);

              // Sign out the user
              await signOut();

              Alert.alert(
                'Account Deleted',
                "Your account has been permanently deleted. We're sorry to see you go.",
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/'),
                  },
                ]
              );
            } catch (error: any) {
              console.error('[Settings] Error deleting account:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to delete account. Please try again or contact support.'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Custom Header */}
          <View style={styles.header}>
            <BackButton variant="minimal" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>App configuration</Text>
            </View>
            <View style={styles.headerActionPlaceholder} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Profile</Text>

              <View style={styles.menuList}>
                <View style={styles.menuItem}>
                  <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceSecondary }]}>
                    <Ionicons
                      name={isPublic ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={Colors.text}
                    />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>
                      {isPublic ? 'Public Account' : 'Private Account'}
                    </Text>
                    <Text style={styles.menuSubtitle}>
                      {isPublic
                        ? 'Your profile is visible to everyone'
                        : 'Your profile is only visible to you'}
                    </Text>
                  </View>
                  <Switch
                    value={isPublic}
                    onValueChange={handleVisibilityToggle}
                    disabled={loadingProfile || updatingVisibility}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            </View>

            {/* Preferences */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Preferences</Text>

              <View style={styles.menuList}>
                <View style={styles.menuItem}>
                  <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceSecondary }]}>
                    <Ionicons name="notifications-outline" size={20} color={Colors.text} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Push Notifications</Text>
                    <Text style={styles.menuSubtitle}>Stay updated</Text>
                  </View>
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            </View>

            {/* Support */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Support</Text>
              <View style={styles.menuList}>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    const email = 'thearzkaro@gmail.com';
                    const subject = 'Support Request';
                    const body = 'Hi Arzkaro Team,\n\n';
                    Linking.openURL(
                      `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                    );
                  }}
                >
                  <View style={[styles.menuIcon, { backgroundColor: Colors.primarySoft }]}>
                    <Ionicons name="mail-outline" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Contact Us</Text>
                    <Text style={styles.menuSubtitle}>Get in touch with our team</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            {/* Legal */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Legal</Text>
              <View style={styles.menuList}>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    // TODO: Replace with actual Terms & Conditions URL
                    Linking.openURL('https://arzkaro.com/terms');
                  }}
                >
                  <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceSecondary }]}>
                    <Ionicons name="document-text-outline" size={20} color={Colors.text} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Terms & Conditions</Text>
                    <Text style={styles.menuSubtitle}>View our terms of service</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </Pressable>

                <View style={styles.menuItemBorder} />

                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    // TODO: Replace with actual Privacy Policy URL
                    Linking.openURL('https://arzkaro.com/privacy');
                  }}
                >
                  <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceSecondary }]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={Colors.text} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Privacy Policy</Text>
                    <Text style={styles.menuSubtitle}>How we handle your data</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            {/* Danger Zone */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeader, styles.dangerHeader]}>Danger Zone</Text>
              <View style={styles.menuList}>
                <Pressable
                  style={styles.menuItem}
                  onPress={handleDeleteAccount}
                  disabled={deleting}
                >
                  <View style={[styles.menuIcon, { backgroundColor: Colors.errorLight }]}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, styles.dangerText]}>
                      {deleting ? 'Deleting Account...' : 'Delete Account'}
                    </Text>
                    <Text style={styles.menuSubtitle}>
                      Permanently delete your account and data
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.error} />
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.bodyLarge,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  headerActionPlaceholder: {
    width: 32,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    ...Typography.bodySmall,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: Spacing.xs,
  },
  menuList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.bodyMedium,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  menuSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  dangerHeader: {
    color: Colors.error,
  },
  dangerText: {
    color: Colors.error,
  },
});
