import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MessageBubble from '../../src/components/chat/message-bubble';
import ChatInput from '../../src/components/chat/chat-input';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import EmptyState from '../../src/components/ui/empty-state';
import { Colors } from '../../src/constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../src/constants/Styles';
import { useAuth } from '../../src/contexts/auth-context';
import * as DMService from '../../src/services/dm-service';
import type { DMConversation, DMMessage } from '../../src/types/chat.types';

export default function DMChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, viewAsUser } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [conversation, setConversation] = useState<DMConversation | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Load conversation details
  useEffect(() => {
    async function loadConversation() {
      if (!conversationId || !user?.id) {
        console.log('[DM SCREEN] Missing conversationId or userId');
        setLoading(false);
        return;
      }

      console.log('[DM SCREEN] Loading conversation:', conversationId);

      try {
        setLoading(true);
        const conv = await DMService.getConversationById(conversationId, user.id);
        console.log('[DM SCREEN] Conversation loaded:', conv);
        setConversation(conv);
      } catch (error) {
        console.error('[DM SCREEN] Error loading conversation:', error);
        Alert.alert('Error', 'Failed to load conversation. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadConversation();
  }, [conversationId, user?.id]);

  // Load messages
  useEffect(() => {
    async function loadMessages() {
      if (!conversationId) return;

      console.log('[DM SCREEN] Loading messages for conversation:', conversationId);

      try {
        const msgs = await DMService.getMessages(conversationId, 50);
        console.log('[DM SCREEN] Messages loaded:', msgs.length);
        setMessages(msgs);
        setIsConnected(true);
      } catch (error) {
        console.error('[DM SCREEN] Error loading messages:', error);
      }
    }

    loadMessages();
  }, [conversationId]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return;

    console.log('[DM SCREEN] Setting up real-time subscription');

    const channel = DMService.subscribeToMessages(conversationId, (message) => {
      console.log('[DM SCREEN] New message received:', message);
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      // Scroll to bottom for new messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      console.log('[DM SCREEN] Cleaning up real-time subscription');
      channel?.unsubscribe();
    };
  }, [conversationId]);

  // Mark messages as read when user views the chat
  useEffect(() => {
    if (conversationId && user?.id && messages.length > 0) {
      // Mark as read after a short delay (user has time to see the messages)
      const timer = setTimeout(() => {
        DMService.markMessagesAsRead(conversationId, user.id).catch((err) => {
          console.error('[DM SCREEN] Failed to mark as read:', err);
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [conversationId, user?.id, messages.length]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!user?.id || !conversationId) return;

      try {
        setSending(true);

        const message: any = {
          conversation_id: conversationId,
          content,
          message_type: 'text',
        };

        console.log('[DM SCREEN] Sending message:', message);

        const sentMessage = await DMService.sendMessage(message, user.id);
        console.log('[DM SCREEN] Message sent successfully:', sentMessage);

        // Add to local state immediately for instant feedback
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMessage.id)) {
            return prev;
          }
          return [...prev, sentMessage];
        });

        // Scroll to bottom after sending
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error('[DM SCREEN] Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
      } finally {
        setSending(false);
      }
    },
    [user?.id, conversationId]
  );

  const handleViewProfile = useCallback(() => {
    if (!conversation?.other_user) return;
    router.push(`/profile?userId=${conversation.other_user.id}`);
  }, [conversation, router]);

  const renderMessage = useCallback(
    ({ item, index }: { item: DMMessage; index: number }) => {
      const isOwn = item.sender_id === user?.id;

      // Calculate visual grouping
      // Note: messages are usually ordered by time (oldest first) in the array
      // if using standard FlatList, or newest first if inverted.
      // Based on service: (data as DMMessage[]).reverse() -> Oldest First (Index 0)

      const currentMsg = messages[index];
      const previousMsg = index > 0 ? messages[index - 1] : null;
      const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

      const currentDate = new Date(currentMsg.created_at);
      const previousDate = previousMsg ? new Date(previousMsg.created_at) : null;

      // Show date header if it's the first message or date changed
      const showDate = !previousDate || currentDate.toDateString() !== previousDate.toDateString();

      // Show avatar if it's the last message from the sender in this cluster
      const isLastFromUser = !nextMsg || nextMsg.sender_id !== item.sender_id;
      const showAvatar = !isOwn && isLastFromUser;

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

        // Add time
        dateLabel += ` ${currentDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
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
            showAvatar={showAvatar}
            onAvatarPress={() => !isOwn && handleViewProfile()}
          />
        </View>
      );
    },
    [user, messages, handleViewProfile]
  );

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Sign In Required"
          emoji="🔒"
          message="Please sign in to access direct messages."
          action={{
            label: 'Sign In',
            onPress: () => router.push('/'),
          }}
        />
      </SafeAreaView>
    );
  }

  // Loading conversation
  if (loading) {
    return <LoadingSpinner fullScreen text="Loading conversation..." />;
  }

  // No conversation found
  if (!conversation) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Direct Message',
            headerBackTitle: 'Back',
          }}
        />
        <SafeAreaView style={styles.container}>
          <EmptyState
            title="Conversation Not Found"
            emoji="💬"
            message="This conversation doesn't exist or you don't have access to it."
            action={{
              label: 'Go Back',
              onPress: () => router.back(),
            }}
          />
        </SafeAreaView>
      </>
    );
  }

  const otherUserName =
    conversation.other_user?.full_name || conversation.other_user?.email?.split('@')[0] || 'User';

  return (
    <>
      <Stack.Screen
        options={{
          title: otherUserName,
          headerBackTitle: 'Back',
          headerRight: () => (
            <Pressable onPress={handleViewProfile} style={styles.headerButton}>
              <Ionicons name="person-circle-outline" size={24} color={Colors.primary} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Connection Status */}
          {!isConnected && (
            <View style={styles.connectionBanner}>
              <Ionicons name="warning" size={16} color={Colors.warning} />
              <Text style={styles.connectionText}>Connecting...</Text>
            </View>
          )}

          {/* Messages List */}
          {messages.length === 0 ? (
            <EmptyState
              title="No Messages Yet"
              emoji="👋"
              message={`Start a conversation with ${otherUserName}!`}
            />
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
              placeholder={`Message ${otherUserName}...`}
              sending={sending}
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
  messagesList: {
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  dateHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
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
});
