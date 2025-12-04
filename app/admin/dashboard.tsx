import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../src/components/ui/card';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { Colors } from '../../src/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/styles';
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
    return <LoadingSpinner fullScreen text="Loading admin dashboard..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
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
        {/* Welcome Section */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Admin Panel</Text>
          <Text style={styles.userName}>{profile?.full_name || 'Administrator'}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.quickActionButton} onPress={() => router.push('/admin/users')}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionIconText}>👥</Text>
            </View>
            <Text style={styles.quickActionText}>Users</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionButton}
            onPress={() => router.push('/admin/host-requests')}
          >
            <View style={[styles.quickActionIcon, styles.quickActionIconSecondary]}>
              <Text style={styles.quickActionIconText}>📝</Text>
            </View>
            <Text style={styles.quickActionText}>Host Requests</Text>
            {stats && stats.pendingHostRequests > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.pendingHostRequests}</Text>
              </View>
            )}
          </Pressable>

          <Pressable style={styles.quickActionButton} onPress={() => router.push('/admin/events')}>
            <View style={[styles.quickActionIcon, styles.quickActionIconTertiary]}>
              <Text style={styles.quickActionIconText}>📅</Text>
            </View>
            <Text style={styles.quickActionText}>Events</Text>
          </Pressable>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Platform Overview</Text>
            <View style={styles.statsGrid}>
              <Card style={styles.statCard} variant="outlined">
                <Text style={styles.statValue}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </Card>
              <Card style={styles.statCard} variant="outlined">
                <Text style={styles.statValue}>{stats.totalHosts}</Text>
                <Text style={styles.statLabel}>Hosts</Text>
              </Card>
              <Card style={styles.statCard} variant="outlined">
                <Text style={styles.statValue}>{stats.totalEvents}</Text>
                <Text style={styles.statLabel}>Total Events</Text>
              </Card>
              <Card style={styles.statCard} variant="outlined">
                <Text style={styles.statValue}>{stats.activeEvents}</Text>
                <Text style={styles.statLabel}>Active Events</Text>
              </Card>
              <Card style={styles.statCard} variant="outlined">
                <Text style={styles.statValue}>{stats.totalBookings}</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </Card>
              <Card style={styles.statCard} variant="outlined">
                <Text style={[styles.statValue, styles.revenueValue]}>
                  {formatCurrency(stats.totalRevenue)}
                </Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </Card>
            </View>
          </View>
        )}

        {/* Alerts Section */}
        {stats && stats.pendingHostRequests > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Actions</Text>
            <Card
              style={styles.alertCard}
              variant="elevated"
              onPress={() => router.push('/admin/host-requests')}
            >
              <View style={styles.alertRow}>
                <View style={styles.alertIcon}>
                  <Text style={styles.alertIconText}>⚠️</Text>
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>
                    {stats.pendingHostRequests} Pending Host Request
                    {stats.pendingHostRequests > 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.alertSubtitle}>Tap to review applications</Text>
                </View>
                <Text style={styles.alertArrow}>→</Text>
              </View>
            </Card>
          </View>
        )}

        {/* Monthly Stats */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Month</Text>
            <Card style={styles.monthlyCard} variant="outlined">
              <View style={styles.monthlyRow}>
                <View style={styles.monthlyItem}>
                  <Text style={styles.monthlyValue}>{stats.newUsersThisMonth}</Text>
                  <Text style={styles.monthlyLabel}>New Users</Text>
                </View>
                <View style={styles.monthlyDivider} />
                <View style={styles.monthlyItem}>
                  <Text style={styles.monthlyValue}>{stats.activeEvents}</Text>
                  <Text style={styles.monthlyLabel}>Active Events</Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: Spacing.xl }} />
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
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  welcomeText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  userName: {
    ...Typography.h1,
    color: Colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  quickActionIconSecondary: {
    backgroundColor: Colors.secondary,
  },
  quickActionIconTertiary: {
    backgroundColor: Colors.info,
  },
  quickActionIconText: {
    fontSize: 24,
  },
  quickActionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: '20%',
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: 11,
  },
  statsContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '31%',
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  revenueValue: {
    color: Colors.success,
    fontSize: 14,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 10,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  alertCard: {
    padding: Spacing.md,
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
    borderWidth: 1,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  alertIconText: {
    fontSize: 18,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  alertSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  alertArrow: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  monthlyCard: {
    padding: Spacing.lg,
  },
  monthlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyItem: {
    flex: 1,
    alignItems: 'center',
  },
  monthlyDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  monthlyValue: {
    ...Typography.h2,
    color: Colors.primary,
  },
  monthlyLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
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
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.textInverse,
  },
});
