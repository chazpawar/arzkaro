import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Fonts } from '../../src/constants/Fonts';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import { useAuth } from '../../src/contexts/auth-context';
import EmptyState from '../../src/components/ui/empty-state';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { useUserGroups } from '../../src/hooks/use-chat';
import * as DMService from '../../src/services/dm-service';
import type { DMConversation } from '../../src/types/chat.types';

type FilterType = 'all' | 'unread';

// Mock data to ensure the UI looks populated even without real data
const MOCK_CHATS = [
  {
    id: 'mock-1',
    name: 'Weekend Hiking Group',
    lastMessage: 'Anyone bringing a portable speaker?',
    time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    unreadCount: 2,
    avatar: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop',
    type: 'group',
    isOnline: true,
  },
  {
    id: 'mock-2',
    name: 'Sarah Chen',
    lastMessage: 'The tickets are booked! See you there.',
    time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    type: 'dm',
    isOnline: true,
  },
  {
    id: 'mock-3',
    name: 'Photography Workshop',
    lastMessage: 'Remember to charge your batteries!',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    unreadCount: 5,
    avatar: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=200&h=200&fit=crop',
    type: 'group',
    isOnline: false,
  },
  {
    id: 'mock-4',
    name: 'Alex Rivera',
    lastMessage: 'Sent a photo',
    time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    type: 'dm',
    isOnline: true,
  },
  {
    id: 'mock-5',
    name: 'Board Game Night',
    lastMessage: 'Who is winning?',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=200&h=200&fit=crop',
    type: 'group',
    isOnline: false,
  },
  {
    id: 'mock-6',
    name: 'David Kim',
    lastMessage: 'Sounds good to me!',
    time: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day ago
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    type: 'dm',
    isOnline: false,
  },
  {
    id: 'mock-7',
    name: 'Tech Meetup Bangalore',
    lastMessage: 'New venue announced: WeWork Galaxy',
    time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=200&h=200&fit=crop',
    type: 'group',
    isOnline: false,
  },
  {
    id: 'mock-8',
    name: 'Priya Patel',
    lastMessage: 'Are you coming to the event?',
    time: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), // 2 days ago
    unreadCount: 1,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    type: 'dm',
    isOnline: true,
  },
  {
    id: 'mock-9',
    name: 'Design Team',
    lastMessage: 'Can we review the new icons?',
    time: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    unreadCount: 3,
    avatar: 'https://images.unsplash.com/photo-1576153192396-44ccf0fda428?w=200&h=200&fit=crop',
    type: 'group',
    isOnline: true,
  },
  {
    id: 'mock-10',
    name: 'Rahul Gupta',
    lastMessage: 'Thanks for the help!',
    time: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop',
    type: 'dm',
    isOnline: false,
  },
];

