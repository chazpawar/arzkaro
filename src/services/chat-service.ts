import { supabase } from '../../backend/supabase';
import type { EventGroup, GroupMember, Message, CreateMessage } from '../types';

/**
 * Chat Service - Handles group chats for events
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
    })
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
    })
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
