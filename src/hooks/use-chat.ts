import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, hasValidCredentials } from '../../backend/supabase';
import * as ChatService from '../services/chat-service';
import type {
  EventGroup,
  Message,
  GroupMember,
  FriendRequest,
  Friendship,
  DMConversation,
  DMMessage,
} from '../types';

// Timeout for fetch operations (3 seconds)
const FETCH_TIMEOUT = 3000;

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

    let timeoutId: NodeJS.Timeout;
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
      console.error('Error fetching groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
      setGroups([]);
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

/**
 * Hook for friend requests
 */
export function useFriendRequests(userId: string | undefined) {
  const [received, setReceived] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setReceived([]);
      setSent([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [receivedData, sentData] = await Promise.all([
        ChatService.getPendingFriendRequests(userId),
        ChatService.getSentFriendRequests(userId),
      ]);

      setReceived(receivedData);
      setSent(sentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch friend requests');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const sendRequest = useCallback(
    async (receiverId: string) => {
      if (!userId) return;
      await ChatService.sendFriendRequest(userId, receiverId);
      await fetchRequests();
    },
    [userId, fetchRequests]
  );

  const acceptRequest = useCallback(
    async (requestId: string) => {
      await ChatService.acceptFriendRequest(requestId);
      await fetchRequests();
    },
    [fetchRequests]
  );

  const rejectRequest = useCallback(
    async (requestId: string) => {
      await ChatService.rejectFriendRequest(requestId);
      await fetchRequests();
    },
    [fetchRequests]
  );

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    received,
    sent,
    loading,
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    refresh: fetchRequests,
  };
}

/**
 * Hook for friends list
 */
export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<(Friendship & { friend: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setFriends([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await ChatService.getFriends(userId);
      setFriends(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const removeFriend = useCallback(
    async (friendId: string) => {
      if (!userId) return;
      await ChatService.removeFriend(userId, friendId);
      await fetchFriends();
    },
    [userId, fetchFriends]
  );

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return {
    friends,
    loading,
    error,
    removeFriend,
    refresh: fetchFriends,
  };
}

/**
 * Hook for DM conversations
 */
export function useDMConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!userId || !hasValidCredentials) {
      setLoading(false);
      setConversations([]);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    try {
      setLoading(true);
      setError(null);

      const fetchPromise = ChatService.getDMConversations(userId);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timeout')), FETCH_TIMEOUT);
      });

      const data = await Promise.race([fetchPromise, timeoutPromise]);
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
      setConversations([]);
    } finally {
      setLoading(false);
      if (timeoutId!) {
        clearTimeout(timeoutId);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refresh: fetchConversations,
  };
}

/**
 * Hook for a single DM conversation
 */
export function useDMChat(conversationId: string | undefined, currentUserId: string | undefined) {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const subscriptionRef = useRef<any>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await ChatService.getDMMessages(conversationId);
      setMessages(data);

      // Mark messages as read
      if (currentUserId) {
        await ChatService.markDMMessagesAsRead(conversationId, currentUserId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, currentUserId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    // Subscribe to new messages
    subscriptionRef.current = supabase
      .channel(`dm:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the full message with sender info
          const { data: newMessage } = await supabase
            .from('dm_messages')
            .select(
              `
              *,
              sender:profiles!sender_id(id, full_name, avatar_url)
            `
            )
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage as DMMessage]);

            // Mark as read if it's from the other user
            const msgData = newMessage as Record<string, unknown>;
            if (currentUserId && msgData.sender_id !== currentUserId) {
              await ChatService.markDMMessagesAsRead(conversationId, currentUserId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [conversationId, currentUserId, fetchMessages]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !currentUserId || !content.trim()) return;

      try {
        setSending(true);
        await ChatService.sendDMMessage(
          { conversation_id: conversationId, content },
          currentUserId
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversationId, currentUserId]
  );

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    refresh: fetchMessages,
  };
}
