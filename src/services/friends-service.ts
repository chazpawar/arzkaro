import { supabase } from '../../backend/supabase';
import type { FriendRequest, Friendship } from '../types/chat.types';

/**
 * Friends Service - Manages friend requests and friendships
 */

// ============= FRIEND REQUESTS =============

// Get all friend requests (sent and received) for a user
export async function getFriendRequests(userId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(
      `
      *,
      sender:profiles!sender_id(id, full_name, email, avatar_url),
      receiver:profiles!receiver_id(id, full_name, email, avatar_url)
    `
    )
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as FriendRequest[];
}

// Get pending friend requests received by user
export async function getPendingRequests(userId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(
      `
      *,
      sender:profiles!sender_id(id, full_name, email, avatar_url)
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

// Get friend requests sent by user
export async function getSentRequests(userId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(
      `
      *,
      receiver:profiles!receiver_id(id, full_name, email, avatar_url)
    `
    )
    .eq('sender_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as FriendRequest[];
}

// Send a friend request
export async function sendFriendRequest(senderId: string, receiverId: string) {
  // Check if request already exists
  const { data: existing } = await supabase
    .from('friend_requests')
    .select('id, status')
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === 'pending') {
      throw new Error('Friend request already sent');
    }
    if (existing.status === 'accepted') {
      throw new Error('Already friends');
    }
    // If rejected, allow sending again by deleting old request
    await supabase.from('friend_requests').delete().eq('id', existing.id);
  }

  // Check if already friends
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .or(
      `and(user_id_1.eq.${senderId},user_id_2.eq.${receiverId}),and(user_id_1.eq.${receiverId},user_id_2.eq.${senderId})`
    )
    .maybeSingle();

  if (friendship) {
    throw new Error('Already friends');
  }

  // Create new friend request
  const { data, error } = await supabase
    .from('friend_requests')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending',
    })
    .select(
      `
      *,
      sender:profiles!sender_id(id, full_name, email, avatar_url),
      receiver:profiles!receiver_id(id, full_name, email, avatar_url)
    `
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FriendRequest;
}

// Accept a friend request
export async function acceptFriendRequest(requestId: string, userId: string) {
  // Get the friend request
  const { data: request, error: fetchError } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('id', requestId)
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !request) {
    throw new Error('Friend request not found or already processed');
  }

  // Update request status
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  // Create friendship
  const { data: friendship, error: friendshipError } = await supabase
    .from('friendships')
    .insert({
      user_id_1: request.sender_id,
      user_id_2: request.receiver_id,
    })
    .select()
    .single();

  if (friendshipError) {
    throw new Error(friendshipError.message);
  }

  return friendship as Friendship;
}

// Reject a friend request
export async function rejectFriendRequest(requestId: string, userId: string) {
  const { error } = await supabase
    .from('friend_requests')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('receiver_id', userId)
    .eq('status', 'pending');

  if (error) {
    throw new Error(error.message);
  }
}

// Cancel a sent friend request
export async function cancelFriendRequest(requestId: string, userId: string) {
  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId)
    .eq('sender_id', userId)
    .eq('status', 'pending');

  if (error) {
    throw new Error(error.message);
  }
}

// ============= FRIENDSHIPS =============

// Get all friends for a user
export async function getFriends(userId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select(
      `
      *,
      user_1:profiles!user_id_1(id, full_name, email, avatar_url),
      user_2:profiles!user_id_2(id, full_name, email, avatar_url)
    `
    )
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Transform data to show the friend (not the current user)
  const friends = data.map((friendship: any) => {
    const friend = friendship.user_id_1 === userId ? friendship.user_2 : friendship.user_1;
    return {
      ...friendship,
      friend,
    };
  });

  return friends as Friendship[];
}

// Remove a friend
export async function removeFriend(friendshipId: string, userId: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

  if (error) {
    throw new Error(error.message);
  }
}

// Check if two users are friends
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const { data } = await supabase
    .from('friendships')
    .select('id')
    .or(
      `and(user_id_1.eq.${userId1},user_id_2.eq.${userId2}),and(user_id_1.eq.${userId2},user_id_2.eq.${userId1})`
    )
    .maybeSingle();

  return !!data;
}

// Get friend counts
export async function getFriendCounts(userId: string) {
  const [friendsData, pendingData] = await Promise.all([
    supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`),
    supabase
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('status', 'pending'),
  ]);

  return {
    friendsCount: friendsData.count || 0,
    pendingRequestsCount: pendingData.count || 0,
  };
}

// Check friendship status between two users
export async function checkFriendshipStatus(
  userId: string,
  otherUserId: string
): Promise<'none' | 'friends' | 'pending_sent' | 'pending_received'> {
  // Check if they are friends
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .or(
      `and(user_id_1.eq.${userId},user_id_2.eq.${otherUserId}),and(user_id_1.eq.${otherUserId},user_id_2.eq.${userId})`
    )
    .maybeSingle();

  if (friendship) {
    return 'friends';
  }

  // Check for pending friend requests
  const { data: request } = await supabase
    .from('friend_requests')
    .select('sender_id, receiver_id')
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
    )
    .eq('status', 'pending')
    .maybeSingle();

  if (request) {
    if (request.sender_id === userId) {
      return 'pending_sent';
    } else {
      return 'pending_received';
    }
  }

  return 'none';
}
