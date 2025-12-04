import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/button';
import Card from '../../src/components/ui/card';
import Input from '../../src/components/ui/input';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { Colors } from '../../src/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/styles';
import { useAuth } from '../../src/contexts/auth-context';
import * as HostService from '../../src/services/host-service';

const BUSINESS_TYPES = [
  'Individual / Freelancer',
  'Small Business',
  'Event Management Company',
  'Non-Profit Organization',
  'Educational Institution',
  'Corporate',
  'Other',
];

export default function HostRequestScreen() {
  const router = useRouter();
  const { user, isHost, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<HostService.HostRequest | null>(null);

  // Form state
  const [reason, setReason] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchExistingRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchExistingRequest = async () => {
    if (!user?.id) return;

    try {
      const request = await HostService.getHostRequestStatus(user.id);
      setExistingRequest(request);
    } catch (err) {
      console.error('Error fetching host request:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!reason.trim()) {
      newErrors.reason = 'Please tell us why you want to become a host';
    } else if (reason.trim().length < 50) {
      newErrors.reason = 'Please provide more details (at least 50 characters)';
    }
    if (!businessType) {
      newErrors.businessType = 'Please select a business type';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!user?.id || !validateForm()) return;

    setSubmitting(true);
    try {
      await HostService.submitHostRequest(
        {
          reason: reason.trim(),
          business_name: businessName.trim() || undefined,
          business_type: businessType,
        },
        user.id
      );

      Alert.alert(
        'Application Submitted!',
        "Your host application has been submitted for review. We'll notify you once it has been reviewed.",
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
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

  // Show pending request status
  if (existingRequest?.status === 'pending') {
    return (
      <>
        <Stack.Screen options={{ title: 'Application Status' }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>⏳</Text>
            <Text style={styles.statusTitle}>Application Pending</Text>
            <Text style={styles.statusText}>
              Your host application is currently under review. We&apos;ll notify you once a decision
              has been made.
            </Text>
            <Card style={styles.requestCard} variant="outlined">
              <Text style={styles.requestLabel}>Submitted</Text>
              <Text style={styles.requestValue}>
                {new Date(existingRequest.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Text style={styles.requestLabel}>Business Type</Text>
              <Text style={styles.requestValue}>
                {existingRequest.business_type || 'Not specified'}
              </Text>
            </Card>
            <Button
              title="Go Back"
              onPress={() => router.back()}
              variant="outline"
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Show rejected status with option to reapply
  if (existingRequest?.status === 'rejected') {
    return (
      <>
        <Stack.Screen options={{ title: 'Application Status' }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>😔</Text>
            <Text style={styles.statusTitle}>Application Not Approved</Text>
            <Text style={styles.statusText}>
              Unfortunately, your previous application was not approved.
              {existingRequest.admin_notes && ` Reason: ${existingRequest.admin_notes}`}
            </Text>
            <Button
              title="Submit New Application"
              onPress={() => setExistingRequest(null)}
              variant="primary"
              size="large"
            />
            <Button
              title="Go Back"
              onPress={() => router.back()}
              variant="ghost"
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Show application form
  return (
    <>
      <Stack.Screen options={{ title: 'Become a Host' }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerIcon}>🎭</Text>
              <Text style={styles.headerTitle}>Become a Host</Text>
              <Text style={styles.headerDescription}>
                Join our community of event hosts and start creating memorable experiences for your
                audience.
              </Text>
            </View>

            {/* Benefits */}
            <Card style={styles.benefitsCard} variant="outlined">
              <Text style={styles.benefitsTitle}>Host Benefits</Text>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✨</Text>
                <Text style={styles.benefitText}>Create unlimited events, experiences & trips</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>💰</Text>
                <Text style={styles.benefitText}>Sell tickets and manage bookings</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>👥</Text>
                <Text style={styles.benefitText}>Build your community with event groups</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>📊</Text>
                <Text style={styles.benefitText}>Access analytics and insights</Text>
              </View>
            </Card>

            {/* Application Form */}
            <Text style={styles.formTitle}>Application Form</Text>

            <Input
              label="Why do you want to become a host?"
              placeholder="Tell us about yourself and what kind of events you plan to create..."
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              error={errors.reason}
            />
            <Text style={styles.characterCount}>{reason.length}/50 minimum characters</Text>

            <Input
              label="Business/Organization Name (Optional)"
              placeholder="Your company or personal brand name"
              value={businessName}
              onChangeText={setBusinessName}
            />

            <Text style={styles.inputLabel}>Business Type</Text>
            <View style={styles.businessTypeGrid}>
              {BUSINESS_TYPES.map((type) => (
                <Card
                  key={type}
                  style={[
                    styles.businessTypeCard,
                    businessType === type && styles.businessTypeCardSelected,
                  ]}
                  onPress={() => setBusinessType(type)}
                >
                  <Text
                    style={[
                      styles.businessTypeText,
                      businessType === type && styles.businessTypeTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </Card>
              ))}
            </View>
            {errors.businessType && <Text style={styles.errorText}>{errors.businessType}</Text>}

            {/* Terms */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By submitting this application, you agree to follow our community guidelines and
                host responsibilities. We&apos;ll review your application and get back to you within
                2-3 business days.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title={submitting ? 'Submitting...' : 'Submit Application'}
              onPress={handleSubmit}
              variant="primary"
              size="large"
              loading={submitting}
              disabled={submitting}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  headerDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  benefitsCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  benefitsTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  benefitIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  benefitText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  formTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  characterCount: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  businessTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  businessTypeCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  businessTypeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  businessTypeText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  businessTypeTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  termsContainer: {
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  termsText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
  requestCard: {
    width: '100%',
    padding: Spacing.lg,
  },
  requestLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  requestValue: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
});
