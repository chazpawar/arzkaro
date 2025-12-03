import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/Button';
import Card from '../src/components/Card';
import { Colors } from '../src/constants/Colors';
import { Spacing, Typography } from '../src/constants/Styles';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
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
              trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
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
              trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
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
            onPress={() => console.log('Clear cache')}
            variant="secondary"
            size="large"
          />
          <Button
            title="Back to Home"
            onPress={() => router.back()}
            variant="outline"
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.light.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
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
    color: Colors.light.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    ...Typography.bodySmall,
    color: Colors.light.textSecondary,
  },
  settingValue: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  buttonContainer: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
});
