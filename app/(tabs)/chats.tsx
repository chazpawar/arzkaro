import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import { useAuth } from '../../src/contexts/auth-context';
import TabHeader from '../../src/components/TabHeader';
import EmptyState from '../../src/components/ui/empty-state';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { useUserGroups } from '../../src/hooks/use-chat';

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

  // Use real chat groups hook
  const { groups, loading, error, refresh } = useUserGroups(user?.id);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Map groups for display
  const allGroups = groups;
  const allDMs: any[] = [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Map groups for display
  const groupChats = allGroups.map((group) => ({
    id: group.id,
    name: group.event?.title || group.name || 'Event Group',
    type: 'group' as const,
    icon: 'people',
    lastMessage: group.last_message?.content || 'No messages yet',
    time: group.last_message?.created_at || group.created_at,
    unreadCount: group.unread_count || 0,
    avatar: group.event?.cover_image_url || null,
    eventId: group.event_id,
  }));

  // Map DMs for display
  const directMessages = allDMs.map((dm) => ({
    id: dm.id,
    name: dm.other_user?.full_name || 'Unknown User',
    type: 'dm' as const,
    icon: 'person',
    lastMessage: dm.last_message?.content || 'No messages yet',
    time: dm.last_message?.created_at || dm.updated_at,
    unreadCount: dm.unread_count || 0,
    avatar: dm.other_user?.avatar_url || null,
    userId: dm.other_user?.id,
  }));

  // Combine all chats
  const allChats = [...groupChats, ...directMessages].sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

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

  // Show loading spinner while fetching chats
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TabHeader
          searchPlaceholder="Search conversations..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <LoadingSpinner />
      </SafeAreaView>
    );
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
        // Navigate to event chat or DM
        if (item.type === 'group') {
          router.push(`/events/${item.eventId || item.id}/chat`);
        } else if (item.type === 'dm') {
          // TODO: Navigate to DM conversation
          // router.push(`/chats/dm/${item.id}`);
        }
      }}
    >
      <View style={styles.chatAvatar}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.chatAvatarImage} />
        ) : (
          <Ionicons name={getIconForChat(item.icon)} size={24} color={Colors.textSecondary} />
        )}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.chatHeaderRight}>
            <Text style={styles.chatTime}>{formatTime(item.time)}</Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
        <Text
          style={[styles.chatLastMessage, item.unreadCount > 0 && styles.chatLastMessageUnread]}
          numberOfLines={1}
        >
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
    overflow: 'hidden',
  },
  chatAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  chatHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  chatTime: {
    fontSize: 12,
    color: Colors.textTertiary,
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
  chatLastMessageUnread: {
    fontWeight: '600',
    color: Colors.text,
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
