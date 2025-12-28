import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../src/components/ui/button';
import HostApplicationForm from '../../src/components/host/host-application-form';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/Styles';
import { Fonts } from '../../src/constants/Fonts';
import { useAuth } from '../../src/contexts/auth-context';
import * as HostService from '../../src/services/host-service';
import type { HostRequest } from '../../src/types/host.types';

export default function HostRequestScreen() {
  const router = useRouter();
  const { user, isHost, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [existingRequest, setExistingRequest] = useState<HostRequest | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'experience' | 'event' | 'trip' | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);

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

  const handleCancelForm = () => {
    // If we are in the form, just go back to the selection screen
    setShowForm(false);
  };

  const handleNext = () => {
    if (selectedCategory) {
      setShowForm(true);
    }
  };

  const getHostTypeFromCategory = () => {
    if (selectedCategory === 'experience') return 'activity';
    return 'full';
  };

  // Back handler for the selection screen
  const handleBack = () => {
    if (showForm) {
      setShowForm(false);
    } else {
      router.back();
    }
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

  if (showForm) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Become a Host',
            headerShown: true,
            headerLeft: () => (
              <TouchableOpacity onPress={handleCancelForm} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <HostApplicationForm
            userId={user?.id || ''}
            initialHostType={getHostTypeFromCategory()}
            onSuccess={handleApplicationSuccess}
            onCancel={handleCancelForm}
          />
        </SafeAreaView>
      </>
    );
  }

  // Question screen
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.questionTitle}>What would you like to host?</Text>

          <View style={styles.choiceGrid}>
            <TouchableOpacity
              style={[
                styles.choiceCard,
                selectedCategory === 'experience' && styles.selectedChoiceCard,
              ]}
              onPress={() => setSelectedCategory('experience')}
            >
              <View style={styles.choiceIconContainer}>
                <Text style={styles.emojiIcon}>🎈</Text>
              </View>
              <View style={styles.choiceTextContainer}>
                <Text style={styles.choiceLabel}>Experience</Text>
                <Text style={styles.choiceDescription}>Host workshops, activities or sessions</Text>
              </View>
            </TouchableOpacity>

            {/* Commented out - Events disabled */}
            {/* <TouchableOpacity
              style={[styles.choiceCard, selectedCategory === 'event' && styles.selectedChoiceCard]}
              onPress={() => setSelectedCategory('event')}
            >
              <View style={styles.choiceIconContainer}>
                <Text style={styles.emojiIcon}>🎟️</Text>
              </View>
              <View style={styles.choiceTextContainer}>
                <Text style={styles.choiceLabel}>Events</Text>
                <Text style={styles.choiceDescription}>
                  Host meetups, parties or large gatherings
                </Text>
              </View>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={[styles.choiceCard, selectedCategory === 'trip' && styles.selectedChoiceCard]}
              onPress={() => setSelectedCategory('trip')}
            >
              <View style={styles.choiceIconContainer}>
                <Text style={styles.emojiIcon}>🎒</Text>
              </View>
              <View style={styles.choiceTextContainer}>
                <Text style={styles.choiceLabel}>Trips</Text>
                <Text style={styles.choiceDescription}>
                  Host multi-day journeys and explorations
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Next"
            onPress={handleNext}
            variant="primary"
            size="large"
            disabled={!selectedCategory}
            fullWidth
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    alignItems: 'center',
  },
  questionTitle: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    fontFamily: Fonts.semiBold,
  },
  choiceGrid: {
    gap: Spacing.md,
    width: '100%',
    paddingTop: Spacing.xl,
  },
  choiceCard: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    padding: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  selectedChoiceCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primarySoft,
  },
  choiceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  emojiIcon: {
    fontSize: 32,
  },
  choiceTextContainer: {
    flex: 1,
  },
  choiceLabel: {
    ...Typography.h4,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  choiceDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: Colors.border,
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
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.xs,
  },
  rejectionReason: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 22,
  },
});
