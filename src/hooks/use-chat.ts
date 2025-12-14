import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, hasValidCredentials } from '../../backend/supabase';
import * as ChatService from '../services/chat-service';
import type { EventGroup, Message, GroupMember } from '../types';

// Timeout for fetch operations
const FETCH_TIMEOUT = 10000; // 10 seconds

// Message status types
export type MessageStatus = 'sending' | 'sent' | 'failed';

// Extended message type with optimistic update support
export interface OptimisticMessage extends Omit<Message, 'id' | 'created_at'> {
  id: string;
  created_at: string;
  status?: MessageStatus;
  isOptimistic?: boolean;
}

// Typing user interface
export interface TypingUser {
  user_id: string;
  user_name: string;
  avatar_url?: string | null;
}

/**
 * Hook for managing group chats with realtime features
 */
export function useGroupChat(groupId: string | undefined, currentUserId?: string) {
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [group, setGroup] = useState<EventGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[CHAT HOOK] Fetching data for group:', groupId);

      const [groupData, messagesData, membersData] = await Promise.all([
        ChatService.getGroupById(groupId),
        ChatService.getGroupMessages(groupId),
        ChatService.getGroupMembers(groupId),
      ]);

      console.log('[CHAT HOOK] Data fetched successfully:', {
        group: groupData?.id,
        messages: messagesData.length,
        members: membersData.length,
      });

      setGroup(groupData);
      setMessages(messagesData.map((msg) => ({ ...msg, status: 'sent' as MessageStatus })));
      setMembers(membersData);
    } catch (err) {
      console.error('[CHAT HOOK] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!groupId || !hasValidCredentials) {
      console.log('[CHAT HOOK] Skipping realtime setup:', {
        groupId: groupId || 'null',
        hasCredentials: hasValidCredentials,
      });
      setLoading(false);
      return;
    }

    console.log('[CHAT HOOK] Setting up realtime for group:', groupId);

    // Initial data fetch
    fetchData();

    // Create channel with presence support
    const channel = supabase.channel(`group:${groupId}`, {
      config: {
        presence: {
          key: currentUserId || 'anonymous',
        },
      },
    });

    channelRef.current = channel;

    // Subscribe to new messages
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          console.log('[CHAT] New message received:', payload.new.id);

          // Skip if this is our optimistic message (already in state)
          setMessages((prev) => {
            const existingOptimistic = prev.find(
              (m) => m.isOptimistic && m.content === payload.new.content
            );
            if (existingOptimistic) {
              // Replace optimistic message with real one
              return prev.map((m) =>
                m.id === existingOptimistic.id
                  ? ({
                      ...payload.new,
                      status: 'sent' as MessageStatus,
                      isOptimistic: false,
                    } as OptimisticMessage)
                  : m
              );
            }
            return prev;
          });

          // Fetch the full message with user info if not optimistic
          try {
            const { data: newMessage } = await supabase
              .from('messages')
              .select(
                `
                *,
                user:profiles!user_id(id, full_name, avatar_url)
              `
              )
              .eq('id', payload.new.id)
              .single();

            if (newMessage) {
              setMessages((prev) => {
                // Check if message already exists (from optimistic update)
                if (prev.some((m) => m.id === newMessage.id)) {
                  return prev;
                }
                return [...prev, { ...newMessage, status: 'sent' as MessageStatus }];
              });
            }
          } catch (err) {
            console.error('[CHAT] Error fetching new message:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          console.log('[CHAT] Message updated:', payload.new.id);
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? { ...msg, ...payload.new } : msg))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          console.log('[CHAT] Message deleted:', payload.old.id);
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('[CHAT] Presence sync:', state);

        // Extract typing users from presence state
        const typing: TypingUser[] = [];
        Object.keys(state).forEach((key) => {
          const presences = state[key];
          presences.forEach((presence: any) => {
            if (presence.typing && presence.user_id !== currentUserId) {
              typing.push({
                user_id: presence.user_id,
                user_name: presence.user_name,
                avatar_url: presence.avatar_url,
              });
            }
          });
        });

        setTypingUsers(typing);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[CHAT] User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[CHAT] User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        console.log('[CHAT] Channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');

        if (status === 'SUBSCRIBED' && currentUserId) {
          // Track initial presence (not typing)
          await channel.track({
            user_id: currentUserId,
            typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Cleanup
    return () => {
      console.log('[CHAT] Cleaning up realtime for group:', groupId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [groupId, currentUserId, fetchData]);

  // Send a message with optimistic update
  const sendMessage = useCallback(
    async (content: string, userId: string, userName: string, avatarUrl?: string | null) => {
      if (!groupId || !content.trim()) return;

      const trimmedContent = content.trim();
      const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;

      // Create optimistic message
      const optimisticMessage: OptimisticMessage = {
        id: optimisticId,
        group_id: groupId,
        user_id: userId,
        content: trimmedContent,
        message_type: 'text',
        is_deleted: false,
        created_at: new Date().toISOString(),
        user: {
          id: userId,
          full_name: userName,
          avatar_url: avatarUrl || null,
        },
        status: 'sending',
        isOptimistic: true,
      };

      try {
        setSending(true);

        // Add optimistic message immediately
        setMessages((prev) => [...prev, optimisticMessage]);

        // Send to server
        const sentMessage = await ChatService.sendGroupMessage(
          { group_id: groupId, content: trimmedContent },
          userId
        );

        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticId
              ? { ...sentMessage, status: 'sent' as MessageStatus, isOptimistic: false }
              : msg
          )
        );

        // Stop typing indicator
        if (channelRef.current && currentUserId) {
          await channelRef.current.track({
            user_id: currentUserId,
            typing: false,
            online_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('[CHAT] Error sending message:', err);

        // Mark optimistic message as failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticId ? { ...msg, status: 'failed' as MessageStatus } : msg
          )
        );

        setError(err instanceof Error ? err.message : 'Failed to send message');
        throw err;
      } finally {
        setSending(false);
      }
    },
    [groupId, currentUserId]
  );

  // Retry failed message
  const retryMessage = useCallback(
    async (
      failedMessageId: string,
      userId: string,
      userName: string,
      avatarUrl?: string | null
    ) => {
      const failedMessage = messages.find((m) => m.id === failedMessageId);
      if (!failedMessage) return;

      // Remove failed message
      setMessages((prev) => prev.filter((m) => m.id !== failedMessageId));

      // Resend
      await sendMessage(failedMessage.content, userId, userName, avatarUrl);
    },
    [messages, sendMessage]
  );

  // Stop typing indicator
  const stopTyping = useCallback(async () => {
    if (!channelRef.current || !currentUserId) return;

    try {
      await channelRef.current.track({
        user_id: currentUserId,
        typing: false,
        online_at: new Date().toISOString(),
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (err) {
      console.error('[CHAT] Error stopping typing:', err);
    }
  }, [currentUserId]);

  // Start typing indicator
  const startTyping = useCallback(
    async (userName: string, avatarUrl?: string | null) => {
      if (!channelRef.current || !currentUserId) return;

      try {
        await channelRef.current.track({
          user_id: currentUserId,
          user_name: userName,
          avatar_url: avatarUrl,
          typing: true,
          online_at: new Date().toISOString(),
        });

        // Auto-stop typing after 3 seconds
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          stopTyping();
        }, 3000) as any;
      } catch (err) {
        console.error('[CHAT] Error tracking typing:', err);
      }
    },
    [currentUserId, stopTyping]
  );

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!groupId || messages.length === 0) return;

    try {
      const oldestMessage = messages[0];
      const olderMessages = await ChatService.getGroupMessages(
        groupId,
        50,
        oldestMessage.created_at
      );
      setMessages((prev) => [
        ...olderMessages.map((msg) => ({ ...msg, status: 'sent' as MessageStatus })),
        ...prev,
      ]);
    } catch (err) {
      console.error('[CHAT] Error loading more messages:', err);
    }
  }, [groupId, messages]);

  return {
    group,
    messages,
    members,
    loading,
    error,
    sending,
    typingUsers,
    isConnected,
    sendMessage,
    retryMessage,
    startTyping,
    stopTyping,
    loadMore,
    refresh: fetchData,
  };
}

/**
 * Hook for user's event groups
 */
export function useUserGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<EventGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!userId || !hasValidCredentials) {
      setLoading(false);
      setGroups([]);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    try {
      setLoading(true);
      setError(null);

      const fetchPromise = ChatService.getUserGroups(userId);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timeout')), FETCH_TIMEOUT);
      });

      const data = await Promise.race([fetchPromise, timeoutPromise]);
      setGroups(data);
    } catch (err) {
      // Don't show timeout as an error - just show empty state
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch groups';
      if (errorMessage.includes('Request timeout')) {
        console.warn('[CHAT] Groups fetch timed out - showing empty state');
        setError(null);
        setGroups([]);
      } else {
        console.error('[CHAT] Error fetching groups:', err);
        setError(errorMessage);
        setGroups([]);
      }
    } finally {
      setLoading(false);
      if (timeoutId!) {
        clearTimeout(timeoutId);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    refresh: fetchGroups,
  };
}
