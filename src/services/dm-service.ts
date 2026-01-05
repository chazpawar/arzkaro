import { supabase } from '../../backend/supabase';
import type { DMConversation, DMMessage, CreateDMMessage } from '../types/chat.types';

/**
 * DM (Direct Message) Service - Handles one-on-one conversations
 */

// ============= CONVERSATIONS =============

// Get or create a conversation between two users
export async function getOrCreateConversation(userId1: string, userId2: string) {
  // Check if conversation already exists (order doesn't matter)
  const { data: existing, error: fetchError } = await supabase
    .from('dm_conversations')
    .select('*')
    .or(
      `and(user_id_1.eq.${userId1},user_id_2.eq.${userId2}),and(user_id_1.eq.${userId2},user_id_2.eq.${userId1})`
    )
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(fetchError.message);
  }

  if (existing) {
    return existing as DMConversation;
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('dm_conversations')
    .insert({
      user_id_1: userId1,
      user_id_2: userId2,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DMConversation;
}

// Get all conversations for a user
export async function getUserConversations(userId: string) {
  const { data, error } = await supabase
    .from('dm_conversations')
    .select(
      `
      *,
      user_1:profiles!user_id_1(id, full_name, email, avatar_url),
      user_2:profiles!user_id_2(id, full_name, email, avatar_url)
    `
    )
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Transform data to show the other user
  const conversations = data.map((conv: any) => {
    const otherUser = conv.user_id_1 === userId ? conv.user_2 : conv.user_1;
    return {
      ...conv,
      other_user: otherUser,
    };
  });

  return conversations as DMConversation[];
}

// Get conversation by ID
export async function getConversationById(conversationId: string, userId: string) {
  const { data, error } = await supabase
    .from('dm_conversations')
    .select(
      `
      *,
      user_1:profiles!user_id_1(id, full_name, email, avatar_url),
      user_2:profiles!user_id_2(id, full_name, email, avatar_url)
    `
    )
    .eq('id', conversationId)
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Transform data to show the other user
  const otherUser = data.user_id_1 === userId ? data.user_2 : data.user_1;

  return {
    ...data,
    other_user: otherUser,
  } as DMConversation;
}

// ============= MESSAGES =============

// Get messages in a conversation
export async function getMessages(conversationId: string, limit = 50, before?: string) {
  let query = supabase
    .from('dm_messages')
    .select(
      `
      *,
      sender:profiles!sender_id(id, full_name, email, avatar_url)
    `
    )
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data as DMMessage[]).reverse();
}

// Send a message
export async function sendMessage(message: CreateDMMessage, senderId: string) {
  const { data, error } = await supabase
    .from('dm_messages')
    .insert({
      conversation_id: message.conversation_id,
      sender_id: senderId,
      content: message.content,
      message_type: message.message_type || 'text',
      is_read: false,
    })
    .select(
      `
      *,
      sender:profiles!sender_id(id, full_name, email, avatar_url)
    `
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Update conversation's updated_at
  await supabase
    .from('dm_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', message.conversation_id);

  return data as DMMessage;
}

// Mark messages as read
export async function markMessagesAsRead(conversationId: string, userId: string) {
  const { error } = await supabase
    .from('dm_messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('[DM SERVICE] Error marking messages as read:', error);
    throw new Error(error.message);
  }
}

// Get unread count for a conversation
export async function getUnreadCount(conversationId: string, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('dm_messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('[DM SERVICE] Error getting unread count:', error);
    return 0;
  }

  return count || 0;
}

// Delete a message
export async function deleteMessage(messageId: string, userId: string) {
  const { error } = await supabase
    .from('dm_messages')
    .update({ is_deleted: true })
    .eq('id', messageId)
    .eq('sender_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

// ============= REAL-TIME =============

// Subscribe to new messages in a conversation
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: DMMessage) => void,
  onMessageUpdate?: (message: DMMessage) => void
) {
  console.log('[DM SERVICE] Setting up real-time subscription for conversation:', conversationId);

  const channel = supabase
    .channel(`dm_conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'dm_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        console.log('[DM SERVICE] New message received:', payload);

        // Fetch the full message with sender details
        const { data, error } = await supabase
          .from('dm_messages')
          .select(
            `
            *,
            sender:profiles!sender_id(id, full_name, email, avatar_url)
          `
          )
          .eq('id', payload.new.id)
          .single();

        if (error) {
          console.error('[DM SERVICE] Error fetching message details:', error);
          return;
        }

        onMessage(data as DMMessage);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'dm_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        console.log('[DM SERVICE] Message updated (read receipt):', payload);

        if (onMessageUpdate) {
          // Fetch the full message with sender details
          const { data, error } = await supabase
            .from('dm_messages')
            .select(
              `
              *,
              sender:profiles!sender_id(id, full_name, email, avatar_url)
            `
            )
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('[DM SERVICE] Error fetching updated message:', error);
            return;
          }

          onMessageUpdate(data as DMMessage);
        }
      }
    )
    .subscribe((status) => {
      console.log('[DM SERVICE] Subscription status:', status);
    });

  return channel;
}

// Subscribe to conversation updates (for typing indicators, etc.)
export function subscribeToConversationUpdates(
  conversationId: string,
  onUpdate: (conversation: any) => void
) {
  console.log('[DM SERVICE] Setting up conversation updates subscription:', conversationId);

  const channel = supabase
    .channel(`dm_conversation_updates:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'dm_conversations',
        filter: `id=eq.${conversationId}`,
      },
      (payload) => {
        console.log('[DM SERVICE] Conversation updated:', payload);
        onUpdate(payload.new);
      }
    )
    .subscribe((status) => {
      console.log('[DM SERVICE] Conversation subscription status:', status);
    });

  return channel;
}

// ============= TYPING INDICATORS =============

// Subscribe to typing indicators using Supabase Presence
export function subscribeToTyping(
  conversationId: string,
  userId: string,
  onTypingChange: (typingUsers: { user_id: string; user_name: string }[]) => void
) {
  console.log('[DM SERVICE] Setting up typing indicator for conversation:', conversationId);

  const channel = supabase.channel(`dm_typing:${conversationId}`, {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  // Listen to presence changes
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const typingUsers: { user_id: string; user_name: string }[] = [];

      Object.keys(state).forEach((key) => {
        const presences = state[key];
        presences.forEach((presence: any) => {
          if (presence.typing && presence.user_id !== userId) {
            typingUsers.push({
              user_id: presence.user_id,
              user_name: presence.user_name,
            });
          }
        });
      });

      onTypingChange(typingUsers);
    })
    .subscribe(async (status) => {
      console.log('[DM SERVICE] Typing indicator subscription status:', status);
    });

  return channel;
}

// Set typing status
export async function setTypingStatus(
  channel: any,
  userId: string,
  userName: string,
  isTyping: boolean
) {
  await channel.track({
    user_id: userId,
    user_name: userName,
    typing: isTyping,
    online_at: new Date().toISOString(),
  });
}
