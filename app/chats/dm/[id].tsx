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
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MessageBubble from '../../../src/components/chat/message-bubble';
import ChatInput from '../../../src/components/chat/chat-input';
import LoadingSpinner from '../../../src/components/ui/loading-spinner';
import Button from '../../../src/components/ui/button';
import { Colors } from '../../../src/constants/colors';
import { Spacing, Typography } from '../../../src/constants/styles';
import { useAuth } from '../../../src/contexts/auth-context';
import { useDMChat } from '../../../src/hooks/use-chat';
import { supabase } from '../../../backend/supabase';
import type { DMMessage } from '../../../src/types';

export default function DMChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [otherUser, setOtherUser] = useState<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Load conversation info to get other user
  useEffect(() => {
    async function loadConversationInfo() {
      if (!conversationId || !user?.id) return;

      try {
        setLoadingUser(true);
        const { data, error } = await supabase
          .from('dm_conversations')
          .select(
            `
            user_id_1,
            user_id_2,
            user1:profiles!user_id_1(id, full_name, avatar_url),
            user2:profiles!user_id_2(id, full_name, avatar_url)
          `
          )
          .eq('id', conversationId)
          .single();

        if (data && !error) {
          // Supabase returns arrays for foreign key relations, so we need to access [0]
          const rawData = data as {
            user_id_1: string;
            user_id_2: string;
            user1: { id: string; full_name: string | null; avatar_url: string | null }[];
            user2: { id: string; full_name: string | null; avatar_url: string | null }[];
          };

          // Get the other user's profile
          const other = rawData.user1[0]?.id === user.id ? rawData.user2[0] : rawData.user1[0];
          setOtherUser(other);
        }
      } catch (error) {
        console.error('Failed to load conversation:', error);
      } finally {
        setLoadingUser(false);
      }
    }

    loadConversationInfo();
  }, [conversationId, user?.id]);

  const { messages, loading, error, sending, sendMessage } = useDMChat(conversationId, user?.id);

  const handleSend = useCallback(
    async (content: string) => {
      await sendMessage(content);

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [sendMessage]
  );

  const renderMessage = useCallback(
    ({ item, index }: { item: DMMessage; index: number }) => {
      const isOwn = item.sender_id === user?.id;
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const showAvatar = !prevMessage || prevMessage.sender_id !== item.sender_id;

      return <MessageBubble message={item} isOwn={isOwn} showAvatar={showAvatar} />;
    },
    [user?.id, messages]
  );

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔒</Text>
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>Please sign in to access your messages.</Text>
          <Button title="Sign In" onPress={() => router.push('/')} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  // Loading
  if (loading || loadingUser) {
    return <LoadingSpinner fullScreen text="Loading conversation..." />;
  }

  // Error
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>😕</Text>
          <Text style={styles.emptyTitle}>Something Went Wrong</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  const userName = otherUser?.full_name || 'Unknown User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <Stack.Screen
        options={{
          title: userName,
          headerBackTitle: 'Chats',
          headerRight: () => (
            <Pressable
              onPress={() => otherUser?.id && router.push(`/users/${otherUser.id}`)}
              style={styles.headerButton}
            >
              {otherUser?.avatar_url ? (
                <Image source={{ uri: otherUser.avatar_url }} style={styles.headerAvatar} />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <Text style={styles.headerAvatarText}>{userInitial}</Text>
                </View>
              )}
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
          {/* Messages List */}
          {messages.length === 0 ? (
            <View style={styles.emptyMessagesContainer}>
              <View style={styles.emptyAvatar}>
                {otherUser?.avatar_url ? (
                  <Image source={{ uri: otherUser.avatar_url }} style={styles.emptyAvatarImage} />
                ) : (
                  <Text style={styles.emptyAvatarText}>{userInitial}</Text>
                )}
              </View>
              <Text style={styles.emptyUserName}>{userName}</Text>
              <Text style={styles.emptyMessagesText}>
                Start a conversation with {otherUser?.full_name?.split(' ')[0] || 'them'}!
              </Text>
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
          <ChatInput
            onSend={handleSend}
            placeholder={`Message ${otherUser?.full_name?.split(' ')[0] || 'them'}...`}
            sending={sending}
          />
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
    padding: Spacing.xs,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    ...Typography.bodySmallMedium,
    color: Colors.textInverse,
  },
  messagesList: {
    paddingVertical: Spacing.md,
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
    paddingHorizontal: Spacing.xl,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  emptyAvatarText: {
    ...Typography.h1,
    color: Colors.textInverse,
  },
  emptyUserName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyMessagesText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
