import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, StatusBar } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../src/constants/Styles';
import { Fonts } from '../src/constants/Fonts';
import { useAuth } from '../src/contexts/auth-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { isAdmin, viewAsUser, toggleViewMode } = useAuth();
  const [notifications, setNotifications] = useState(true);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
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
            {/* Admin View Mode Toggle */}
            {isAdmin && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>Admin Tools</Text>
                <View style={styles.menuList}>
                  <Pressable style={styles.menuItem} onPress={toggleViewMode}>
                    <View
                      style={[
                        styles.menuIcon,
                        {
                          backgroundColor: viewAsUser ? Colors.warning + '10' : Colors.info + '10',
                        },
                      ]}
                    >
                      <Ionicons
                        name={viewAsUser ? 'eye-outline' : 'shield-checkmark-outline'}
                        size={20}
                        color={viewAsUser ? Colors.warning : Colors.info}
                      />
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuTitle}>
                        {viewAsUser ? 'Viewing as User' : 'Admin Mode Active'}
                      </Text>
                      <Text style={styles.menuSubtitle}>
                        {viewAsUser
                          ? 'Tap to switch to admin view'
                          : 'Tap to preview user experience'}
                      </Text>
                    </View>
                    <Ionicons
                      name={viewAsUser ? 'toggle-outline' : 'toggle'}
                      size={24}
                      color={viewAsUser ? Colors.warning : Colors.info}
                    />
                  </Pressable>
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
    </>
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
