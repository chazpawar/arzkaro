import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../src/components/ui/loading-spinner';
import EmptyState from '../../../src/components/ui/empty-state';
import { Colors } from '../../../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../../src/constants/Styles';
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
    router.push(`/profile/${userId}`);
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
          <View style={styles.friendButton}>
            <LoadingSpinner size="small" />
          </View>
        );

      case 'friends':
        return (
          <View style={[styles.friendButton, styles.friendButtonFriends]}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.friendButtonTextFriends}>Friends</Text>
          </View>
        );

      case 'sent':
        return (
          <Pressable
            style={[styles.friendButton, styles.friendButtonSent]}
            onPress={(e) => {
              e.stopPropagation();
              handleCancelRequest(memberId);
            }}
          >
            <Ionicons name="hourglass-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.friendButtonTextSent}>Pending</Text>
          </Pressable>
        );

      case 'received':
        return (
          <Pressable
            style={[styles.friendButton, styles.friendButtonAccept]}
            onPress={(e) => {
              e.stopPropagation();
              handleAcceptRequest(memberId, displayName);
            }}
          >
            <Ionicons name="person-add" size={18} color={Colors.background} />
            <Text style={styles.friendButtonTextAccept}>Accept</Text>
          </Pressable>
        );

      case 'none':
      default:
        return (
          <Pressable
            style={[styles.friendButton, styles.friendButtonAdd]}
            onPress={(e) => {
              e.stopPropagation();
              handleAddFriend(memberId, displayName);
            }}
          >
            <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
            <Text style={styles.friendButtonTextAdd}>Add Friend</Text>
          </Pressable>
        );
    }
  };

  const renderMember = ({ item }: { item: Member }) => {
    if (!item.user) return null;

    const badge = getRoleBadge(item.role);
    const displayName = item.user.full_name || item.user.email.split('@')[0] || 'User';
    const isCurrentUser = item.user_id === user?.id;

    return (
      <View style={[styles.memberItem, isCurrentUser && styles.memberItemCurrent]}>
        <Pressable style={styles.memberPressable} onPress={() => handleMemberPress(item.user_id)}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {item.user.avatar_url ? (
              <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {badge && (
              <View style={[styles.roleBadge, { backgroundColor: badge.color }]}>
                <Text style={styles.roleBadgeText}>{badge.icon}</Text>
              </View>
            )}
          </View>

          {/* Member Info */}
          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              <Text style={styles.memberName} numberOfLines={1}>
                {displayName}
                {isCurrentUser && <Text style={styles.youText}> (You)</Text>}
              </Text>
            </View>
            {badge && <Text style={styles.memberRole}>{badge.label}</Text>}
            <Text style={styles.memberJoined}>
              Joined{' '}
              {new Date(item.joined_at).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          {/* Arrow */}
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </Pressable>

        {/* Friend Button */}
        {renderFriendButton(item.user_id, displayName)}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <Ionicons name="people" size={32} color={Colors.primary} />
      </View>
      <Text style={styles.headerTitle}>Group Members</Text>
      <Text style={styles.headerSubtitle}>
        {members.length} {members.length === 1 ? 'member' : 'members'} in this group
      </Text>
    </View>
  );

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
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
    );
  }

  // Loading
  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Group Members',
            headerBackTitle: 'Chat',
          }}
        />
        <LoadingSpinner fullScreen text="Loading members..." />
      </>
    );
  }

  // Error
  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Group Members',
            headerBackTitle: 'Chat',
          }}
        />
        <SafeAreaView style={styles.container}>
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
      <Stack.Screen
        options={{
          title: groupName || 'Group Members',
          headerBackTitle: 'Chat',
        }}
      />
      <SafeAreaView style={styles.container}>
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
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  memberItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  memberItemCurrent: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  memberPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
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
  roleBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  roleBadgeText: {
    fontSize: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  memberName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
  },
  youText: {
    color: Colors.primary,
  },
  memberRole: {
    ...Typography.caption,
    color: Colors.primary,
    marginBottom: 2,
  },
  memberJoined: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    justifyContent: 'center',
  },
  friendButtonAdd: {
    backgroundColor: Colors.primarySoft,
  },
  friendButtonTextAdd: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  friendButtonFriends: {
    backgroundColor: Colors.successLight,
  },
  friendButtonTextFriends: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '600',
  },
  friendButtonSent: {
    backgroundColor: Colors.surfaceSecondary,
  },
  friendButtonTextSent: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  friendButtonAccept: {
    backgroundColor: Colors.success,
  },
  friendButtonTextAccept: {
    ...Typography.caption,
    color: Colors.background,
    fontWeight: '600',
  },
});
