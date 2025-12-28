import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import EmptyState from '../../src/components/ui/empty-state';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/Styles';
import { Fonts } from '../../src/constants/Fonts';
import { useAuth } from '../../src/contexts/auth-context';
import * as HostService from '../../src/services/host-service';

export default function HostDashboard() {
  const router = useRouter();
  const { user, profile, isHost, isAdmin, viewAsUser, toggleViewMode } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<HostService.HostStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const statsData = await HostService.getHostStats(user.id);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Redirect non-hosts to the request page
  if (!isHost && !isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Become a Host"
          emoji="🎭"
          message="Apply to become a host and start creating amazing trips and experiences for your community."
          action={{
            label: 'Apply Now',
            onPress: () => router.push('/host/request'),
          }}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Host View Mode Banner */}
      {isHost && viewAsUser && (
        <Pressable style={styles.viewModeBanner} onPress={toggleViewMode}>
          <Ionicons name="eye-outline" size={16} color={Colors.warning} />
          <Text style={styles.viewModeBannerText}>Viewing as User</Text>
          <Text style={styles.viewModeBannerAction}>Tap to exit</Text>
        </Pressable>
      )}

      {/* Header with Back Button */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Host Dashboard</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Hello, {profile?.full_name?.split(' ')[0] || 'Host'}
          </Text>
          <Text style={styles.welcomeSubtitle}>Here&apos;s your hosting overview.</Text>
        </View>

        {/* Primary Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>
                {formatCurrency(stats.totalRevenue).replace('.00', '')}
              </Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: Colors.infoLight }]}>
                <Ionicons name="ticket-outline" size={20} color={Colors.info} />
              </View>
              <Text style={styles.statValue}>{stats.totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
          </View>
        )}

        {/* Detailed Stats Grid */}
        {stats && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Your Stats</Text>
            <Text style={styles.sectionSubHeader}>Key performance indicators</Text>

            <View style={styles.gridContainer}>
              <View style={styles.gridItem}>
                <Text style={styles.gridValue}>{stats.totalEvents}</Text>
                <Text style={styles.gridLabel}>Listings</Text>
                <Text style={styles.gridSubText}>Created</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridValue}>{stats.upcomingEvents}</Text>
                <Text style={styles.gridLabel}>Upcoming</Text>
                <View style={[styles.trendIndicator, { backgroundColor: Colors.successLight }]}>
                  <Ionicons name="time-outline" size={10} color={Colors.success} />
                  <Text style={[styles.trendText, { color: Colors.success }]}>Active</Text>
                </View>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridValue}>{stats.totalBookings}</Text>
                <Text style={styles.gridLabel}>Bookings</Text>
                <Text style={styles.gridSubText}>All time</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridValue}>{stats.totalEvents - stats.upcomingEvents}</Text>
                <Text style={styles.gridLabel}>Completed</Text>
                <Text style={styles.gridSubText}>Listings</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Quick Actions</Text>
          <Text style={styles.sectionSubHeader}>Manage your listings</Text>

          <View style={styles.menuList}>
            <Pressable style={styles.menuItem} onPress={() => router.push('/events/create')}>
              <View style={[styles.menuIcon, { backgroundColor: Colors.primarySoft }]}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Create Listing</Text>
                <Text style={styles.menuSubtitle}>Launch a new trip or experience</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.borderDark} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => router.push('/host/scanner')}>
              <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceSecondary }]}>
                <Ionicons name="qr-code-outline" size={20} color={Colors.text} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Scan Tickets</Text>
                <Text style={styles.menuSubtitle}>Validate attendee tickets</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.borderDark} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => router.push('/(tabs)/explore')}>
              <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceSecondary }]}>
                <Ionicons name="calendar-outline" size={20} color={Colors.text} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>My Listings</Text>
                <Text style={styles.menuSubtitle}>View and manage your listings</Text>
              </View>
              {stats && stats.upcomingEvents > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.upcomingEvents}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={Colors.borderDark} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => router.push('/host/payouts')}>
              <View style={[styles.menuIcon, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="cash-outline" size={20} color={Colors.success} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Payout Requests</Text>
                <Text style={styles.menuSubtitle}>Request withdrawals for your earnings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.borderDark} />
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>ArzKaro Host v1.0</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  welcomeSection: {
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  statCardPrimary: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primaryLight,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubHeader: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: {
    width: '47%',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridValue: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 4,
  },
  gridLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridSubText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  trendText: {
    ...Typography.caption,
    fontSize: 10,
    fontFamily: Fonts.bold,
    marginLeft: 2,
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: Spacing.sm,
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginVertical: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  viewModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.warningLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning,
  },
  viewModeBannerText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.warning,
  },
  viewModeBannerAction: {
    fontSize: 12,
    color: Colors.warning,
    opacity: 0.8,
    marginLeft: Spacing.xs,
  },
});
