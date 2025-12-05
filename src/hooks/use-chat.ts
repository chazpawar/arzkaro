import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, hasValidCredentials } from '../../backend/supabase';
import * as ChatService from '../services/chat-service';
import type { EventGroup, Message, GroupMember } from '../types';

// Timeout for fetch operations (3 seconds)
const FETCH_TIMEOUT = 3000; // Increased to 10 seconds

/**
 * Hook for managing group chats
 */
export function useGroupChat(groupId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [group, setGroup] = useState<EventGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const subscriptionRef = useRef<any>(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);

      const [groupData, messagesData, membersData] = await Promise.all([
        ChatService.getGroupById(groupId),
        ChatService.getGroupMessages(groupId),
        ChatService.getGroupMembers(groupId),
      ]);

      setGroup(groupData);
      setMessages(messagesData);
      setMembers(membersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!groupId) return;

    fetchData();

    // Subscribe to new messages
    subscriptionRef.current = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Fetch the full message with user info
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
            setMessages((prev) => [...prev, newMessage as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [groupId, fetchData]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string, userId: string) => {
      if (!groupId || !content.trim()) return;

      try {
        setSending(true);
        await ChatService.sendGroupMessage({ group_id: groupId, content }, userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        throw err;
      } finally {
        setSending(false);
      }
    },
    [groupId]
  );

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!groupId || messages.length === 0) return;

    const oldestMessage = messages[0];
    const olderMessages = await ChatService.getGroupMessages(groupId, 50, oldestMessage.created_at);
    setMessages((prev) => [...olderMessages, ...prev]);
  }, [groupId, messages]);

  return {
    group,
    messages,
    members,
    loading,
    error,
    sending,
    sendMessage,
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
        console.warn('Groups fetch timed out - showing empty state');
        setError(null);
        setGroups([]);
      } else {
        console.error('Error fetching groups:', err);
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
