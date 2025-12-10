import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/ui/button';
import Card from '../src/components/ui/card';
import Modal from '../src/components/ui/modal';
import HostApplicationForm from '../src/components/host/host-application-form';
import { Colors } from '../src/constants/Colors';
import { BorderRadius, Spacing, Typography } from '../src/constants/styles';
import { useAuth } from '../src/contexts/auth-context';
import {
  getLatestHostRequest,
  hasPendingHostRequest,
  HOST_TYPE_LABELS,
} from '../src/services/host-service';
import type { HostRequest } from '../src/types/host.types';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, isHost, isAdmin, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showHostApplicationModal, setShowHostApplicationModal] = useState(false);
  const [hostRequest, setHostRequest] = useState<HostRequest | null>(null);
  const [loadingHostRequest, setLoadingHostRequest] = useState(true);
  const [hasPending, setHasPending] = useState(false);

  // Get user metadata from Google OAuth
  const userMetadata = user?.user_metadata;
  const fullName = userMetadata?.full_name || userMetadata?.name || 'Anonymous User';
  const email = user?.email || 'No email provided';
  const avatarUrl = userMetadata?.avatar_url || userMetadata?.picture;
  const provider = user?.app_metadata?.provider || 'email';

  // Load host request status
  useEffect(() => {
    async function loadHostRequestStatus() {
      if (!user?.id) return;

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
  }, [user?.id]);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{fullName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.userName}>{fullName}</Text>
          {getHostStatusBadge() && (
            <View style={[styles.badge, { backgroundColor: getHostStatusBadge()!.bgColor }]}>
              <Text style={[styles.badgeText, { color: getHostStatusBadge()!.color }]}>
                {getHostStatusBadge()!.label}
              </Text>
            </View>
          )}
        </View>

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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 60,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  userName: {
    ...Typography.h2,
    color: Colors.text,
    fontWeight: 'bold',
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
    fontWeight: '600',
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
    fontWeight: 'bold',
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
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
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
});