export default function ChatsTab() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const _insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [dmConversations, setDmConversations] = useState<DMConversation[]>([]);
  const [loadingDMs, setLoadingDMs] = useState(false);

  // Use real chat groups hook
  const { groups, loading, error: _error, refresh } = useUserGroups(user?.id);

  // Load DM conversations
  const loadDMs = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingDMs(true);
      console.log('[CHATS TAB] Loading DM conversations');
      const conversations = await DMService.getUserConversations(user.id);
      console.log('[CHATS TAB] DM conversations loaded:', conversations.length);

      // Load last message and unread count for each conversation
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          const messages = await DMService.getMessages(conv.id, 1);
          const unreadCount = await DMService.getUnreadCount(conv.id, user.id);
          return {
            ...conv,
            last_message: messages[0] || null,
            unread_count: unreadCount,
          };
        })
      );

      setDmConversations(conversationsWithDetails);
    } catch (error) {
      console.error('[CHATS TAB] Error loading DMs:', error);
    } finally {
      setLoadingDMs(false);
    }
  }, [user?.id]);

  // Load DMs on mount and when user changes
  React.useEffect(() => {
    loadDMs();
  }, [loadDMs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadDMs()]);
    setRefreshing(false);
  }, [refresh, loadDMs]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      // For Instagram style, just show time like "10:30" or "2h"
      // Using "2h", "5m" style for very recent, otherwise time
      if (diffInHours < 1) {
        const minutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return `${minutes}m`;
      }
      if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h`;
      }
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) {
      // Less than a week
      return date.toLocaleDateString([], { weekday: 'short' });
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Map real groups for display
  const realGroupChats = groups.map((group) => ({
    id: group.id,
    name: group.event?.title || group.name || 'Event Group',
    type: 'group' as const,
    lastMessage: group.last_message?.content || 'No messages yet',
    time: group.last_message?.created_at || group.created_at,
    unreadCount: group.unread_count || 0,
    avatar: group.event?.cover_image_url || null,
    eventId: group.event_id,
    isOnline: false,
  }));

  // Map real DMs for display
  const realDirectMessages = dmConversations.map((dm) => ({
    id: dm.id,
    name: dm.other_user?.full_name || 'Unknown User',
    type: 'dm' as const,
    lastMessage: dm.last_message?.content || 'No messages yet',
    time: dm.last_message?.created_at || dm.updated_at,
    unreadCount: dm.unread_count || 0,
    avatar: dm.other_user?.avatar_url || null,
    userId: dm.other_user?.id,
    isOnline: false, // In a real app we'd check online status
  }));

  // Combine real and mock chats
  // Prioritize real chats if they exist, otherwise show mock data for UI demo
  const displayChats =
    [...realGroupChats, ...realDirectMessages].length > 0
      ? [...realGroupChats, ...realDirectMessages]
      : MOCK_CHATS;

  // Sort by time
  const sortedChats = displayChats.sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  // Filter chats based on active filter
  const filteredChats = sortedChats.filter((chat) => {
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
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Chats</Text>
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

  // Show loading spinner while fetching chats (only for initial load)
  if ((loading || loadingDMs) && !refreshing && displayChats.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/arz.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerIcons} />
        </View>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  const renderChatItem = ({ item }: { item: (typeof displayChats)[0] }) => {
    const isUnread = item.unreadCount > 0;

    return (
      <Pressable
        style={({ pressed }) => [styles.chatItem, pressed && styles.chatItemPressed]}
        onPress={() => {
          // Navigate to event chat or DM
          if (item.type === 'group') {
            router.push(`/events/${(item as any).eventId || item.id}/chat`);
          } else if (item.type === 'dm') {
            router.push(`/dm/${item.id}`);
          }
        }}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: item.avatar || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.row}>
            <Text style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.message, isUnread && styles.messageUnread]} numberOfLines={1}>
              {item.lastMessage}
              <Text style={styles.timeDot}> · </Text>
              <Text style={styles.time}>{formatTime(item.time)}</Text>
            </Text>

            {isUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/arz.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.headerIcons} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>Search</Text>
        </View>
      </View>

      {/* Filter Tabs (Messages / Requests) - Simplified for this view */}
      <View style={styles.filterTabs}>
        <Pressable
          style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text
            style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}
          >
            Messages
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, activeFilter === 'unread' && styles.filterTabActive]}
          onPress={() => setActiveFilter('unread')}
        >
          <Text
            style={[styles.filterTabText, activeFilter === 'unread' && styles.filterTabTextActive]}
          >
            Unread
          </Text>
        </Pressable>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
            title="No Messages"
            message="Your messages will appear here."
            icon="chatbubble-ellipses-outline"
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: 0,
    position: 'relative',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -15,
  },
  logo: {
    width: 200,
    height: 100,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  headerIcon: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    height: 36,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
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
  filterTabActive: {
    backgroundColor: Colors.text,
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.textInverse,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    height: 72,
  },
  chatItemPressed: {
    backgroundColor: Colors.surfaceSecondary,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eee',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  nameUnread: {
    fontWeight: '700', // Unread names are bold
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  messageUnread: {
    fontWeight: '600', // Unread messages are bolder
    color: Colors.text,
  },
  timeDot: {
    color: Colors.textSecondary,
  },
  time: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0095F6', // Instagram blue
    marginLeft: 6,
  },
  cameraButton: {
    padding: 8,
  },
});
