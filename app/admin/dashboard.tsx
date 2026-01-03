import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import BackButton from '../../src/components/ui/back-button';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/Styles';
import { Fonts } from '../../src/constants/Fonts';
import { useAuth } from '../../src/contexts/auth-context';
import * as AdminService from '../../src/services/admin-service';

export default function AdminDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminService.AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const statsData = await AdminService.getAdminStats();
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

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

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton variant="minimal" />
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={styles.headerActionPlaceholder} />
        </View>
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Custom Header */}
        <View style={styles.header}>
          <BackButton variant="minimal" />
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={styles.headerActionPlaceholder} />
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
              Hello, {profile?.full_name?.split(' ')[0] || 'Admin'}
            </Text>
            <Text style={styles.welcomeSubtitle}>Here&apos;s what&apos;s happening today.</Text>
          </View>

          {/* Action Needed */}
          {stats && stats.pendingHostRequests > 0 && (
            <Pressable style={styles.alertCard} onPress={() => router.push('/admin/host-requests')}>
              <View style={styles.alertIconContainer}>
                <Ionicons name="alert" size={20} color={Colors.warning} />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Pending Host Requests</Text>
                <Text style={styles.alertMessage}>
                  {stats.pendingHostRequests} new request{stats.pendingHostRequests > 1 ? 's' : ''}{' '}
                  require your attention.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            </Pressable>
          )}

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
                  <Image
                    source={require('../../assets/others/dateandtime.png')}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.statValue}>{stats.totalBookings}</Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
              </View>
            </View>
          )}

          {/* Detailed Stats Grid */}
          {stats && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Platform Metrics</Text>
              <Text style={styles.sectionSubHeader}>Key performance indicators</Text>

              <View style={styles.gridContainer}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridValue}>{stats.totalUsers}</Text>
                  <Text style={styles.gridLabel}>Users</Text>
                  <View style={[styles.trendIndicator, { backgroundColor: Colors.successLight }]}>
                    <Ionicons name="arrow-up" size={10} color={Colors.success} />
                    <Text style={[styles.trendText, { color: Colors.success }]}>
                      {stats.newUsersThisMonth} new
                    </Text>
                  </View>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.gridValue}>{stats.totalHosts}</Text>
                  <Text style={styles.gridLabel}>Hosts</Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.gridValue}>{stats.totalEvents}</Text>
                  <Text style={styles.gridLabel}>Listings</Text>
                  <Text style={styles.gridSubText}>{stats.activeEvents} active</Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.gridValue}>{stats.pendingHostRequests}</Text>
                  <Text style={styles.gridLabel}>Requests</Text>
                  <Text
                    style={[
                      styles.gridSubText,
                      {
                        color: stats.pendingHostRequests > 0 ? Colors.warning : Colors.textTertiary,
                      },
                    ]}
                  >
                    {stats.pendingHostRequests > 0 ? 'Pending' : 'All clear'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Quick Management</Text>
            <Text style={styles.sectionSubHeader}>Access core admin functions</Text>

            <View style={styles.menuList}>
              <Pressable style={styles.menuItem} onPress={() => router.push('/admin/users')}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceSecondary }]}>
                  <Ionicons name="people-outline" size={20} color={Colors.text} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Manage Users</Text>
                  <Text style={styles.menuSubtitle}>View and edit user roles</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.borderDark} />
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => router.push('/admin/host-requests')}
              >
                <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceSecondary }]}>
                  <Ionicons name="documents-outline" size={20} color={Colors.text} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Host Requests</Text>
                  <Text style={styles.menuSubtitle}>Approve or reject applications</Text>
                </View>
                {stats && stats.pendingHostRequests > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{stats.pendingHostRequests}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={Colors.borderDark} />
              </Pressable>

              <Pressable style={styles.menuItem} onPress={() => router.push('/admin/payouts')}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.successLight }]}>
                  <Ionicons name="cash-outline" size={20} color={Colors.success} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Payout Requests</Text>
                  <Text style={styles.menuSubtitle}>Review and approve host payouts</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.borderDark} />
              </Pressable>

              <Pressable style={styles.menuItem} onPress={() => router.push('/admin/listings')}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.primaryLight }]}>
                  <Ionicons name="list-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Listings</Text>
                  <Text style={styles.menuSubtitle}>View all experiences and trips</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.borderDark} />
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => router.push('/admin/notifications')}
              >
                <View style={[styles.menuIcon, { backgroundColor: Colors.warningLight }]}>
                  <Ionicons name="notifications-outline" size={20} color={Colors.warning} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Send Notifications</Text>
                  <Text style={styles.menuSubtitle}>Send promotional push notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.borderDark} />
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>ArzKaro Admin v1.0</Text>
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
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  alertIconContainer: {
    marginRight: Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...Typography.bodySmall,
    fontFamily: Fonts.bold,
    color: Colors.warning,
    marginBottom: 2,
  },
  alertMessage: {
    ...Typography.caption,
    color: Colors.warning, // Darker shade would be better for text
    opacity: 0.9,
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
    backgroundColor: Colors.surface, // Keep it clean
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
    width: '47%', // roughly half minus gap
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
});
