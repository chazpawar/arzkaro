import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../src/components/ui/button';
import Card from '../src/components/ui/card';
import Modal from '../src/components/ui/modal';
import HostApplicationForm from '../src/components/host/host-application-form';
import { Colors } from '../src/constants/Colors';
import { BorderRadius, Spacing, Typography } from '../src/constants/Styles';
import { Fonts } from '../src/constants/Fonts';
import { useAuth } from '../src/contexts/auth-context';
import {
  getLatestHostRequest,
  hasPendingHostRequest,
  HOST_TYPE_LABELS,
} from '../src/services/host-service';
import type { HostRequest } from '../src/types/host.types';
import type { Profile } from '../src/types/user.types';
import { useHostEvents } from '../src/hooks/use-events';

export default function ProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { user, profile, isHost, isAdmin, signOut } = useAuth();

  // Check if viewing another user's profile
  const isViewingOtherProfile = userId && userId !== user?.id;
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showHostApplicationModal, setShowHostApplicationModal] = useState(false);
  const [hostRequest, setHostRequest] = useState<HostRequest | null>(null);
  const [loadingHostRequest, setLoadingHostRequest] = useState(true);
  const [hasPending, setHasPending] = useState(false);

  // Get host's events using real hook (must be called at top level)
  // Note: Currently not displayed in the UI, but keeping for future use
  const { events: _hostEvents, loading: _eventsLoading } = useHostEvents(
    isViewingOtherProfile ? userId : undefined
  );

  // Get user metadata from Google OAuth
  const userMetadata = user?.user_metadata;
  const fullName = userMetadata?.full_name || userMetadata?.name || 'Anonymous User';
  const email = user?.email || 'No email provided';
  const avatarUrl = userMetadata?.avatar_url || userMetadata?.picture;
  const provider = user?.app_metadata?.provider || 'email';

  // Load host profile if viewing another user
  useEffect(() => {
    if (isViewingOtherProfile && userId) {
      setLoadingProfile(true);
      // Mock host profile data for demonstration
      setTimeout(() => {
        setViewedProfile({
          id: userId,
          email: 'aditya.negi@example.com',
          full_name: 'Aditya Negi',
          username: 'adityanegi',
          avatar_url: 'https://i.pravatar.cc/150?img=12',
          bio: 'Aditya born in Bangalore. Have studied Computer Science, even...',
          phone: null,
          role: 'host',
          host_type: 'full',
          is_host_approved: true,
          host_requested_at: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          host_approved_at: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          is_public: true,
          location: 'Bangalore, India',
          website: null,
          created_at: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        });
        setLoadingProfile(false);
      }, 300);
    }
  }, [isViewingOtherProfile, userId]);

  // Load host request status
  useEffect(() => {
    async function loadHostRequestStatus() {
      if (!user?.id || isViewingOtherProfile) return;

      try {
        setLoadingHostRequest(true);
        const [pending, latestRequest] = await Promise.all([
          hasPendingHostRequest(user.id),
          getLatestHostRequest(user.id),
        ]);

        setHasPending(pending);
        setHostRequest(latestRequest);
      } catch (error) {
        console.error('Error loading host request:', error);
      } finally {
        setLoadingHostRequest(false);
      }
    }

    loadHostRequestStatus();
  }, [user?.id, isViewingOtherProfile]);

  const handleHostApplicationSuccess = async () => {
    setShowHostApplicationModal(false);
    // Reload host request status
    if (user?.id) {
      const [pending, latestRequest] = await Promise.all([
        hasPendingHostRequest(user.id),
        getLatestHostRequest(user.id),
      ]);
      setHasPending(pending);
      setHostRequest(latestRequest);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoggingOut(true);
            await signOut();
            router.replace('/');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const getHostStatusBadge = () => {
    if (isAdmin) {
      return { label: 'Admin', color: Colors.error, bgColor: Colors.errorLight };
    }
    if (isHost) {
      const hostType = profile?.host_type ? HOST_TYPE_LABELS[profile.host_type] : 'Host';
      return { label: hostType, color: Colors.success, bgColor: Colors.successLight };
    }
    if (hasPending) {
      return { label: 'Pending Review', color: Colors.warning, bgColor: Colors.warningLight };
    }
    return null;
  };

  const getHostRequestStatusBadge = () => {
    if (!hostRequest) return null;

    const statusMap = {
      pending: { label: 'Under Review', color: Colors.warning, bgColor: Colors.warningLight },
      approved: { label: 'Approved', color: Colors.success, bgColor: Colors.successLight },
      rejected: { label: 'Rejected', color: Colors.error, bgColor: Colors.errorLight },
    };

    return statusMap[hostRequest.status];
  };

  // Render host profile view
  if (isViewingOtherProfile) {
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

    // Calculate years of hosting
    const yearsOfHosting = viewedProfile.host_approved_at
      ? Math.floor(
          (Date.now() - new Date(viewedProfile.host_approved_at).getTime()) /
            (365 * 24 * 60 * 60 * 1000)
        )
      : 0;

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
                  <Image
                    source={{ uri: viewedProfile.avatar_url }}
                    style={styles.hostAvatarImage}
                  />
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

                  {/* Social Icons */}
                  <View style={styles.socialIcons}>
                    <View style={styles.socialIcon}>
                      <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                    </View>
                  </View>
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>267</Text>
                  <Text style={styles.statLabel}>Reviews</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.statValue}>4.9</Text>
                    <Ionicons name="star" size={16} color="#FFB800" />
                  </View>
                  <Text style={styles.statLabel}>Ratings</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{yearsOfHosting}</Text>
                  <Text style={styles.statLabel}>Years of hosting</Text>
                </View>
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

          {/* Privacy Policy Section */}
          <View style={styles.policySection}>
            <Text style={styles.policyTitle}>Privacy Policy:</Text>
            <View style={styles.policyContent}>
              <Text style={styles.policyText}>
                • Your personal information is kept confidential{'\n'}• Data used only for booking
                and communication{'\n'}• We do not share your data with third parties{'\n'}• Contact
                details shared only with trip participants
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render own profile view
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card with Avatar and Name */}
        <Card style={styles.profileCard}>
          <View style={styles.profileContent}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{fullName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{fullName}</Text>
              <Text style={styles.userEmail}>{email}</Text>
              {getHostStatusBadge() && !isAdmin && (
                <View style={[styles.badge, { backgroundColor: getHostStatusBadge()!.bgColor }]}>
                  <Text style={[styles.badgeText, { color: getHostStatusBadge()!.color }]}>
                    {getHostStatusBadge()!.label}
                  </Text>
                </View>
              )}
              {isAdmin && (
                <View style={[styles.badge, { backgroundColor: Colors.errorLight }]}>
                  <Text style={[styles.badgeText, { color: Colors.error }]}>Admin</Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Sign-in Provider</Text>
          <Text style={styles.value}>
            {provider === 'google'
              ? 'Google'
              : provider.charAt(0).toUpperCase() + provider.slice(1)}
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>User ID</Text>
          <Text style={styles.valueSmall}>{user?.id || 'N/A'}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Account Created</Text>
          <Text style={styles.value}>
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'N/A'}
          </Text>
        </Card>

        {/* Host Application Section */}
        {!isHost && !isAdmin && !loadingHostRequest && (
          <Card style={styles.hostCard}>
            <Text style={styles.hostCardTitle}>Become a Host</Text>
            <Text style={styles.hostCardDescription}>
              Create and manage events, trips, or activities on ArzKaro
            </Text>

            {hostRequest && (
              <View style={styles.hostRequestStatus}>
                <View style={styles.hostRequestHeader}>
                  <Text style={styles.hostRequestLabel}>Application Status</Text>
                  {getHostRequestStatusBadge() && (
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getHostRequestStatusBadge()!.bgColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: getHostRequestStatusBadge()!.color },
                        ]}
                      >
                        {getHostRequestStatusBadge()!.label}
                      </Text>
                    </View>
                  )}
                </View>

                {hostRequest.status === 'pending' && (
                  <Text style={styles.hostRequestInfo}>
                    Your application is being reviewed. You&apos;ll be notified within 2-3 business
                    days.
                  </Text>
                )}

                {hostRequest.status === 'rejected' && (
                  <>
                    <Text style={styles.hostRequestInfo}>Your application was not approved.</Text>
                    {hostRequest.rejection_reason && (
                      <Text style={styles.rejectionReason}>
                        Reason: {hostRequest.rejection_reason}
                      </Text>
                    )}
                    <Button
                      title="Apply Again"
                      onPress={() => setShowHostApplicationModal(true)}
                      variant="primary"
                      size="medium"
                      fullWidth
                      style={styles.applyButton}
                    />
                  </>
                )}
              </View>
            )}

            {!hasPending && (
              <Button
                title={hostRequest?.status === 'rejected' ? 'Apply Again' : 'Apply Now'}
                onPress={() => setShowHostApplicationModal(true)}
                variant="primary"
                size="medium"
                fullWidth
                style={styles.applyButton}
              />
            )}
          </Card>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title={isLoggingOut ? 'Signing Out...' : 'Sign Out'}
            onPress={handleLogout}
            variant="secondary"
            size="large"
            disabled={isLoggingOut}
          />
          {isLoggingOut && (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
          )}
          <Button
            title="Back to Home"
            onPress={() => router.back()}
            variant="primary"
            size="large"
          />
        </View>
      </ScrollView>

      {/* Host Application Modal */}
      <Modal
        visible={showHostApplicationModal}
        onClose={() => setShowHostApplicationModal(false)}
        size="fullscreen"
        showCloseButton={false}
      >
        <HostApplicationForm
          userId={user?.id || ''}
          onSuccess={handleHostApplicationSuccess}
          onCancel={() => setShowHostApplicationModal(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  profileCard: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  profileContent: {
    alignItems: 'center',
    width: '100%',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: Spacing.md,
    width: '100%',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  avatarText: {
    fontSize: 48,
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  userName: {
    ...Typography.h2,
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  card: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    ...Typography.body,
    color: Colors.text,
  },
  valueSmall: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  loader: {
    marginVertical: Spacing.sm,
  },
  badge: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    ...Typography.caption,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hostCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  hostCardTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
  },
  hostCardDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  hostRequestStatus: {
    marginBottom: Spacing.md,
  },
  hostRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  hostRequestLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Fonts.semiBold,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontFamily: Fonts.semiBold,
  },
  hostRequestInfo: {
    ...Typography.bodySmall,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  rejectionReason: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  applyButton: {
    marginTop: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.h3,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Profile View Header (for viewing host profiles)
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
  // Host Profile Styles
  hostProfileSection: {
    marginBottom: Spacing.xl,
  },
  hostProfileTitle: {
    fontSize: 20,
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.md,
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
  socialIcons: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 4,
  },
  socialIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Policy Sections
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
  backButtonText: {
    ...Typography.body,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  eventsContainer: {
    gap: Spacing.md,
  },
  eventItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventTitle: {
    ...Typography.body,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  eventTypeBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
  },
  eventTypeText: {
    ...Typography.caption,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
    fontSize: 10,
  },
  eventPrice: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontFamily: Fonts.bold,
  },
});
