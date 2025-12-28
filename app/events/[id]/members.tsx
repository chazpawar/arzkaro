import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../src/components/ui/loading-spinner';
import EmptyState from '../../../src/components/ui/empty-state';
import { Colors } from '../../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../../src/constants/Styles';
import { Fonts } from '../../../src/constants/Fonts';
import { useAuth } from '../../../src/contexts/auth-context';
import * as ChatService from '../../../src/services/chat-service';
import * as FriendsService from '../../../src/services/friends-service';

interface Member {
  id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'host';
  joined_at: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

type FriendStatus = 'none' | 'friends' | 'sent' | 'received' | 'loading';

export default function GroupMembersScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, FriendStatus>>({});
  const [friendRequestIds, setFriendRequestIds] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadMembers() {
      if (!eventId || !user?.id) {
        setError('No event ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get group ID from event
        const group = await ChatService.getGroupByEventId(eventId);

        if (!group) {
          setError('Group not found');
          setLoading(false);
          return;
        }

        setGroupName(group.name);

        // Get group members
        const groupMembers = await ChatService.getGroupMembers(group.id);
        setMembers(groupMembers);

        // Load friend statuses for all members
        await loadFriendStatuses(groupMembers);
      } catch (err) {
        console.error('[MEMBERS SCREEN] Error loading members:', err);
        setError(err instanceof Error ? err.message : 'Failed to load members');
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user?.id]);

  const loadFriendStatuses = async (membersList: Member[]) => {
    if (!user?.id) return;

    try {
      // Get all friendships and friend requests
      const [friends, allRequests] = await Promise.all([
        FriendsService.getFriends(user.id),
        FriendsService.getFriendRequests(user.id),
      ]);

      const statuses: Record<string, FriendStatus> = {};
      const requestIds: Record<string, string> = {};

      membersList.forEach((member) => {
        if (member.user_id === user.id) {
          // Current user - don't show button
          statuses[member.user_id] = 'friends';
          return;
        }

        // Check if already friends
        const isFriend = friends.some((f) => f.friend?.id === member.user_id);

        if (isFriend) {
          statuses[member.user_id] = 'friends';
          return;
        }

        // Check for pending requests
        const sentRequest = allRequests.find(
          (r) =>
            r.sender_id === user.id && r.receiver_id === member.user_id && r.status === 'pending'
        );

        if (sentRequest) {
          statuses[member.user_id] = 'sent';
          requestIds[member.user_id] = sentRequest.id;
          return;
        }

        const receivedRequest = allRequests.find(
          (r) =>
            r.sender_id === member.user_id && r.receiver_id === user.id && r.status === 'pending'
        );

        if (receivedRequest) {
          statuses[member.user_id] = 'received';
          requestIds[member.user_id] = receivedRequest.id;
          return;
        }

        // No relationship
        statuses[member.user_id] = 'none';
      });

      setFriendStatuses(statuses);
      setFriendRequestIds(requestIds);
    } catch (err) {
      console.error('[MEMBERS SCREEN] Error loading friend statuses:', err);
    }
  };

  const handleMemberPress = (userId: string) => {
    router.push(`/user-profile?userId=${userId}`);
  };

  const handleAddFriend = async (memberId: string, memberName: string) => {
    if (!user?.id) return;

    try {
      setFriendStatuses((prev) => ({ ...prev, [memberId]: 'loading' }));
      await FriendsService.sendFriendRequest(user.id, memberId);
      Alert.alert('Request Sent', `Friend request sent to ${memberName}`);

      // Reload statuses
      await loadFriendStatuses(members);
    } catch (error) {
      console.error('[MEMBERS SCREEN] Error sending friend request:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send request');
      setFriendStatuses((prev) => ({ ...prev, [memberId]: 'none' }));
    }
  };

  const handleCancelRequest = async (memberId: string) => {
    if (!user?.id) return;
    const requestId = friendRequestIds[memberId];
    if (!requestId) return;

    try {
      setFriendStatuses((prev) => ({ ...prev, [memberId]: 'loading' }));
      await FriendsService.cancelFriendRequest(requestId, user.id);
      Alert.alert('Request Cancelled', 'Friend request cancelled');

      // Reload statuses
      await loadFriendStatuses(members);
    } catch (error) {
      console.error('[MEMBERS SCREEN] Error cancelling request:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to cancel request');
      setFriendStatuses((prev) => ({ ...prev, [memberId]: 'sent' }));
    }
  };

  const handleAcceptRequest = async (memberId: string, memberName: string) => {
    if (!user?.id) return;
    const requestId = friendRequestIds[memberId];
    if (!requestId) return;

    try {
      setFriendStatuses((prev) => ({ ...prev, [memberId]: 'loading' }));
      await FriendsService.acceptFriendRequest(requestId, user.id);
      Alert.alert('Friends!', `You and ${memberName} are now friends`);

      // Reload statuses
      await loadFriendStatuses(members);
    } catch (error) {
      console.error('[MEMBERS SCREEN] Error accepting request:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to accept request');
      setFriendStatuses((prev) => ({ ...prev, [memberId]: 'received' }));
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'host':
        return { icon: '👑', label: 'Host', color: Colors.primary };
      case 'moderator':
        return { icon: '⭐', label: 'Moderator', color: Colors.warning };
      default:
        return null;
    }
  };

  const renderFriendButton = (memberId: string, displayName: string) => {
    const status = friendStatuses[memberId] || 'none';

    if (memberId === user?.id) {
      return null; // Don't show button for current user
    }

    switch (status) {
      case 'loading':
        return (
          <View style={styles.followButton}>
            <LoadingSpinner size="small" />
          </View>
        );

      case 'friends':
        return (
          <View style={[styles.followButton, styles.followButtonFriends]}>
            <Text style={styles.followButtonTextFriends}>Friends</Text>
          </View>
        );

      case 'sent':
        return (
          <Pressable
            style={[styles.followButton, styles.followButtonSent]}
            onPress={(e) => {
              e.stopPropagation();
              handleCancelRequest(memberId);
            }}
          >
            <Text style={styles.followButtonTextSent}>Pending</Text>
          </Pressable>
        );

      case 'received':
        return (
          <Pressable
            style={[styles.followButton, styles.followButtonFollow]}
            onPress={(e) => {
              e.stopPropagation();
              handleAcceptRequest(memberId, displayName);
            }}
          >
            <Text style={styles.followButtonTextFollow}>Accept</Text>
          </Pressable>
        );

      case 'none':
      default:
        return (
          <Pressable
            style={[styles.followButton, styles.followButtonFollow]}
            onPress={(e) => {
              e.stopPropagation();
              handleAddFriend(memberId, displayName);
            }}
          >
            <Text style={styles.followButtonTextFollow}>Follow</Text>
          </Pressable>
        );
    }
  };

  const renderMember = ({ item }: { item: Member }) => {
    if (!item.user) return null;

    const badge = getRoleBadge(item.role);
    const displayName = item.user.full_name || item.user.email.split('@')[0] || 'User';
    const username = item.user.email.split('@')[0] || 'user';
    const isCurrentUser = item.user_id === user?.id;

    return (
      <Pressable
        style={[styles.memberItem, isCurrentUser && styles.memberItemCurrent]}
        onPress={() => handleMemberPress(item.user_id)}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.user.avatar_url ? (
            <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={Colors.textSecondary} />
            </View>
          )}
          {badge && (
            <View>
              <Text style={styles.roleBadgeText}></Text>
            </View>
          )}
        </View>

        {/* Member Info */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberUsername} numberOfLines={1}>
            {username}
            {isCurrentUser}
          </Text>
          <Text style={styles.memberFullName} numberOfLines={1}>
            {displayName.toUpperCase()}
          </Text>
        </View>

        {/* Friend Button */}
        {!isCurrentUser && renderFriendButton(item.user_id, displayName)}
      </Pressable>
    );
  };

