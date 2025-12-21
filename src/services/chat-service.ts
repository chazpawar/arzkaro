import { supabase } from '../../backend/supabase';
import type { EventGroup, GroupMember, Message, CreateMessage } from '../types';

/**
 * Chat Service - Handles group chats for events
 */

// ============= GROUP CHAT =============

// Get user's event groups with last message and unread count
export async function getUserGroups(userId: string) {
  // Get groups the user is a member of
  const { data: memberData, error: memberError } = await supabase
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

  if (memberError) {
    throw new Error(memberError.message);
  }

  const groups = (memberData as any[]).map((d) => d.group).filter(Boolean);

  // For each group, fetch the last message and unread count
  const groupsWithMessages = await Promise.all(
    groups.map(async (group) => {
      // Fetch last message
      const { data: lastMessage } = await supabase
        .from('messages')
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          user:profiles!user_id(id, full_name)
        `
        )
        .eq('group_id', group.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get unread count using RPC function
      const { data: unreadCount } = await (supabase.rpc as any)('get_unread_count', {
        p_group_id: group.id,
        p_user_id: userId,
      });

      return {
        ...group,
        last_message: lastMessage || null,
        unread_count: unreadCount || 0,
      };
    })
  );

  return groupsWithMessages as EventGroup[];
}

// Mark group messages as read
export async function markGroupAsRead(groupId: string, userId: string) {
  // Handle mock group IDs - just log and return
  if (groupId.startsWith('group-mock-')) {
    console.log('[CHAT SERVICE] Mock group detected, skipping mark as read');
    return;
  }

  const { error } = await (supabase.rpc as any)('mark_group_as_read', {
    p_group_id: groupId,
    p_user_id: userId,
  });

  if (error) {
    console.error('[CHAT SERVICE] Error marking group as read:', error);
    throw new Error(error.message);
  }
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
  console.log('[CHAT SERVICE] Fetching group for event:', eventId);

  // Handle mock event IDs - return mock data instead of querying database
  if (eventId.startsWith('mock-')) {
    console.log('[CHAT SERVICE] Detected mock event ID, returning mock group data');

    // Create a mock group for demo purposes
    const mockGroup: EventGroup = {
      id: `group-${eventId}`,
      event_id: eventId,
      name: 'Mock Event Group Chat',
      description: 'This is a demo group chat',
      created_at: new Date().toISOString(),
      event: {
        id: eventId,
        title: 'Mock Event',
        cover_image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400',
      },
    };

    return mockGroup;
  }

  try {
    const { data, error } = await supabase
      .from('event_groups')
      .select(
        `
        *,
        event:events(id, title, cover_image_url, host_id)
      `
      )
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      console.error('[CHAT SERVICE] Error fetching group:', error);
      throw new Error(error.message);
    }

    console.log('[CHAT SERVICE] Group result:', data ? data.id : 'not found');
    return data as EventGroup | null;
  } catch (err) {
    console.error('[CHAT SERVICE] Exception fetching group:', err);
    throw err;
  }
}

// Check if user is a member of a group
export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  // Handle mock group IDs
  if (groupId.startsWith('group-mock-')) {
    console.log('[CHAT SERVICE] Mock group detected, returning true for membership');
    return true; // Always allow access to mock groups for demo purposes
  }

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
  // Handle mock group IDs - return mock members
  if (groupId.startsWith('group-mock-')) {
    console.log('[CHAT SERVICE] Mock group detected, returning mock members');

    const mockMembers: GroupMember[] = [
      {
        id: 'member-1',
        group_id: groupId,
        user_id: 'user-1',
        role: 'member',
        joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        user: {
          id: 'user-1',
          full_name: 'Sarah Chen',
          email: 'sarah@example.com',
          avatar_url:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
        },
      },
      {
        id: 'member-2',
        group_id: groupId,
        user_id: 'user-2',
        role: 'member',
        joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
        user: {
          id: 'user-2',
          full_name: 'Alex Rivera',
          email: 'alex@example.com',
          avatar_url:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
        },
      },
      {
        id: 'member-3',
        group_id: groupId,
        user_id: 'user-3',
        role: 'member',
        joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        user: {
          id: 'user-3',
          full_name: 'David Kim',
          email: 'david@example.com',
          avatar_url:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
        },
      },
      {
        id: 'member-4',
        group_id: groupId,
        user_id: 'user-4',
        role: 'member',
        joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        user: {
          id: 'user-4',
          full_name: 'Priya Patel',
          email: 'priya@example.com',
          avatar_url:
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
        },
      },
    ];

    return mockMembers;
  }

  const { data, error } = await supabase
    .from('group_members')
    .select(
      `
      *,
      user:profiles!user_id(id, full_name, email, avatar_url)
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
  // Handle mock group IDs - return mock messages
  if (groupId.startsWith('group-mock-')) {
    console.log('[CHAT SERVICE] Mock group detected, returning mock messages');

    const mockMessages: Message[] = [
      {
        id: 'msg-1',
        group_id: groupId,
        user_id: 'user-1',
        content: 'Hey everyone! Looking forward to this event!',
        message_type: 'text',
        is_deleted: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        user: {
          id: 'user-1',
          full_name: 'Sarah Chen',
          avatar_url:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
        },
      },
      {
        id: 'msg-2',
        group_id: groupId,
        user_id: 'user-2',
        content: 'Me too! What time should we meet?',
        message_type: 'text',
        is_deleted: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(), // 1.5 hours ago
        user: {
          id: 'user-2',
          full_name: 'Alex Rivera',
          avatar_url:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
        },
      },
      {
        id: 'msg-3',
        group_id: groupId,
        user_id: 'user-3',
        content: 'How about 30 minutes before the event starts?',
        message_type: 'text',
        is_deleted: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        user: {
          id: 'user-3',
          full_name: 'David Kim',
          avatar_url:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
        },
      },
      {
        id: 'msg-4',
        group_id: groupId,
        user_id: 'user-1',
        content: 'Perfect! See you all there!',
        message_type: 'text',
        is_deleted: false,
        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
        user: {
          id: 'user-1',
          full_name: 'Sarah Chen',
          avatar_url:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
        },
      },
      {
        id: 'msg-5',
        group_id: groupId,
        user_id: 'user-4',
        content: "Don't forget to bring your tickets!",
        message_type: 'text',
        is_deleted: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        user: {
          id: 'user-4',
          full_name: 'Priya Patel',
          avatar_url:
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
        },
      },
    ];

    return mockMessages;
  }

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
  // Handle mock group IDs - return a mock sent message
  if (message.group_id && message.group_id.startsWith('group-mock-')) {
    console.log('[CHAT SERVICE] Mock group detected, returning mock sent message');

    const mockSentMessage: Message = {
      id: `msg-${Date.now()}`,
      group_id: message.group_id,
      user_id: userId,
      content: message.content,
      message_type: message.message_type || 'text',
      is_deleted: false,
      created_at: new Date().toISOString(),
      user: {
        id: userId,
        full_name: 'You',
        avatar_url: null,
      },
    };

    return mockSentMessage;
  }

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
