import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import { useAuth } from '../../src/contexts/auth-context';
import { useUserGroups } from '../../src/hooks/use-chat';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import TabHeader from '../../src/components/TabHeader';
import EmptyState from '../../src/components/ui/empty-state';

type FilterType = 'all' | 'unread';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
];

export default function ChatsTab() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch groups from backend
  const { groups, loading, refresh: refreshGroups } = useUserGroups(user?.id);

  // Load data on component mount
  React.useEffect(() => {
    if (user?.id) {
      refreshGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshGroups();
    setRefreshing(false);
  }, [refreshGroups]);

  // Map groups for display
  const allChats = groups.map((group) => ({
    id: group.id,
    name: group.event?.title || 'Event Group',
    type: 'group' as const,
    icon: 'people',
    lastMessage: 'Group chat',
    time: new Date(group.created_at).toLocaleString(),
    unreadCount: 0, // TODO: Implement unread count
    avatar: null,
  }));

  // Filter chats based on active filter
  const filteredChats = allChats.filter((chat) => {
    // Search filter
    if (searchQuery && !chat.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Type filter
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return chat.unreadCount > 0;
    return true;
  });

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>arz</Text>
            <Text style={styles.logoDot}>.</Text>
          </View>
        </View>

        <EmptyState
          title="Sign In to Chat"
          message="Sign in to access your event group chats and connect with other attendees."
          icon="chatbubbles-outline"
          action={{
            label: 'Sign In',
            onPress: () => router.push('/'),
          }}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading chats..." />;
  }

  const renderFilterChip = (filter: { id: FilterType; label: string }) => {
    const isActive = activeFilter === filter.id;
    return (
      <Pressable
        key={filter.id}
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setActiveFilter(filter.id)}
      >
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {filter.label}
        </Text>
      </Pressable>
    );
  };

  const getIconForChat = (iconName: string) => {
    switch (iconName) {
      case 'people':
        return 'people-outline';
      case 'person':
        return 'person-outline';
      case 'star':
        return 'star-outline';
      case 'notifications':
        return 'notifications-outline';
      default:
        return 'chatbubble-outline';
    }
  };

  const renderChatItem = ({ item }: { item: (typeof allChats)[0] }) => (
    <Pressable
      style={({ pressed }) => [styles.chatItem, pressed && styles.chatItemPressed]}
      onPress={() => {
        // Navigate to event chat
        if (item.type === 'group') {
          // You would need to get the event_id from the group
          // For now just show the group_id
          router.push(`/events/${item.id}/chat`);
        }
      }}
    >
      <View style={styles.chatAvatar}>
        <Ionicons name={getIconForChat(item.icon)} size={24} color={Colors.textSecondary} />
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.chatLastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Search */}
      <TabHeader
        searchPlaceholder="Search conversations..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Filter Chips */}
      <View style={styles.filterSection}>{FILTERS.map(renderFilterChip)}</View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            title="No Chats Yet"
            message={
              activeFilter === 'unread'
                ? "You're all caught up! No unread messages."
                : "When you book events, you'll be added."
            }
            icon="chatbubbles-outline"
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
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textInverse,
  },
  chatList: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  chatItemPressed: {
    backgroundColor: Colors.surfaceSecondary,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  chatLastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 78,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  logoDot: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
});
