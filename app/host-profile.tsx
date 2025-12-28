import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../src/components/ui/button';
import { Colors } from '../src/constants/Colors';
import { BorderRadius, Spacing } from '../src/constants/Styles';
import { Fonts } from '../src/constants/Fonts';
import type { Profile } from '../src/types/user.types';
import { getProfile } from '../src/services/user-service';

export default function HostProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Load host profile - always fetch if userId is provided
  useEffect(() => {
    async function loadHostProfile() {
      if (userId) {
        setLoadingProfile(true);
        try {
          const profile = await getProfile(userId);
          setViewedProfile(profile);
        } catch (error) {
          console.error('Error loading host profile:', error);
          setViewedProfile(null);
        } finally {
          setLoadingProfile(false);
        }
      }
    }

    loadHostProfile();
  }, [userId]);

  const handleSocialLink = (platform: string, url: string | undefined) => {
    if (!url) return;

    let fullUrl = url;

    // Add https:// if not present
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Handle platform-specific URL formats
      if (platform === 'instagram' && !url.includes('instagram.com')) {
        fullUrl = `https://instagram.com/${url.replace('@', '')}`;
      } else if (platform === 'twitter' && !url.includes('twitter.com')) {
        fullUrl = `https://twitter.com/${url.replace('@', '')}`;
      } else if (platform === 'linkedin' && !url.includes('linkedin.com')) {
        fullUrl = `https://linkedin.com/in/${url}`;
      } else if (platform === 'youtube' && !url.includes('youtube.com')) {
        fullUrl = `https://youtube.com/@${url}`;
      } else {
        fullUrl = `https://${url}`;
      }
    }

    Linking.openURL(fullUrl).catch((err) => {
      console.error('Failed to open URL:', err);
    });
  };

  // Loading state
  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!viewedProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.errorText}>Host profile not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="primary" size="medium" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.profileViewHeader}>
        <TouchableOpacity style={styles.profileBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.profileViewTitle}>Host Profile</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.hostProfileScrollContent}>
        {/* Host Profile Section */}
        <View style={styles.hostProfileSection}>
          {/* Host Profile Card */}
          <View style={styles.hostProfileCard}>
            <View style={styles.hostProfileHeader}>
              {/* Avatar */}
              {viewedProfile.avatar_url ? (
                <Image source={{ uri: viewedProfile.avatar_url }} style={styles.hostAvatarImage} />
              ) : (
                <View style={styles.hostAvatar}>
                  <Text style={styles.hostAvatarText}>
                    {viewedProfile.full_name?.charAt(0).toUpperCase() || 'H'}
                  </Text>
                </View>
              )}

              {/* Host Info */}
              <View style={styles.hostInfo}>
                <Text style={styles.hostName}>{viewedProfile.full_name}</Text>
                {viewedProfile.bio && (
                  <Text style={styles.hostBio} numberOfLines={2}>
                    {viewedProfile.bio}
                  </Text>
                )}
              </View>
            </View>

            {/* Social Icons Row */}
            <View style={styles.socialIconsRow}>
              <TouchableOpacity
                style={styles.socialIconItem}
                onPress={() => handleSocialLink('instagram', viewedProfile.instagram)}
                disabled={!viewedProfile.instagram}
              >
                <Ionicons
                  name="logo-instagram"
                  size={24}
                  color={viewedProfile.instagram ? '#E4405F' : Colors.textTertiary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialIconItem}
                onPress={() => handleSocialLink('youtube', viewedProfile.youtube)}
                disabled={!viewedProfile.youtube}
              >
                <Ionicons
                  name="logo-youtube"
                  size={24}
                  color={viewedProfile.youtube ? '#FF0000' : Colors.textTertiary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialIconItem}
                onPress={() => handleSocialLink('linkedin', viewedProfile.linkedin)}
                disabled={!viewedProfile.linkedin}
              >
                <Ionicons
                  name="logo-linkedin"
                  size={24}
                  color={viewedProfile.linkedin ? '#0077B5' : Colors.textTertiary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialIconItem}
                onPress={() => handleSocialLink('twitter', viewedProfile.twitter)}
                disabled={!viewedProfile.twitter}
              >
                <Ionicons
                  name="logo-twitter"
                  size={24}
                  color={viewedProfile.twitter ? '#1DA1F2' : Colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Terms & Conditions Section */}
        <View style={styles.policySection}>
          <Text style={styles.policyTitle}>Terms & Conditions:</Text>
          <View style={styles.policyContent}>
            <Text style={styles.policyText}>
              • All bookings are subject to availability{'\n'}• Full payment required at time of
              booking{'\n'}• Participants must be 18+ years old{'\n'}• Valid ID proof required for
              verification{'\n'}• Follow all safety guidelines during the trip
            </Text>
          </View>
        </View>

        {/* Cancellation Policy Section */}
        <View style={styles.policySection}>
          <Text style={styles.policyTitle}>Cancellation Policy:</Text>
          <View style={styles.policyContent}>
            <Text style={styles.policyText}>
              • 100% refund if cancelled 15+ days before trip{'\n'}• 50% refund if cancelled 7-14
              days before trip{'\n'}• No refund if cancelled less than 7 days before trip{'\n'}•
              Refunds processed within 7-10 business days
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  profileViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  profileBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileViewTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  hostProfileScrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  hostProfileSection: {
    marginBottom: Spacing.xl,
  },
  hostProfileCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.text,
    padding: Spacing.lg,
  },
  hostProfileHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  hostAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  hostAvatarText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  hostInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hostName: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  hostBio: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  socialIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  socialIconItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  policySection: {
    marginBottom: Spacing.xl,
  },
  policyTitle: {
    fontSize: 20,
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.md,
  },
  policyContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  policyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
