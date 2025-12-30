import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import { Fonts } from '../../src/constants/Fonts';
import { useAuth } from '../../src/contexts/auth-context';
import { useBookings, useTickets } from '../../src/hooks/use-bookings';
import { getFriendCounts } from '../../src/services/friends-service';
import EmptyState from '../../src/components/ui/empty-state';

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
  const {
    user,
    profile,
    isHost,
    isAdmin,
    role,
    effectiveRole,
    viewAsUser,
    toggleViewMode,
    refreshProfile,
    signOut,
    isAuthenticated,
    disableGuestMode,
  } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loadStats, setLoadStats] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // For UI display, use effectiveRole
  const showAsAdmin = effectiveRole === 'admin';
  const showAsHost = effectiveRole === 'host' || effectiveRole === 'admin';

  // Lazy load stats only when needed - NOT on initial render
  const { bookings } = useBookings(loadStats ? user?.id : undefined);
  const { tickets } = useTickets(loadStats ? user?.id : undefined);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Trigger stats loading after component mounts
  React.useEffect(() => {
    // Delay stats loading by 500ms to let the UI render first
    const timer = setTimeout(() => {
      setLoadStats(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Load friend counts
  React.useEffect(() => {
    async function loadFriendCounts() {
      if (user?.id) {
        try {
          const counts = await getFriendCounts(user.id);
          setFriendsCount(counts.friendsCount);
          setPendingRequestsCount(counts.pendingRequestsCount);
        } catch (error) {
          console.error('Error loading friend counts:', error);
        }
      }
    }
    if (loadStats) {
      loadFriendCounts();
    }
  }, [user?.id, loadStats]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const oldRole = role;
      await refreshProfile();

      // Reload friend counts
      if (user?.id) {
        const counts = await getFriendCounts(user.id);
        setFriendsCount(counts.friendsCount);
        setPendingRequestsCount(counts.pendingRequestsCount);
      }

      // Show alert if role changed
      if (role !== oldRole) {
        Alert.alert('🎉 Role Updated!', `Your role has been changed to: ${role.toUpperCase()}`, [
          { text: 'OK' },
        ]);
      }

      console.log(
        '✅ Profile refreshed! Current role:',
        role,
        'isAdmin:',
        isAdmin,
        'isHost:',
        isHost
      );
    } catch (error) {
      console.error('Error refreshing profile:', error);
      Alert.alert('Error', 'Failed to refresh profile. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile, role, isAdmin, isHost, user?.id]);

  // Calculate stats
  const uniqueEvents = new Set(bookings.map((b) => b.event_id)).size;
  const ticketCount = tickets.length;

  const handleBecomeHost = () => {
    if (showAsHost) {
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
        },
      },
    ]);
  };

  const menuItems: MenuItemType[] = [
    {
      icon: 'people-outline',
      label: 'Friends',
      route: '/friends',
      badge: pendingRequestsCount > 0 ? String(pendingRequestsCount) : undefined,
      showArrow: true,
    },
  ];

  // Add admin panel if user is admin
  if (showAsAdmin) {
    menuItems.splice(1, 0, {
      icon: 'shield-outline',
      label: 'Admin Panel',
      route: '/admin/dashboard',
      badge: 'Admin',
      showArrow: true,
    });
  }

  // Add host dashboard if user is host or admin
  if (showAsHost) {
    const insertIndex = showAsAdmin ? 2 : 1;
    menuItems.splice(insertIndex, 0, {
      icon: 'bar-chart-outline',
      label: 'Host Dashboard',
      route: '/host/dashboard',
      badge: 'Host',
      showArrow: true,
    });
  }

  // Add "Switch to User" / "Switch to Host" for HOSTS ONLY (not admins)
  if (isHost && !isAdmin) {
    menuItems.push({
      icon: 'swap-horizontal-outline',
      label: viewAsUser ? 'Switch to Host' : 'Switch to User',
      action: toggleViewMode,
      showArrow: true,
    });
  }

  // Add "Become a Host" for regular users (not hosts, not admins)
  if (!isHost && !isAdmin) {
    menuItems.push({
      icon: 'rocket-outline',
      label: 'Become a Host',
      action: handleBecomeHost,
      showArrow: true,
    });
  }

  const renderMenuItem = (item: MenuItemType, index: number) => (
    <Pressable
      key={index}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={() =>
        item.route
          ? router.push(
              item.route as
                | `/profile`
                | `/edit-profile`
                | `/(tabs)/tickets`
                | `/saved`
                | `/notifications`
                | `/settings`
                | `/friends`
                | `/admin/dashboard`
                | `/host/dashboard`
            )
          : item.action?.()
      }
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

  // Not authenticated - Show guest mode screen
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          title="Sign In to View Profile"
          message="Create an account or sign in to access your profile, manage bookings, and connect with friends."
          icon="person-outline"
          action={{
            label: 'Sign In',
            onPress: () => {
              disableGuestMode();
              router.replace('/');
            },
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileCardContainer}>
          <View style={styles.profileCard}>
            <Pressable onPress={() => router.push('/edit-profile')}>
              <View style={styles.avatarContainer}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{avatarLetter}</Text>
                  </View>
                )}

                {/* Edit Badge */}
                <View style={styles.editBadge}>
                  <Ionicons name="pencil" size={16} color={Colors.textInverse} />
                </View>
              </View>
            </Pressable>

            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.email}>{user?.email}</Text>

              {/* Role Badges */}
              <View style={styles.badgesContainer}>
                {showAsAdmin ? (
                  <View style={[styles.roleBadge, styles.adminBadge]}>
                    <Text style={styles.roleBadgeText}>Admin</Text>
                  </View>
                ) : showAsHost ? (
                  <View style={[styles.roleBadge, styles.hostBadge]}>
                    <Ionicons name="star" size={14} color={Colors.textInverse} />
                    <Text style={styles.roleBadgeText}>Host</Text>
                  </View>
                ) : null}
              </View>

              {/* Stats Row */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{uniqueEvents}</Text>
                  <Text style={styles.statLabel}>Events</Text>
                </View>
                <View style={styles.statDivider} />
                <Pressable style={styles.statItem} onPress={() => router.push('/(tabs)/tickets')}>
                  <Text style={styles.statValue}>{ticketCount}</Text>
                  <Text style={styles.statLabel}>Tickets</Text>
                </Pressable>
                <View style={styles.statDivider} />
                <Pressable style={styles.statItem} onPress={() => router.push('/friends')}>
                  <Text style={styles.statValue}>{friendsCount}</Text>
                  <Text style={styles.statLabel}>Friends</Text>
                  {pendingRequestsCount > 0 && (
                    <View style={styles.statBadge}>
                      <Text style={styles.statBadgeText}>{pendingRequestsCount}</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
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
  profileCardContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
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
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  debugRole: {
    fontSize: 11,
    color: Colors.warning,
    fontFamily: 'monospace',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
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
    fontFamily: Fonts.semiBold,
    color: Colors.textInverse,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.lg,
    width: '100%',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  statValue: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statBadge: {
    position: 'absolute',
    top: -4,
    right: 8,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadgeText: {
    fontSize: 11,
    color: Colors.background,
    fontFamily: Fonts.semiBold,
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
    fontFamily: Fonts.medium,
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
    fontFamily: Fonts.semiBold,
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
    fontFamily: Fonts.semiBold,
    color: Colors.error,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
