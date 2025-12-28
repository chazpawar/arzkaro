import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../src/components/ui/loading-spinner';
import EmptyState from '../src/components/ui/empty-state';
import { Colors } from '../src/constants/Colors';
import { BorderRadius, Spacing } from '../src/constants/Styles';
import { Fonts } from '../src/constants/Fonts';
import { useAuth } from '../src/contexts/auth-context';
import type { Profile } from '../src/types/user.types';
import { getProfile } from '../src/services/user-service';

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { isAuthenticated } = useAuth();

  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Load user profile
  useEffect(() => {
    async function loadUserProfile() {
      if (!userId) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      try {
        const profile = await getProfile(userId);
        setViewedProfile(profile);
      } catch (error) {
        console.error('[USER PROFILE] Error loading profile:', error);
        setViewedProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadUserProfile();
  }, [userId]);

  const handleOpenLink = (url: string | null) => {
    if (!url) return;

    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `https://${url}`;
    }

    Linking.openURL(fullUrl).catch(() => {});
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState
          title="Sign In Required"
          emoji="🔒"
          message="Please sign in to view user profiles."
          action={{
            label: 'Sign In',
            onPress: () => router.push('/'),
          }}
        />
      </SafeAreaView>
    );
  }

  // Loading state
  if (loadingProfile) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.customHeader}>
            <TouchableOpacity style={styles.customBackButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.customHeaderTitle}>Profile</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <LoadingSpinner fullScreen text="Loading profile..." />
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (!viewedProfile) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.customHeader}>
            <TouchableOpacity style={styles.customBackButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.customHeaderTitle}>Profile</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <EmptyState
            title="Profile Not Found"
            emoji="👤"
            message="This user profile doesn't exist or you don't have access to it."
            action={{
              label: 'Go Back',
              onPress: () => router.back(),
            }}
          />
        </SafeAreaView>
      </>
    );
  }

  const displayName = viewedProfile.full_name || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Check if user has any additional info beyond name and email
  const hasAdditionalInfo =
    viewedProfile.bio ||
    viewedProfile.phone ||
    viewedProfile.date_of_birth ||
    viewedProfile.gender ||
    viewedProfile.instagram ||
    viewedProfile.youtube ||
    viewedProfile.linkedin ||
    viewedProfile.twitter ||
    (viewedProfile.interests && viewedProfile.interests.length > 0);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.customHeader}>
          <TouchableOpacity style={styles.customBackButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.customHeaderTitle}>Profile</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Avatar & Name */}
          <View style={styles.topSection}>
            {viewedProfile.avatar_url ? (
              <Image source={{ uri: viewedProfile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>
            )}
            <Text style={styles.displayName}>{displayName}</Text>
            {viewedProfile.username && (
              <Text style={styles.username}>@{viewedProfile.username}</Text>
            )}
            <Text style={styles.email}>{viewedProfile.email}</Text>
          </View>

          {/* Bio */}
          {viewedProfile.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Bio</Text>
              <Text style={styles.bioText}>{viewedProfile.bio}</Text>
            </View>
          )}

          {/* Phone */}
          {viewedProfile.phone && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Phone</Text>
              <Text style={styles.infoText}>{viewedProfile.phone}</Text>
            </View>
          )}

          {/* Date of Birth */}
          {viewedProfile.date_of_birth && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Date of Birth</Text>
              <Text style={styles.infoText}>
                {new Date(viewedProfile.date_of_birth).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}

          {/* Gender */}
          {viewedProfile.gender && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Gender</Text>
              <Text style={styles.infoText}>{viewedProfile.gender}</Text>
            </View>
          )}

          {/* Social Links */}
          {(viewedProfile.instagram ||
            viewedProfile.youtube ||
            viewedProfile.linkedin ||
            viewedProfile.twitter) && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Social Media</Text>
              <View style={styles.socialContainer}>
                {viewedProfile.instagram && (
                  <Pressable
                    style={styles.socialButton}
                    onPress={() => handleOpenLink(viewedProfile.instagram)}
                  >
                    <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                  </Pressable>
                )}
                {viewedProfile.youtube && (
                  <Pressable
                    style={styles.socialButton}
                    onPress={() => handleOpenLink(viewedProfile.youtube)}
                  >
                    <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                  </Pressable>
                )}
                {viewedProfile.linkedin && (
                  <Pressable
                    style={styles.socialButton}
                    onPress={() => handleOpenLink(viewedProfile.linkedin)}
                  >
                    <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
                  </Pressable>
                )}
                {viewedProfile.twitter && (
                  <Pressable
                    style={styles.socialButton}
                    onPress={() => handleOpenLink(viewedProfile.twitter)}
                  >
                    <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Interests */}
          {viewedProfile.interests && viewedProfile.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Interests</Text>
              <View style={styles.interestsContainer}>
                {viewedProfile.interests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Fallback if no additional info */}
          {!hasAdditionalInfo && (
            <View style={styles.emptyStateWrapper}>
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Basic Profile</Text>
                <Text style={styles.emptyStateMessage}>
                  This user hasn't added any additional information yet.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  customBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  topSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.background,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing.md,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 48,
    color: Colors.background,
    fontFamily: Fonts.bold,
  },
  displayName: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    fontFamily: Fonts.medium,
  },
  bioText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  infoText: {
    fontSize: 15,
    color: Colors.text,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  interestTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  interestText: {
    fontSize: 13,
    color: Colors.text,
  },
  emptyStateWrapper: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  emptyStateCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
