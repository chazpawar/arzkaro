import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Spacing, BorderRadius } from '../../src/constants/styles';
import { useAuth } from '../../src/contexts/auth-context';
import { useBookings, useTickets } from '../../src/hooks/use-bookings';

interface MenuItemType {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
  action?: () => void;
  badge?: string;
  showArrow?: boolean;
}

export default function ProfileTab() {
  const router = useRouter();
  const { user, profile, isHost, isAdmin, signOut } = useAuth();
  
  // Fetch user stats
  const { bookings } = useBookings(user?.id);
  const { tickets } = useTickets(user?.id);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  
  // Calculate stats
  const uniqueEvents = new Set(bookings.map((b) => b.event_id)).size;
  const ticketCount = tickets.length;

  const handleBecomeHost = () => {
    if (isHost) {
      router.push('/host/dashboard');
    } else {
      router.push('/host/request');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive', 
        onPress: async () => {
          await signOut();
          router.replace('/');
        }
      },
    ]);
  };

  const menuItems: MenuItemType[] = [
    { icon: 'person-outline', label: 'Edit Profile', route: '/profile', showArrow: true },
    { icon: 'ticket-outline', label: 'My Tickets', route: '/(tabs)/tickets', showArrow: true },
    { icon: 'heart-outline', label: 'Saved Events', route: '/saved', showArrow: true },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      route: '/notifications',
      showArrow: true,
    },
    { icon: 'settings-outline', label: 'Settings', route: '/settings', showArrow: true },
    { icon: 'help-circle-outline', label: 'Help & Support', route: '/support', showArrow: true },
  ];

  // Add admin panel if user is admin
  if (isAdmin) {
    menuItems.splice(2, 0, {
      icon: 'shield-outline',
      label: 'Admin Panel',
      route: '/admin/dashboard',
      badge: 'Admin',
      showArrow: true,
    });
  }

  // Add host dashboard if user is host
  if (isHost) {
    menuItems.splice(2, 0, {
      icon: 'bar-chart-outline',
      label: 'Host Dashboard',
      route: '/host/dashboard',
      badge: 'Host',
      showArrow: true,
    });
  }

  const renderMenuItem = (item: MenuItemType, index: number) => (
    <Pressable
      key={index}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={() => (item.route ? router.push(item.route as any) : item.action?.())}
    >
      <View style={styles.menuIconContainer}>
        <Ionicons name={item.icon} size={22} color={Colors.textSecondary} />
      </View>
      <Text style={styles.menuLabel}>{item.label}</Text>
      {item.badge && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{item.badge}</Text>
        </View>
      )}
      {item.showArrow && <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Pressable style={styles.avatarContainer} onPress={() => router.push('/profile')}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color={Colors.textInverse} />
            </View>
          </Pressable>

          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {/* Role Badges */}
          <View style={styles.badgesContainer}>
            {isAdmin && (
              <View style={[styles.roleBadge, styles.adminBadge]}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.textInverse} />
                <Text style={styles.roleBadgeText}>Admin</Text>
              </View>
            )}
            {isHost && (
              <View style={[styles.roleBadge, styles.hostBadge]}>
                <Ionicons name="star" size={14} color={Colors.textInverse} />
                <Text style={styles.roleBadgeText}>Host</Text>
              </View>
            )}
          </View>
        </View>

        {/* Become a Host Section */}
        {!isHost && (
          <Pressable
            style={({ pressed }) => [
              styles.becomeHostCard,
              pressed && styles.becomeHostCardPressed,
            ]}
            onPress={handleBecomeHost}
          >
            <View style={styles.becomeHostContent}>
              <View style={styles.becomeHostIconContainer}>
                <Ionicons name="rocket-outline" size={28} color={Colors.primary} />
              </View>
              <View style={styles.becomeHostText}>
                <Text style={styles.becomeHostTitle}>Become a Host</Text>
                <Text style={styles.becomeHostDescription}>
                  Start hosting events and earn money
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
          </Pressable>
        )}

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{uniqueEvents}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ticketCount}</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>{menuItems.map(renderMenuItem)}</View>

        {/* Sign Out Button */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </Pressable>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: Colors.primary,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  adminBadge: {
    backgroundColor: Colors.error,
  },
  hostBadge: {
    backgroundColor: Colors.primary,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  becomeHostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  becomeHostCardPressed: {
    opacity: 0.8,
  },
  becomeHostContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  becomeHostIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  becomeHostText: {
    flex: 1,
  },
  becomeHostTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  becomeHostDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  menuContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemPressed: {
    backgroundColor: Colors.surfaceSecondary,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  menuBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  footer: {
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.error,
    width: '100%',
  },
  signOutButtonPressed: {
    backgroundColor: Colors.errorLight,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
