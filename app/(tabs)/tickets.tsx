import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import { useAuth } from '../../src/contexts/auth-context';
import { useTickets } from '../../src/hooks/use-bookings';
import TabHeader from '../../src/components/TabHeader';
import EmptyState from '../../src/components/ui/empty-state';
import type { TicketWithDetails } from '../../src/types';

export default function TicketsTab() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'valid' | 'used' | 'expired'>('valid');

  // Fetch tickets from backend
  const { validTickets, usedTickets, expiredTickets, refresh } = useTickets(user?.id);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        refresh();
      }
    }, [user?.id, refresh])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Get current tickets based on active tab
  const getCurrentTickets = () => {
    switch (activeTab) {
      case 'valid':
        return validTickets;
      case 'used':
        return usedTickets;
      case 'expired':
        return expiredTickets;
      default:
        return validTickets;
    }
  };

  const filteredTickets = getCurrentTickets().filter((ticket) =>
    ticket.event?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>arz</Text>
            <Text style={styles.logoDot}>.</Text>
          </View>
        </View>

        <EmptyState
          title="Sign In to View Tickets"
          message="Sign in to access your tickets and manage your event bookings."
          icon="ticket-outline"
          action={{
            label: 'Sign In',
            onPress: () => router.push('/'),
          }}
        />
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '.');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const renderTicketCard = ({ item }: { item: TicketWithDetails }) => {
    const event = item.event;
    if (!event) return null;

    // Status badge
    const getStatusBadge = () => {
      switch (item.status) {
        case 'used':
          return { text: 'Used', color: Colors.success };
        case 'expired':
        case 'cancelled':
          return { text: 'Expired', color: Colors.error };
        default:
          return null;
      }
    };

    const statusBadge = getStatusBadge();

    return (
      <View style={styles.ticketCard}>
        {/* Status Badge */}
        {statusBadge && (
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
            <Text style={styles.statusBadgeText}>{statusBadge.text}</Text>
          </View>
        )}

        {/* Card Header - Event Info */}
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketTitle}>{event.title}</Text>
          <Text style={styles.ticketMeta}>
            {formatDate(event.start_date)} | {formatTime(event.start_date)}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.ticketLocation}>{event.location_name || 'TBA'}</Text>
          </View>
        </View>

        {/* Card Image */}
        <View style={styles.ticketImageContainer}>
          {event.cover_image_url ? (
            <Image source={{ uri: event.cover_image_url }} style={styles.ticketImage} />
          ) : (
            <View style={styles.ticketImagePlaceholder}>
              <Ionicons name="image-outline" size={40} color={Colors.textInverse} />
            </View>
          )}
        </View>

        {/* Card Footer - Price and Action */}
        <View style={styles.ticketFooter}>
          <Text style={styles.ticketPrice}>
            Rs.{(item.booking.total_amount || 0).toLocaleString('en-IN')}
          </Text>
          <Pressable
            style={styles.viewTicketButton}
            onPress={() => router.push(`/tickets/${item.id}`)}
          >
            <Text style={styles.viewTicketButtonText}>View Ticket</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Search */}
      <TabHeader
        searchPlaceholder="Search tickets..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'valid' && styles.tabActive]}
          onPress={() => setActiveTab('valid')}
        >
          <Text style={[styles.tabText, activeTab === 'valid' && styles.tabTextActive]}>
            Active
          </Text>
          {validTickets.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{validTickets.length}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'used' && styles.tabActive]}
          onPress={() => setActiveTab('used')}
        >
          <Text style={[styles.tabText, activeTab === 'used' && styles.tabTextActive]}>Used</Text>
          {usedTickets.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{usedTickets.length}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'expired' && styles.tabActive]}
          onPress={() => setActiveTab('expired')}
        >
          <Text style={[styles.tabText, activeTab === 'expired' && styles.tabTextActive]}>
            Expired
          </Text>
          {expiredTickets.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{expiredTickets.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Tickets List */}
      <FlatList
        data={filteredTickets}
        renderItem={renderTicketCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ticketsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title={
              activeTab === 'valid'
                ? 'No Active Tickets'
                : activeTab === 'used'
                  ? 'No Used Tickets'
                  : 'No Expired Tickets'
            }
            message={
              activeTab === 'valid'
                ? 'Your tickets will appear on this screen.'
                : activeTab === 'used'
                  ? 'Tickets you have used for events will appear here.'
                  : 'Cancelled or expired tickets will appear here.'
            }
            icon="ticket-outline"
            action={
              activeTab === 'valid'
                ? {
                    label: 'Explore Events',
                    icon: 'search-outline',
                    onPress: () => router.push('/(tabs)/explore'),
                  }
                : undefined
            }
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    flexDirection: 'column',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textInverse,
  },
  tabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  ticketsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  ticketCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketHeader: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  ticketTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textInverse,
    marginBottom: 4,
  },
  ticketMeta: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  ticketImageContainer: {
    marginHorizontal: Spacing.md,
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  ticketImage: {
    width: '100%',
    height: '100%',
  },
  ticketImagePlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  viewTicketButton: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  viewTicketButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
