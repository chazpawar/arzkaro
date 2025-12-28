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
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MessageBubble from '../../../src/components/chat/message-bubble';
import ChatInput from '../../../src/components/chat/chat-input';
import LoadingSpinner from '../../../src/components/ui/loading-spinner';
import EmptyState from '../../../src/components/ui/empty-state';
import { Colors } from '../../../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../../src/constants/Styles';
import { useAuth } from '../../../src/contexts/auth-context';
import { useGroupChat } from '../../../src/hooks/use-chat';
import * as ChatService from '../../../src/services/chat-service';

export default function EventChatScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, viewAsUser } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [groupId, setGroupId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);

  // Load group ID from event
  useEffect(() => {
    async function loadGroup() {
      if (!eventId) {
        console.log('[CHAT SCREEN] No eventId provided');
        setLoadingGroup(false);
        return;
      }

      console.log('[CHAT SCREEN] Loading group for event:', eventId);

      try {
        setLoadingGroup(true);
        const group = await ChatService.getGroupByEventId(eventId);

        console.log('[CHAT SCREEN] Group found:', group ? group.id : 'none');

        if (group) {
          setGroupId(group.id);

          // Check membership
          if (user?.id) {
            console.log('[CHAT SCREEN] Checking membership for user:', user.id);
            const memberStatus = await ChatService.isGroupMember(group.id, user.id);
            console.log('[CHAT SCREEN] Member status:', memberStatus);
            setIsMember(memberStatus);
          } else {
            setIsMember(false);
          }
        } else {
          console.log('[CHAT SCREEN] No group found for event');
          setIsMember(false);
        }
      } catch (error) {
        console.error('[CHAT SCREEN] Error loading group:', error);
        setIsMember(false);
      } finally {
        setLoadingGroup(false);
      }
    }

    loadGroup();
  }, [eventId, user?.id]);

  const {
    group,
    messages,
    members,
    loading,
    sending,
    typingUsers,
    isConnected,
    sendMessage,
    retryMessage,
    startTyping,
    stopTyping,
  } = useGroupChat(groupId || undefined, user?.id);

  // Mark messages as read when user views the chat
  useEffect(() => {
    if (groupId && user?.id && isMember && messages.length > 0) {
      // Mark as read after a short delay (user has time to see the messages)
      const timer = setTimeout(() => {
        ChatService.markGroupAsRead(groupId, user.id).catch((err) => {
          console.error('[CHAT SCREEN] Failed to mark as read:', err);
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [groupId, user?.id, isMember, messages.length]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!user?.id || !user?.email) return;

      const userName = user.email.split('@')[0] || 'User';
      await sendMessage(content, user.id, userName, user.user_metadata?.avatar_url);

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [user, sendMessage]
  );

  const handleTyping = useCallback(() => {
    if (!user?.email) return;
    const userName = user.email.split('@')[0] || 'User';
    startTyping(userName, user.user_metadata?.avatar_url);
  }, [user, startTyping]);

  const handleStopTyping = useCallback(() => {
    stopTyping();
  }, [stopTyping]);

  const handleRetry = useCallback(
    (messageId: string) => {
      if (!user?.id || !user?.email) return;
      const userName = user.email.split('@')[0] || 'User';
      retryMessage(messageId, user.id, userName, user.user_metadata?.avatar_url);
    },
    [user, retryMessage]
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
    ({ item, index }: { item: any; index: number }) => {
      const isOwn = item.user_id === user?.id;

      // Calculate for Standard Top-to-Bottom list (Index 0 = Oldest)
      const currentMsg = messages[index];
      const previousMsg = index > 0 ? messages[index - 1] : null; // Message "above" visually
      const nextMsg = index < messages.length - 1 ? messages[index + 1] : null; // Message "below" visually

      const currentDate = new Date(currentMsg.created_at);
      const previousDate = previousMsg ? new Date(previousMsg.created_at) : null;

      const showDate = !previousDate || currentDate.toDateString() !== previousDate.toDateString();

      const isLastMessageFromBlock = !nextMsg || nextMsg.user_id !== currentMsg.user_id;
      const showAvatarProp = !isOwn && isLastMessageFromBlock;

      let dateLabel = '';
      if (showDate) {
        const now = new Date();
        const isToday = now.toDateString() === currentDate.toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = yesterday.toDateString() === currentDate.toDateString();

        if (isToday) dateLabel = 'Today';
        else if (isYesterday) dateLabel = 'Yesterday';
        else
          dateLabel = currentDate.toLocaleDateString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
      }

      return (
        <View>
          {showDate && (
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>{dateLabel}</Text>
            </View>
          )}

          <MessageBubble
            message={item}
            isOwn={isOwn}
            showAvatar={showAvatarProp}
            onAvatarPress={handleMemberPress}
          />

          {isOwn && item.status && (
            <View style={styles.messageStatus}>
              {item.status === 'sending' && (
                <Text style={styles.messageStatusText}>Sending...</Text>
              )}
              {item.status === 'sent' && (
                <Ionicons name="checkmark" size={12} color={Colors.textTertiary} />
              )}
              {item.status === 'failed' && (
                <Pressable onPress={() => handleRetry(item.id)} style={styles.retryButton}>
                  <Ionicons name="alert-circle" size={14} color={Colors.error} />
                  <Text style={styles.retryText}>Tap to retry</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      );
    },
    [user?.id, messages, handleMemberPress, handleRetry]
  );

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Sign In Required"
          emoji="🔒"
          message="Please sign in to access the group chat."
          action={{
            label: 'Sign In',
            onPress: () => router.push('/'),
          }}
        />
      </SafeAreaView>
    );
  }

  // Loading group info
  if (loadingGroup) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.customHeader}>
            <TouchableOpacity style={styles.customBackButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.customHeaderTitle}>Group Chat</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <LoadingSpinner fullScreen text="Loading chat..." />
        </SafeAreaView>
      </>
    );
  }

  // No group found
  if (!groupId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.customHeader}>
            <TouchableOpacity style={styles.customBackButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.customHeaderTitle}>Group Chat</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <EmptyState
            title="Chat Not Available"
            emoji="💬"
            message="The group chat for this event hasn't been created yet. This event may not be published or may not have a chat group."
            action={{
              label: 'Go Back',
              onPress: () => router.back(),
            }}
          />
        </SafeAreaView>
      </>
    );
  }

  // Not a member
  if (isMember === false) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.customHeader}>
            <TouchableOpacity style={styles.customBackButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.customHeaderTitle}>{group?.name || 'Group Chat'}</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <EmptyState
            title="Join to Chat"
            emoji="🎟️"
            message="Book a ticket for this event to join the group chat and connect with other attendees."
            action={{
              label: 'Book Tickets',
              onPress: () => router.push(`/events/${eventId}/book`),
            }}
          />
        </SafeAreaView>
      </>
    );
  }

  // Loading chat
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.customHeader}>
            <TouchableOpacity style={styles.customBackButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.customHeaderTitle}>{group?.name || 'Group Chat'}</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <LoadingSpinner fullScreen text="Loading messages..." />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.customHeader}>
          <TouchableOpacity style={styles.customBackButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.customHeaderTitle}>{group?.name || 'Group Chat'}</Text>
          <TouchableOpacity
            onPress={() => router.push(`/events/${eventId}/members`)}
            style={styles.customBackButton}
          >
            <Ionicons name="people" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

          {/* Connection Status */}
          {!isConnected && (
            <View style={styles.connectionBanner}>
              <Ionicons name="warning" size={16} color={Colors.warning} />
              <Text style={styles.connectionText}>Connecting...</Text>
            </View>
          )}

          {/* Messages List */}
          {messages.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <EmptyState
                title="No Messages Yet"
                emoji="👋"
                message="Be the first to say hello! Start a conversation with other event attendees."
              />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              onContentSizeChange={() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
              inverted={false}
            />
          )}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>
                {typingUsers.length === 1
                  ? `${typingUsers[0].user_name} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </Text>
            </View>
          )}

          {/* Chat Input - Disabled when admin is viewing as user */}
          {viewAsUser ? (
            <View style={styles.disabledInputContainer}>
              <Ionicons name="lock-closed-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.disabledInputText}>
                Chat input disabled in &quot;View as User&quot; mode
              </Text>
            </View>
          ) : (
            <ChatInput
              onSend={handleSend}
              placeholder="Message the group..."
              sending={sending}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
            />
          )}
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
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.xs,
    backgroundColor: Colors.warningLight || '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning,
    justifyContent: 'center',
  },
  connectionText: {
    ...Typography.caption,
    color: Colors.warning,
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
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    gap: Spacing.xs,
  },
  messageStatusText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 10,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  retryText: {
    ...Typography.caption,
    color: Colors.error,
    fontSize: 10,
  },
  typingIndicator: {
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
  },
  typingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 100, // Account for input height
  },
  dateHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  dateHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  disabledInputText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
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
