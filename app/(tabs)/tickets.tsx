import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import { useAuth } from '../../src/contexts/auth-context';
import TabHeader from '../../src/components/TabHeader';
import EmptyState from '../../src/components/ui/empty-state';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import type { TicketWithDetails } from '../../src/types';
import { useTickets } from '../../src/hooks/use-bookings';

export default function TicketsTab() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'valid' | 'used' | 'expired'>('valid');
  const [refreshing, setRefreshing] = useState(false);

  // Use real tickets hook
  const {
    validTickets,
    usedTickets,
    expiredTickets,
    loading,
    error: _error,
    refresh,
  } = useTickets(user?.id);

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

  const filteredTickets = getCurrentTickets().filter((ticket: TicketWithDetails) =>
    ticket.event?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/arz.png')}
              style={styles.logo}
              resizeMode="contain"
            />
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

  // Show loading spinner while fetching tickets
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TabHeader
          searchPlaceholder="Search tickets..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <LoadingSpinner />
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

  const getStatusDisplay = (status?: TicketWithDetails['status']) => {
    switch (status) {
      case 'used':
        return { label: 'Used', text: Colors.success, bg: Colors.successLight };
      case 'expired':
      case 'cancelled':
        return { label: 'Expired', text: Colors.error, bg: Colors.errorLight };
      default:
        return { label: 'Active', text: Colors.primaryDark, bg: Colors.primarySoft };
    }
  };

  const renderTicketCard = ({ item }: { item: TicketWithDetails }) => {
    const event = item.event;
    if (!event) return null;

    const statusBadge = getStatusDisplay(item.status);
    const totalPaid = item.booking.total_amount || 0;

    return (
      <Pressable style={styles.ticketCard} onPress={() => router.push(`/tickets/${item.id}`)}>
        <View style={styles.cardImageWrapper}>
          {event.cover_image_url ? (
            <Image source={{ uri: event.cover_image_url }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons name="image-outline" size={36} color={Colors.textSecondary} />
            </View>
          )}
          {statusBadge && (
            <View style={[styles.statusPill, { backgroundColor: statusBadge.bg }]}>
              <Text style={[styles.statusPillText, { color: statusBadge.text }]}>
                {statusBadge.label}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {event.title}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {formatDate(event.start_date)} · {formatTime(event.start_date)}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{event.location_name || 'TBA'}</Text>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.priceLabel}>Paid</Text>
              <Text style={styles.ticketPrice}>
                {totalPaid === 0 ? 'Free' : `Rs.${totalPaid.toLocaleString('en-IN')}`}
              </Text>
            </View>
            <View style={styles.viewTicketCta}>
              <Text style={styles.viewTicketText}>View ticket</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
            </View>
          </View>
        </View>
      </Pressable>
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.background,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -15,
  },
  logo: {
    width: 200,
    height: 100,
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
    backgroundColor: Colors.text,
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
    gap: Spacing.lg,
  },
  ticketCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardImageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  viewTicketCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewTicketText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
