import { supabase } from '../lib/supabase';

/**
 * Friends Service - Manages friend requests and friendships
 */

// ============= TYPES =============

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendRequestStatus;
  created_at: string;
  responded_at: string | null;
  // Joined fields
  sender?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  receiver?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface Friendship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
  // Joined fields
  user_1?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  user_2?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  // The friend's profile (computed)
  friend?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

// ============= FRIEND REQUESTS =============

// Get all friend requests (sent and received) for a user
export async function getFriendRequests(userId: string): Promise<FriendRequest[]> {
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
export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
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
    console.error('[FRIENDS SERVICE] Error getting pending requests:', error);
    throw new Error(error.message);
  }

  return data as FriendRequest[];
}

// Get friend requests sent by user
export async function getSentRequests(userId: string): Promise<FriendRequest[]> {
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
export async function sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
  // Check if already friends first
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

  // Check if pending request already exists
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
    // If rejected, allow sending again by deleting old request
    await supabase.from('friend_requests').delete().eq('id', existing.id);
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
export async function acceptFriendRequest(requestId: string, userId: string): Promise<Friendship> {
  console.log('[FRIENDS SERVICE] Accepting friend request:', requestId);

  // Get the friend request
  const { data: request, error: fetchError } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('id', requestId)
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !request) {
    console.error('[FRIENDS SERVICE] Error fetching request:', fetchError);
    throw new Error('Friend request not found or already processed');
  }

  console.log(
    '[FRIENDS SERVICE] Found request from:',
    request.sender_id,
    'to:',
    request.receiver_id
  );

  // Create friendship first
  const { data: friendship, error: friendshipError } = await supabase
    .from('friendships')
    .insert({
      user_id_1: request.sender_id,
      user_id_2: request.receiver_id,
    })
    .select()
    .single();

  if (friendshipError) {
    console.error('[FRIENDS SERVICE] Error creating friendship:', friendshipError);
    throw new Error(friendshipError.message);
  }

  console.log('[FRIENDS SERVICE] Friendship created:', friendship.id);

  // Delete the friend request after accepting (cleanup)
  const { error: deleteError } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId);

  if (deleteError) {
    console.error('[FRIENDS SERVICE] Error deleting request:', deleteError);
  }

  console.log('[FRIENDS SERVICE] Friend request deleted (accepted)');
  return friendship as Friendship;
}

// Reject a friend request
export async function rejectFriendRequest(requestId: string, userId: string): Promise<void> {
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
export async function cancelFriendRequest(requestId: string, userId: string): Promise<void> {
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
export async function getFriends(userId: string): Promise<Friendship[]> {
  console.log('[FRIENDS SERVICE] Getting friends for user:', userId);

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
    console.error('[FRIENDS SERVICE] Error getting friends:', error);
    throw new Error(error.message);
  }

  console.log('[FRIENDS SERVICE] Raw friendships data:', data?.length || 0);

  // Transform data to show the friend (not the current user)
  const friends = data.map((friendship) => {
    const friend = friendship.user_id_1 === userId ? friendship.user_2 : friendship.user_1;
    return {
      ...friendship,
      friend,
    };
  });

  console.log('[FRIENDS SERVICE] Transformed friends:', friends.length);
  return friends as Friendship[];
}

// Remove a friend
export async function removeFriend(friendshipId: string, userId: string): Promise<void> {
  // Validate inputs
  if (!friendshipId || !userId) {
    throw new Error('Invalid parameters');
  }

  // First, get the friendship to find the user IDs
  const { data: friendship, error: fetchError } = await supabase
    .from('friendships')
    .select('user_id_1, user_id_2')
    .eq('id', friendshipId)
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .single();

  if (fetchError || !friendship) {
    console.error('[FRIENDS SERVICE] Error fetching friendship:', fetchError);
    throw new Error('Friendship not found');
  }

  // Store user IDs before deleting
  const userId1 = friendship.user_id_1;
  const userId2 = friendship.user_id_2;

  if (!userId1 || !userId2) {
    console.error('[FRIENDS SERVICE] Invalid user IDs in friendship:', friendship);
    throw new Error('Invalid friendship data');
  }

  // Delete the friendship first
  const { error: deleteError } = await supabase.from('friendships').delete().eq('id', friendshipId);

  if (deleteError) {
    console.error('[FRIENDS SERVICE] Error deleting friendship:', deleteError);
    throw new Error(deleteError.message);
  }

  // Clean up any friend requests between these users
  try {
    const { error: requestError } = await supabase
      .from('friend_requests')
      .delete()
      .or(
        `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`
      );

    if (requestError) {
      console.error('[FRIENDS SERVICE] Error deleting friend request:', requestError);
    }
  } catch (err) {
    console.error('[FRIENDS SERVICE] Exception deleting friend request:', err);
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
export async function getFriendCounts(userId: string): Promise<{
  friendsCount: number;
  pendingRequestsCount: number;
}> {
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