  const renderHeader = () => null;

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.customHeader}>
            <TouchableOpacity style={styles.customBackButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.customHeaderTitle}>Group Members</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <EmptyState
            title="Sign In Required"
            emoji="🔒"
            message="Please sign in to view group members."
            action={{
              label: 'Sign In',
              onPress: () => router.push('/'),
            }}
          />
        </SafeAreaView>
      </>
    );
  }

  // Loading
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.customHeader}>
            <TouchableOpacity style={styles.customBackButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.customHeaderTitle}>Group Members</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <LoadingSpinner fullScreen text="Loading members..." />
        </SafeAreaView>
      </>
    );
  }

  // Error
  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.customHeader}>
            <TouchableOpacity style={styles.customBackButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.customHeaderTitle}>Group Members</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <EmptyState
            title="Unable to Load Members"
            emoji="😕"
            message={error}
            action={{
              label: 'Go Back',
              onPress: () => router.back(),
            }}
          />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.customHeader}>
          <TouchableOpacity style={styles.customBackButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.customHeaderTitle}>Group Members</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No Members"
              emoji="👥"
              message="This group doesn't have any members yet."
            />
          }
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 0,
  },
  memberItemCurrent: {
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadgeText: {
    fontSize: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberUsername: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 4,
  },
  youBadge: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.primary,
  },
  memberFullName: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  followButton: {
    paddingHorizontal: Spacing.lg + 4,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonFollow: {
    backgroundColor: Colors.primary,
  },
  followButtonTextFollow: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.background,
  },
  followButtonFriends: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followButtonTextFriends: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  followButtonSent: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followButtonTextSent: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  customBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerPlaceholder: {
    width: 40,
  },
});
