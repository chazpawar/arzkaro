import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MessageBubble from '../../../src/components/chat/message-bubble';
import ChatInput from '../../../src/components/chat/chat-input';
import LoadingSpinner from '../../../src/components/ui/loading-spinner';
import Button from '../../../src/components/ui/button';
import { Colors } from '../../../src/constants/colors';
import { Spacing, Typography, BorderRadius } from '../../../src/constants/styles';
import { useAuth } from '../../../src/contexts/auth-context';
import { useGroupChat } from '../../../src/hooks/use-chat';
import * as ChatService from '../../../src/services/chat-service';
import type { Message } from '../../../src/types';

export default function EventChatScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [groupId, setGroupId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);

  // Load group ID from event
  useEffect(() => {
    async function loadGroup() {
      if (!eventId) return;

      try {
        setLoadingGroup(true);
        const group = await ChatService.getGroupByEventId(eventId);

        if (group) {
          setGroupId(group.id);

          // Check membership
          if (user?.id) {
            const memberStatus = await ChatService.isGroupMember(group.id, user.id);
            setIsMember(memberStatus);
          }
        }
      } catch (_error) {
        console.error('Failed to load group:', _error);
      } finally {
        setLoadingGroup(false);
      }
    }

    loadGroup();
  }, [eventId, user?.id]);

  const { group, messages, members, loading, sending, sendMessage } = useGroupChat(
    groupId || undefined
  );

  const handleSend = useCallback(
    async (content: string) => {
      if (!user?.id) return;
      await sendMessage(content, user.id);

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [user?.id, sendMessage]
  );

  const handleMemberPress = useCallback(
    (userId: string) => {
      router.push(`/users/${userId}`);
    },
    [router]
  );

  const _handleJoinGroup = useCallback(async () => {
    if (!groupId || !user?.id) return;

    try {
      await ChatService.joinGroup(groupId, user.id);
      setIsMember(true);
    } catch (_error) {
      Alert.alert('Error', 'Failed to join the group chat.');
    }
  }, [groupId, user?.id]);

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isOwn = item.user_id === user?.id;
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const showAvatar = !prevMessage || prevMessage.user_id !== item.user_id;

      return (
        <MessageBubble
          message={item}
          isOwn={isOwn}
          showAvatar={showAvatar}
          onAvatarPress={handleMemberPress}
        />
      );
    },
    [user?.id, messages, handleMemberPress]
  );

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔒</Text>
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>Please sign in to access the group chat.</Text>
          <Button title="Sign In" onPress={() => router.push('/')} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  // Loading group info
  if (loadingGroup) {
    return <LoadingSpinner fullScreen text="Loading chat..." />;
  }

  // No group found
  if (!groupId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>Chat Not Available</Text>
          <Text style={styles.emptyText}>The group chat for this event is not available yet.</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  // Not a member
  if (isMember === false) {
    return (
      <>
        <Stack.Screen
          options={{
            title: group?.name || 'Group Chat',
            headerBackTitle: 'Event',
          }}
        />
        <SafeAreaView style={styles.container}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎟️</Text>
            <Text style={styles.emptyTitle}>Join to Chat</Text>
            <Text style={styles.emptyText}>
              Book a ticket for this event to join the group chat and connect with other attendees.
            </Text>
            <Button
              title="Book Tickets"
              onPress={() => router.push(`/events/${eventId}/book`)}
              variant="primary"
              style={{ marginBottom: Spacing.md }}
            />
            <Button title="Go Back" onPress={() => router.back()} variant="ghost" />
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Loading chat
  if (loading) {
    return <LoadingSpinner fullScreen text="Loading messages..." />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: group?.name || 'Group Chat',
          headerBackTitle: 'Event',
          headerRight: () => (
            <Pressable
              onPress={() => router.push(`/events/${eventId}/members`)}
              style={styles.headerButton}
            >
              <Ionicons name="people" size={24} color={Colors.primary} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Group Info Banner */}
          {group?.event && (
            <Pressable style={styles.groupBanner} onPress={() => router.push(`/events/${eventId}`)}>
              {group.event.cover_image_url ? (
                <Image source={{ uri: group.event.cover_image_url }} style={styles.eventImage} />
              ) : (
                <View style={styles.eventImagePlaceholder}>
                  <Text>🎉</Text>
                </View>
              )}
              <View style={styles.groupBannerContent}>
                <Text style={styles.groupBannerTitle} numberOfLines={1}>
                  {group.event.title}
                </Text>
                <Text style={styles.groupBannerMembers}>
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            </Pressable>
          )}

          {/* Messages List */}
          {messages.length === 0 ? (
            <View style={styles.emptyMessagesContainer}>
              <Text style={styles.emptyMessagesIcon}>👋</Text>
              <Text style={styles.emptyMessagesText}>Be the first to say hello!</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
              inverted={false}
            />
          )}

          {/* Chat Input */}
          <ChatInput onSend={handleSend} placeholder="Message the group..." sending={sending} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  groupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  eventImage: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
  },
  eventImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupBannerContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  groupBannerTitle: {
    ...Typography.bodySmallMedium,
    color: Colors.text,
  },
  groupBannerMembers: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  messagesList: {
    paddingVertical: Spacing.md,
  },
  dateHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  dateHeaderText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyMessagesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessagesIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyMessagesText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
