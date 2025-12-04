import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/ui/button';
import Card from '../src/components/ui/card';
import { Colors } from '../src/constants/colors';
import { Spacing, Typography, BorderRadius } from '../src/constants/styles';
import { useAuth } from '../src/contexts/auth-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { isHost, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Admin & Host Access */}
        {(isAdmin || isHost) && (
          <>
            <Text style={styles.sectionTitle}>Management</Text>

            {isAdmin && (
              <Pressable
                style={styles.managementCard}
                onPress={() => router.push('/admin/dashboard')}
              >
                <View style={[styles.managementIcon, { backgroundColor: Colors.error + '20' }]}>
                  <Text style={styles.managementIconText}>🛡️</Text>
                </View>
                <View style={styles.managementInfo}>
                  <Text style={styles.managementTitle}>Admin Dashboard</Text>
                  <Text style={styles.managementDescription}>
                    Manage users, host requests, and platform settings
                  </Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </Pressable>
            )}

            {isHost && (
              <Pressable
                style={styles.managementCard}
                onPress={() => router.push('/host/dashboard')}
              >
                <View style={[styles.managementIcon, { backgroundColor: Colors.primary + '20' }]}>
                  <Text style={styles.managementIconText}>🎭</Text>
                </View>
                <View style={styles.managementInfo}>
                  <Text style={styles.managementTitle}>Host Dashboard</Text>
                  <Text style={styles.managementDescription}>
                    Manage your events, bookings, and scan tickets
                  </Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </Pressable>
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>Preferences</Text>

        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Receive notifications about updates</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Use dark theme (coming soon)</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Update</Text>
              <Text style={styles.settingDescription}>Automatically update the app</Text>
            </View>
            <Switch
              value={autoUpdate}
              onValueChange={setAutoUpdate}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>About</Text>

        <Card style={styles.card}>
          <Text style={styles.settingLabel}>Version</Text>
          <Text style={styles.settingValue}>1.0.0</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.settingLabel}>Build</Text>
          <Text style={styles.settingValue}>Development</Text>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title="Clear Cache"
            onPress={() => {
              // Placeholder - cache clearing logic would go here
            }}
            variant="secondary"
            size="large"
          />
          <Button title="Back to Home" onPress={() => router.back()} variant="ghost" size="large" />
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
  scrollContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  managementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  managementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  managementIconText: {
    fontSize: 22,
  },
  managementInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  managementTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: 2,
  },
  managementDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  arrow: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  card: {
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  settingValue: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  buttonContainer: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
});
