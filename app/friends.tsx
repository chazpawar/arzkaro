import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../src/components/ui/loading-spinner';
import EmptyState from '../src/components/ui/empty-state';
import { Colors } from '../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../src/constants/Styles';
import { useAuth } from '../src/contexts/auth-context';
import * as FriendsService from '../src/services/friends-service';
import * as DMService from '../src/services/dm-service';
import type { FriendRequest, Friendship } from '../src/types/chat.types';

type Tab = 'friends' | 'requests';

export default function FriendsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const [friendsData, requestsData] = await Promise.all([
        FriendsService.getFriends(user.id),
        FriendsService.getPendingRequests(user.id),
      ]);

      setFriends(friendsData);
      setPendingRequests(requestsData);
    } catch (error) {
      console.error('[FRIENDS] Error loading data:', error);
      Alert.alert('Error', 'Failed to load friends data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Clear stale data and show loading
      setLoading(true);
      setFriends([]);
      setPendingRequests([]);

      // Load fresh data
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleAcceptRequest = async (requestId: string) => {
    if (!user?.id) return;

    try {
      setActionLoading(requestId);
      await FriendsService.acceptFriendRequest(requestId, user.id);
      Alert.alert('Success', 'Friend request accepted!');
      await loadData();
    } catch (error) {
      console.error('[FRIENDS] Error accepting request:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!user?.id) return;

    Alert.alert('Reject Request', 'Are you sure you want to reject this friend request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(requestId);
            await FriendsService.rejectFriendRequest(requestId, user.id);
            Alert.alert('Success', 'Friend request rejected');
            await loadData();
          } catch (error) {
            console.error('[FRIENDS] Error rejecting request:', error);
            Alert.alert(
              'Error',
              error instanceof Error ? error.message : 'Failed to reject request'
            );
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(friendshipId);
              await FriendsService.removeFriend(friendshipId, user.id);
              Alert.alert('Success', 'Friend removed');
              await loadData();
            } catch (error) {
              console.error('[FRIENDS] Error removing friend:', error);
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to remove friend'
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleMessageFriend = async (friendId: string) => {
    if (!user?.id) return;

    try {
      // Get or create conversation with this friend
      const conversation = await DMService.getOrCreateConversation(user.id, friendId);

      // Navigate to DM chat screen
      router.push(`/dm/${conversation.id}`);
    } catch (error) {
      console.error('[FRIENDS] Error opening conversation:', error);
      Alert.alert('Error', 'Failed to open conversation. Please try again.');
    }
  };

  const renderFriend = ({ item }: { item: Friendship }) => {
    if (!item.friend) return null;

    const displayName = item.friend.full_name || item.friend.email?.split('@')[0] || 'User';
    const username = (item.friend as any).username || item.friend.email?.split('@')[0] || '';
    const isLoading = actionLoading === item.id;

    return (
      <Pressable
        style={styles.listItem}
        onPress={() => router.push(`/profile?userId=${item.friend?.id}`)}
      >
        <View style={styles.avatarContainer}>
          {item.friend.avatar_url ? (
            <Image source={{ uri: item.friend.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.listItemContent}>
          <Text style={styles.listItemUsername} numberOfLines={1}>
            {username}
          </Text>
          <Text style={styles.listItemName} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        <Pressable
          style={styles.messageButtonLarge}
          onPress={(e) => {
            e.stopPropagation();
            handleMessageFriend(item.friend!.id);
          }}
        >
          <Text style={styles.messageButtonText}>Message</Text>
        </Pressable>

        <Pressable
          style={styles.menuButton}
          onPress={(e) => {
            e.stopPropagation();
            handleRemoveFriend(item.id, displayName);
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size="small" />
          ) : (
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.text} />
          )}
        </Pressable>
      </Pressable>
    );
  };

  const renderRequest = ({ item }: { item: FriendRequest }) => {
    if (!item.sender) return null;

    const displayName = item.sender.full_name || item.sender.email?.split('@')[0] || 'User';
    const username = (item.sender as any).username || item.sender.email?.split('@')[0] || '';
    const isLoading = actionLoading === item.id;

    return (
      <Pressable
        style={styles.requestItem}
        onPress={() => router.push(`/profile?userId=${item.sender?.id}`)}
      >
        <View style={styles.avatarContainer}>
          {item.sender.avatar_url ? (
            <Image source={{ uri: item.sender.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.listItemContent}>
          <Text style={styles.listItemUsername} numberOfLines={1}>
            {username}
          </Text>
          <Text style={styles.listItemName} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        <View style={styles.requestActions}>
          <Pressable
            style={styles.confirmButton}
            onPress={(e) => {
              e.stopPropagation();
              handleAcceptRequest(item.id);
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size="small" color={Colors.background} />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleRejectRequest(item.id);
            }}
            disabled={isLoading}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState
          title="Sign In Required"
          emoji="🔒"
          message="Please sign in to view your friends."
          action={{
            label: 'Sign In',
            onPress: () => router.push('/'),
          }}
        />
      </SafeAreaView>
    );
  }

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingSpinner fullScreen text="Loading friends..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Friends</Text>
          {!loading && (
            <Text style={styles.headerSubtitle}>
              {friends.length} friend{friends.length !== 1 ? 's' : ''}
              {pendingRequests.length > 0 &&
                ` • ${pendingRequests.length} request${pendingRequests.length !== 1 ? 's' : ''}`}
            </Text>
          )}
        </View>
        <Pressable onPress={() => router.push('/find-friends')} style={styles.findFriendsButton}>
          <Ionicons name="person-add" size={24} color={Colors.text} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            Friends{!loading && ` (${friends.length})`}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Requests
          </Text>
          {!loading && pendingRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRequests.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Content */}
      {activeTab === 'friends' ? (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Friends Yet"
              emoji="👥"
              message="Start making connections by sending friend requests to other users."
            />
          }
        />
      ) : (
        <FlatList
          data={pendingRequests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Pending Requests"
              emoji="📭"
              message="You don't have any friend requests at the moment."
            />
          }
        />
      )}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  headerActionPlaceholder: {
    width: 32,
  },
  findFriendsButton: {
    padding: Spacing.xs,
    marginRight: -Spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: Spacing.xs,
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.background,
    fontWeight: '600',
    fontSize: 11,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.h3,
    color: Colors.background,
  },
  listItemContent: {
    flex: 1,
  },
  listItemUsername: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  listItemName: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  listItemSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  messageButtonLarge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageButtonText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  menuButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  confirmButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    ...Typography.bodySmall,
    color: Colors.background,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deleteButtonText: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
  },
});
