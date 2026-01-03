import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../src/components/ui/button';
import BackButton from '../../src/components/ui/back-button';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/Styles';
import { Fonts } from '../../src/constants/Fonts';
import { supabase } from '../../backend/supabase';

export default function AdminNotificationsScreen() {
  const _router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [eventId, setEventId] = useState('');
  const [platform, setPlatform] = useState<'all' | 'ios' | 'android'>('all');
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<{ sent: number; failed: number } | null>(null);

  const handleSend = async () => {
    // Validation
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    Alert.alert(
      'Confirm Send',
      `You are about to send a notification to all ${platform === 'all' ? 'users' : platform.toUpperCase() + ' users'}.\n\nTitle: ${title}\n\nAre you sure?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send',
          style: 'destructive',
          onPress: async () => {
            try {
              setSending(true);
              setStats(null);

              // Get auth session
              const {
                data: { session },
              } = await supabase.auth.getSession();

              if (!session) {
                throw new Error('Not authenticated');
              }

              // Prepare payload
              const payload: any = {
                title,
                body,
              };

              if (eventId.trim()) {
                payload.eventId = eventId.trim();
              }

              if (platform !== 'all') {
                payload.filters = {
                  platforms: [platform],
                };
              }

              // Call Edge Function
              const { data, error } = await supabase.functions.invoke(
                'send-promotional-notification',
                {
                  body: payload,
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                  },
                }
              );

              if (error) {
                throw error;
              }

              console.log('[AdminNotifications] Notification sent:', data);

              setStats({
                sent: data.sent || 0,
                failed: data.failed || 0,
              });

              Alert.alert(
                'Success',
                `Notification sent to ${data.sent} users${data.failed > 0 ? `. ${data.failed} failed` : ''}.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Clear form
                      setTitle('');
                      setBody('');
                      setEventId('');
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('[AdminNotifications] Error sending notification:', error);
              Alert.alert('Error', error.message || 'Failed to send notification');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton variant="minimal" />
          <Text style={styles.title}>Send Notification</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Send promotional notifications to all active users. These will appear as push
              notifications on their devices.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Notification Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., New Events This Weekend!"
                placeholderTextColor={Colors.textTertiary}
                editable={!sending}
                maxLength={50}
              />
              <Text style={styles.hint}>{title.length}/50 characters</Text>
            </View>

            {/* Body */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Message <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={body}
                onChangeText={setBody}
                placeholder="e.g., Check out our latest cricket matches and dance events near you!"
                placeholderTextColor={Colors.textTertiary}
                editable={!sending}
                multiline
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.hint}>{body.length}/200 characters</Text>
            </View>

            {/* Event ID (Optional) - Commented out for now */}
            {/* <View style={styles.field}>
              <Text style={styles.label}>Event ID (Optional)</Text>
              <TextInput
                style={styles.input}
                value={eventId}
                onChangeText={setEventId}
                placeholder="Paste event ID to link to specific event"
                placeholderTextColor={Colors.textTertiary}
                editable={!sending}
                autoCapitalize="none"
              />
              <Text style={styles.hint}>
                Users will be taken to this event when they tap the notification
              </Text>
            </View> */}

            {/* Platform Selection */}
            <View style={styles.field}>
              <Text style={styles.label}>Target Platform</Text>
              <View style={styles.platformButtons}>
                <Pressable
                  style={[styles.platformButton, platform === 'all' && styles.platformButtonActive]}
                  onPress={() => setPlatform('all')}
                  disabled={sending}
                >
                  <Ionicons
                    name="phone-portrait"
                    size={20}
                    color={platform === 'all' ? Colors.textInverse : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.platformButtonText,
                      platform === 'all' && styles.platformButtonTextActive,
                    ]}
                  >
                    All Platforms
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.platformButton, platform === 'ios' && styles.platformButtonActive]}
                  onPress={() => setPlatform('ios')}
                  disabled={sending}
                >
                  <Ionicons
                    name="logo-apple"
                    size={20}
                    color={platform === 'ios' ? Colors.textInverse : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.platformButtonText,
                      platform === 'ios' && styles.platformButtonTextActive,
                    ]}
                  >
                    iOS Only
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.platformButton,
                    platform === 'android' && styles.platformButtonActive,
                  ]}
                  onPress={() => setPlatform('android')}
                  disabled={sending}
                >
                  <Ionicons
                    name="logo-android"
                    size={20}
                    color={platform === 'android' ? Colors.textInverse : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.platformButtonText,
                      platform === 'android' && styles.platformButtonTextActive,
                    ]}
                  >
                    Android Only
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Stats Display */}
            {stats && (
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  <Text style={styles.statNumber}>{stats.sent}</Text>
                  <Text style={styles.statLabel}>Sent Successfully</Text>
                </View>
                {stats.failed > 0 && (
                  <View style={styles.statCard}>
                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                    <Text style={styles.statNumber}>{stats.failed}</Text>
                    <Text style={styles.statLabel}>Failed</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Send Button */}
        <View style={styles.footer}>
          <Button
            title={sending ? 'Sending...' : 'Send Notification'}
            onPress={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            fullWidth
            leftIcon={
              sending ? (
                <ActivityIndicator size="small" color={Colors.textInverse} />
              ) : (
                <Ionicons name="send" size={20} color={Colors.textInverse} />
              )
            }
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    ...Typography.bodySmall,
    color: Colors.primary,
  },
  form: {
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  required: {
    color: Colors.error,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
    maxHeight: 150,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  platformButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  platformButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  platformButtonText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
  },
  platformButtonTextActive: {
    color: Colors.textInverse,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
});
