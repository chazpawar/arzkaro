import { supabase } from '../../backend/supabase';
import type {
  EventGroup,
  GroupMember,
  Message,
  CreateMessage,
  FriendRequest,
  Friendship,
  DMConversation,
  DMMessage,
  CreateDMMessage,
} from '../types';

/**
 * Chat Service - Handles group chats, DMs, and friend requests
 */

// ============= GROUP CHAT =============

// Get user's event groups
export async function getUserGroups(userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(
      `
      group:event_groups(
        id,
        event_id,
        name,
        description,
        created_at,
        event:events(id, title, cover_image_url)
      )
    `
    )
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((d) => d.group).filter(Boolean) as EventGroup[];
}

// Get group by ID
export async function getGroupById(groupId: string) {
  const { data, error } = await supabase
    .from('event_groups')
    .select(
      `
      *,
      event:events(id, title, cover_image_url, host_id)
    `
    )
    .eq('id', groupId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as EventGroup;
}

// Get group by Event ID
export async function getGroupByEventId(eventId: string) {
  const { data, error } = await supabase
    .from('event_groups')
    .select(
      `
      *,
      event:events(id, title, cover_image_url, host_id)
    `
    )
    .eq('event_id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(error.message);
  }

  return data as EventGroup;
}

// Check if user is a member of a group
export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  return !!data && !error;
}

// Join a group (for booking flow)
export async function joinGroup(groupId: string, userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    } as Record<string, unknown>)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Already a member
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}

// Get group members
export async function getGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(
      `
      *,
      user:profiles!user_id(id, full_name, avatar_url)
    `
    )
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as GroupMember[];
}

// Get group messages
export async function getGroupMessages(groupId: string, limit = 50, before?: string) {
  let query = supabase
    .from('messages')
    .select(
      `
      *,
      user:profiles!user_id(id, full_name, avatar_url)
    `
    )
    .eq('group_id', groupId)
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

  return (data as Message[]).reverse();
}

// Send a message to a group
export async function sendGroupMessage(message: CreateMessage, userId: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      group_id: message.group_id,
      user_id: userId,
      content: message.content,
      message_type: message.message_type || 'text',
    } as Record<string, unknown>)
    .select(
      `
      *,
      user:profiles!user_id(id, full_name, avatar_url)
    `
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Message;
}

// Remove a member from group (host only)
export async function removeGroupMember(groupId: string, userId: string) {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

// ============= FRIEND REQUESTS =============

// Send a friend request
export async function sendFriendRequest(senderId: string, receiverId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
    } as Record<string, unknown>)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      throw new Error('Friend request already sent');
    }
    throw new Error(error.message);
  }

  return data as FriendRequest;
}

// Get pending friend requests (received)
export async function getPendingFriendRequests(userId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(
      `
      *,
      sender:profiles!sender_id(id, full_name, avatar_url)
    `
    )
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as FriendRequest[];
}

// Get sent friend requests
export async function getSentFriendRequests(userId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(
      `
      *,
      receiver:profiles!receiver_id(id, full_name, avatar_url)
    `
    )
    .eq('sender_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as FriendRequest[];
}

// Accept a friend request
export async function acceptFriendRequest(requestId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FriendRequest;
}

// Reject a friend request
export async function rejectFriendRequest(requestId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FriendRequest;
}

// Get user's friends
export async function getFriends(userId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select(
      `
      *,
      friend1:profiles!user_id_1(id, full_name, avatar_url),
      friend2:profiles!user_id_2(id, full_name, avatar_url)
    `
    )
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

  if (error) {
    throw new Error(error.message);
  }

  // Map to return the friend's profile (not the current user)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((f) => ({
    ...f,
    friend: f.friend1.id === userId ? f.friend2 : f.friend1,
  })) as (Friendship & {
    friend: { id: string; full_name: string | null; avatar_url: string | null };
  })[];
}

// Check if two users are friends
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const [id1, id2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  const { data, error } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_id_1', id1)
    .eq('user_id_2', id2)
    .single();

  return !!data && !error;
}

// Remove a friend
export async function removeFriend(userId: string, friendId: string) {
  const [id1, id2] = userId < friendId ? [userId, friendId] : [friendId, userId];

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id_1', id1)
    .eq('user_id_2', id2);

  if (error) {
    throw new Error(error.message);
  }
}

// ============= DIRECT MESSAGES =============

// Get or create a DM conversation
export async function getOrCreateDMConversation(userId1: string, userId2: string) {
  const [id1, id2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  // Try to get existing conversation
  const { data, error } = await supabase
    .from('dm_conversations')
    .select('*')
    .eq('user_id_1', id1)
    .eq('user_id_2', id2)
    .single();

  if (error && error.code !== 'PGRST116') {
    // Not found error
    throw new Error(error.message);
  }

  if (!data) {
    // Create new conversation
    const { data: newConvo, error: createError } = await supabase
      .from('dm_conversations')
      .insert({
        user_id_1: id1,
        user_id_2: id2,
      } as Record<string, unknown>)
      .select()
      .single();

    if (createError) {
      throw new Error(createError.message);
    }

    return newConvo as DMConversation;
  }

  return data as DMConversation;
}

// Get user's DM conversations
export async function getDMConversations(userId: string) {
  const { data, error } = await supabase
    .from('dm_conversations')
    .select(
      `
      *,
      user1:profiles!user_id_1(id, full_name, avatar_url),
      user2:profiles!user_id_2(id, full_name, avatar_url)
    `
    )
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Map to include the other user's profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((convo) => ({
    ...convo,
    other_user: convo.user1.id === userId ? convo.user2 : convo.user1,
  })) as DMConversation[];
}

// Get DM messages
export async function getDMMessages(conversationId: string, limit = 50, before?: string) {
  let query = supabase
    .from('dm_messages')
    .select(
      `
      *,
      sender:profiles!sender_id(id, full_name, avatar_url)
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

// Send a DM
export async function sendDMMessage(message: CreateDMMessage, senderId: string) {
  const { data, error } = await supabase
    .from('dm_messages')
    .insert({
      conversation_id: message.conversation_id,
      sender_id: senderId,
      content: message.content,
      message_type: message.message_type || 'text',
    } as Record<string, unknown>)
    .select(
      `
      *,
      sender:profiles!sender_id(id, full_name, avatar_url)
    `
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Update conversation updated_at
  await supabase
    .from('dm_conversations')
    .update({ updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('id', message.conversation_id);

  return data as DMMessage;
}

// Mark DM messages as read
export async function markDMMessagesAsRead(conversationId: string, userId: string) {
  const { error } = await supabase
    .from('dm_messages')
    .update({ is_read: true } as Record<string, unknown>)
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);

  if (error) {
    throw new Error(error.message);
  }
}
