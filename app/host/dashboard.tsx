import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../src/components/ui/card';
import Button from '../../src/components/ui/button';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { Colors } from '../../src/constants/colors';
import { Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/styles';
import { useAuth } from '../../src/contexts/auth-context';
import * as HostService from '../../src/services/host-service';
import type { Event } from '../../src/types';

export default function HostDashboard() {
  const router = useRouter();
  const { user, profile, isHost, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<HostService.HostStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [_error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const [statsData, eventsData] = await Promise.all([
        HostService.getHostStats(user.id),
        HostService.getHostEvents(user.id),
      ]);
      setStats(statsData);
      setRecentEvents(eventsData.slice(0, 5)); // Show only recent 5
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Redirect non-hosts to the request page
  if (!isHost && !isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notHostContainer}>
          <Text style={styles.notHostIcon}>🎭</Text>
          <Text style={styles.notHostTitle}>Become a Host</Text>
          <Text style={styles.notHostText}>
            Apply to become a host and start creating amazing events for your community.
          </Text>
          <Button
            title="Apply Now"
            onPress={() => router.push('/host/request')}
            variant="primary"
            size="large"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
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
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{profile?.full_name || 'Host'}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.quickActionButton} onPress={() => router.push('/events/create')}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionIconText}>+</Text>
            </View>
            <Text style={styles.quickActionText}>Create Event</Text>
          </Pressable>

          <Pressable style={styles.quickActionButton} onPress={() => router.push('/host/scanner')}>
            <View style={[styles.quickActionIcon, styles.quickActionIconSecondary]}>
              <Text style={styles.quickActionIconText}>📷</Text>
            </View>
            <Text style={styles.quickActionText}>Scan Tickets</Text>
          </Pressable>

          <Pressable style={styles.quickActionButton} onPress={() => router.push('/host/events')}>
            <View style={[styles.quickActionIcon, styles.quickActionIconTertiary]}>
              <Text style={styles.quickActionIconText}>📋</Text>
            </View>
            <Text style={styles.quickActionText}>My Events</Text>
          </Pressable>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <Card style={styles.statCard} variant="outlined">
                <Text style={styles.statValue}>{stats.totalEvents}</Text>
                <Text style={styles.statLabel}>Total Events</Text>
              </Card>
              <Card style={styles.statCard} variant="outlined">
                <Text style={styles.statValue}>{stats.upcomingEvents}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
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

        {/* Recent Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Events</Text>
            <Pressable onPress={() => router.push('/host/events')}>
              <Text style={styles.seeAllText}>See All →</Text>
            </Pressable>
          </View>

          {recentEvents.length === 0 ? (
            <Card style={styles.emptyCard} variant="outlined">
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No events yet</Text>
              <Button
                title="Create Your First Event"
                onPress={() => router.push('/events/create')}
                variant="primary"
                size="small"
              />
            </Card>
          ) : (
            recentEvents.map((event) => (
              <Card
                key={event.id}
                style={styles.eventCard}
                variant="elevated"
                onPress={() => router.push(`/events/${event.id}`)}
              >
                <View style={styles.eventRow}>
                  {event.cover_image_url ? (
                    <Image source={{ uri: event.cover_image_url }} style={styles.eventImage} />
                  ) : (
                    <View style={styles.eventImagePlaceholder}>
                      <Text style={styles.eventImagePlaceholderText}>
                        {event.type === 'event' ? '🎉' : event.type === 'experience' ? '✨' : '🏔️'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.eventInfo}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          event.is_published ? styles.publishedBadge : styles.draftBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            event.is_published ? styles.publishedText : styles.draftText,
                          ]}
                        >
                          {event.is_published ? 'Live' : 'Draft'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.eventDate}>
                      {formatDate(event.start_date)} • {event.current_bookings || 0} booked
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

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
    color: Colors.textInverse,
  },
  quickActionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
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
    width: '48%',
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 4,
  },
  revenueValue: {
    color: Colors.success,
    fontSize: 20,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  seeAllText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  eventCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  eventRow: {
    flexDirection: 'row',
  },
  eventImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  eventImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventImagePlaceholderText: {
    fontSize: 24,
  },
  eventInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  publishedBadge: {
    backgroundColor: Colors.successLight,
  },
  draftBadge: {
    backgroundColor: Colors.surfaceSecondary,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  publishedText: {
    color: Colors.success,
  },
  draftText: {
    color: Colors.textSecondary,
  },
  eventDate: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  notHostContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  notHostIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  notHostTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  notHostText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
});
