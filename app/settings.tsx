import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/Colors';
import { Fonts } from '../src/constants/Fonts';
import { Spacing, Typography, BorderRadius } from '../src/constants/Styles';
import { useAuth } from '../src/contexts/auth-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { isAdmin, isHost } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Custom Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>App configuration</Text>
          </View>
          <View style={styles.headerActionPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Admin & Host Access */}
          {(isAdmin || isHost) && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Management</Text>

              <View style={styles.menuList}>
                {isAdmin && (
                  <Pressable
                    style={styles.menuItem}
                    onPress={() => router.push('/admin/dashboard')}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: Colors.error + '10' }]}>
                      <Ionicons name="shield-checkmark-outline" size={20} color={Colors.error} />
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuTitle}>Admin Dashboard</Text>
                      <Text style={styles.menuSubtitle}>Platform controls</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.borderDark} />
                  </Pressable>
                )}

                {isHost && (
                  <Pressable
                    style={[styles.menuItem, isAdmin && styles.menuItemBorder]}
                    onPress={() => router.push('/host/dashboard')}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '10' }]}>
                      <Ionicons name="briefcase-outline" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuTitle}>Host Dashboard</Text>
                      <Text style={styles.menuSubtitle}>Manage events</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.borderDark} />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Preferences */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Preferences</Text>

            <View style={styles.menuList}>
              <View style={styles.menuItem}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceSecondary }]}>
                  <Ionicons name="notifications-outline" size={20} color={Colors.text} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Push Notifications</Text>
                  <Text style={styles.menuSubtitle}>Stay updated</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={[styles.menuItem, styles.menuItemBorder]}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceSecondary }]}>
                  <Ionicons name="moon-outline" size={20} color={Colors.text} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Dark Mode</Text>
                  <Text style={styles.menuSubtitle}>Coming soon</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#ffffff"
                  disabled
                />
              </View>

              <View style={[styles.menuItem, styles.menuItemBorder]}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceSecondary }]}>
                  <Ionicons name="cloud-download-outline" size={20} color={Colors.text} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Auto Update</Text>
                  <Text style={styles.menuSubtitle}>Keep app fresh</Text>
                </View>
                <Switch
                  value={autoUpdate}
                  onValueChange={setAutoUpdate}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          </View>

          {/* About */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>About</Text>
            <View style={styles.menuList}>
              <View style={styles.menuItem}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceSecondary }]}>
                  <Ionicons name="information-circle-outline" size={20} color={Colors.text} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Version</Text>
                  <Text style={styles.menuSubtitle}>1.0.0 (Development)</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.bodyLarge,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  headerActionPlaceholder: {
    width: 32,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    ...Typography.bodySmall,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: Spacing.xs,
  },
  menuList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.bodyMedium,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  menuSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
