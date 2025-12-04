import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Spacing, BorderRadius } from '../../src/constants/styles';
import { useAuth } from '../../src/contexts/auth-context';
import { useUserGroups, useDMConversations } from '../../src/hooks/use-chat';
import LoadingSpinner from '../../src/components/ui/loading-spinner';

type FilterType = 'all' | 'unread' | 'groups' | 'dms';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'groups', label: 'Groups' },
  { id: 'dms', label: 'DMs' },
];

export default function ChatsTab() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch groups and DMs from backend
  const {
    groups,
    loading: groupsLoading,
    refresh: refreshGroups,
  } = useUserGroups(user?.id);
  const {
    conversations,
    loading: dmsLoading,
    refresh: refreshDMs,
  } = useDMConversations(user?.id);

  const loading = groupsLoading || dmsLoading;

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        refreshGroups();
        refreshDMs();
      }
    }, [user?.id, refreshGroups, refreshDMs])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshGroups(), refreshDMs()]);
    setRefreshing(false);
  }, [refreshGroups, refreshDMs]);

  // Combine groups and DMs for display
  const allChats = [
    ...groups.map((group) => ({
      id: group.id,
      name: group.event?.title || 'Event Group',
      type: 'group' as const,
      icon: 'people',
      lastMessage: 'Group chat',
      time: new Date(group.created_at).toLocaleString(),
      unreadCount: 0, // TODO: Implement unread count
      avatar: null,
    })),
    ...conversations.map((conv) => ({
      id: conv.id,
      name: conv.other_user?.full_name || 'User',
      type: 'dm' as const,
      icon: 'person',
      lastMessage: conv.last_message?.content || 'No messages yet',
      time: conv.last_message?.created_at
        ? new Date(conv.last_message.created_at).toLocaleString()
        : '',
      unreadCount: conv.unread_count || 0,
      avatar: conv.other_user?.avatar_url || null,
    })),
  ];

  // Filter chats based on active filter
  const filteredChats = allChats
    .filter((chat) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return chat.unreadCount > 0;
      if (activeFilter === 'groups') return chat.type === 'group';
      if (activeFilter === 'dms') return chat.type === 'dm';
      return true;
    })
    .filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()));

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

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>Sign In to Chat</Text>
          <Text style={styles.emptyText}>
            Sign in to access your chats, connect with friends, and join event group chats.
          </Text>
          <Pressable style={styles.signInButton} onPress={() => router.push('/')}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </Pressable>
        </View>
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
      onPress={() => router.push(`/chats/dm/${item.id}`)}
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>arz</Text>
          <Text style={styles.logoDot}>.</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

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
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Chats Yet</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'unread'
                ? "You're all caught up! No unread messages."
                : activeFilter === 'groups'
                  ? 'When you book events, you\'ll be added to their group chats.'
                  : "No conversations yet. Start chatting with other users!"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -1,
  },
  logoDot: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: -2,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 15,
    color: Colors.text,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textInverse,
  },
});
