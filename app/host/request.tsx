import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/button';
import HostApplicationForm from '../../src/components/host/host-application-form';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography } from '../../src/constants/Styles';
import { useAuth } from '../../src/contexts/auth-context';
import * as HostService from '../../src/services/host-service';
import type { HostRequest } from '../../src/types/host.types';

export default function HostRequestScreen() {
  const router = useRouter();
  const { user, isHost, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [existingRequest, setExistingRequest] = useState<HostRequest | null>(null);

  useEffect(() => {
    fetchExistingRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchExistingRequest = async () => {
    if (!user?.id) return;

    try {
      const request = await HostService.getLatestHostRequest(user.id);
      setExistingRequest(request);
    } catch (err) {
      console.error('Error fetching host request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSuccess = () => {
    router.back();
  };

  // If already a host, show success state
  if (isHost || isAdmin) {
    return (
      <>
        <Stack.Screen options={{ title: 'Host Status' }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>🎉</Text>
            <Text style={styles.statusTitle}>You&apos;re a Host!</Text>
            <Text style={styles.statusText}>
              You have full access to host features. Start creating amazing events!
            </Text>
            <Button
              title="Go to Dashboard"
              onPress={() => router.replace('/host/dashboard')}
              variant="primary"
              size="large"
            />
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  // Show rejection status with reason and reapply option
  if (existingRequest?.status === 'rejected') {
    return (
      <>
        <Stack.Screen options={{ title: 'Host Application' }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>😞</Text>
            <Text style={styles.statusTitle}>Application Not Approved</Text>
            {existingRequest.rejection_reason && (
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionLabel}>Reason for rejection:</Text>
                <Text style={styles.rejectionReason}>{existingRequest.rejection_reason}</Text>
              </View>
            )}
            <Text style={styles.statusText}>
              Don&apos;t worry! You can address the feedback and submit a new application.
            </Text>
            <Button
              title="Submit New Application"
              onPress={() => setExistingRequest(null)}
              variant="primary"
              size="large"
            />
            <Button title="Go Back" onPress={() => router.back()} variant="ghost" size="large" />
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Show pending status (no reapply yet)
  if (existingRequest?.status === 'pending') {
    return (
      <>
        <Stack.Screen options={{ title: 'Host Application' }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>⏳</Text>
            <Text style={styles.statusTitle}>Application Under Review</Text>
            <Text style={styles.statusText}>
              Your host application is being reviewed by our team. We&apos;ll notify you once a
              decision is made. This typically takes 2-3 business days.
            </Text>
            <Button title="Go Back" onPress={() => router.back()} variant="primary" size="large" />
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Show new application form
  return (
    <>
      <Stack.Screen options={{ title: 'Become a Host' }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <HostApplicationForm
          userId={user?.id || ''}
          onSuccess={handleApplicationSuccess}
          onCancel={() => router.back()}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  statusIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  statusTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  statusText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  rejectionBox: {
    backgroundColor: Colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    borderRadius: 8,
    padding: Spacing.md,
    marginVertical: Spacing.lg,
    width: '100%',
  },
  rejectionLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  rejectionReason: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 22,
  },
});
