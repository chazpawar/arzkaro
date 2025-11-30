import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { useAuth } from '@context/AuthContext';
import { COLORS, SPACING } from '@theme';
import Header from '@components/common/Header';

// Get initials (two letters) from name
const getInitials = (name: string) => {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    // Reset navigation to Login screen
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', screen: 'EditProfile' },
    { icon: 'people-outline', label: 'Friends', screen: 'Friends', badge: '48' },
    { icon: 'person-add-outline', label: 'Friend Requests', screen: 'FriendRequests', badge: '3' },
    { icon: 'ticket-outline', label: 'My Tickets', screen: 'TicketsTab' },
    { icon: 'settings-outline', label: 'Settings', screen: 'Settings' },
    { icon: 'help-circle-outline', label: 'Help & Support', screen: 'HelpSupport' },
  ];

  // Add admin option
  if (user?.isAdmin) {
    menuItems.splice(4, 0, { icon: 'shield-outline', label: 'Admin Dashboard', screen: 'AdminDashboard' });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header with Logo and Search */}
        <Header
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search profile..."
        />

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.name ? getInitials(user.name) : 'U'}
              </Text>
            </View>
          </View>

          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>

          {/* Badges */}
          <View style={styles.badgesContainer}>
            {user?.isHost && (
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={12} color={COLORS.white} />
                <Text style={styles.badgeText}>Host</Text>
              </View>
            )}
            {user?.isAdmin && (
              <View style={[styles.badge, styles.adminBadge]}>
                <Ionicons name="shield-checkmark" size={12} color={COLORS.black} />
                <Text style={[styles.badgeText, { color: COLORS.black }]}>Admin</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>48</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as any} size={20} color={COLORS.black} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <View style={styles.menuRight}>
                {item.badge && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={COLORS.textGray} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.black} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    marginBottom: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadge: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  menuContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.black,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    paddingVertical: 14,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textGray,
    marginTop: SPACING.md,
  },
});

export default ProfileScreen;
