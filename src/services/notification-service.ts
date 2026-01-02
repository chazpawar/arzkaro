import { supabase } from '../../backend/supabase';

// Notification types matching database enum
export type NotificationType =
  | 'friend_request_accepted'
  | 'event_reminder'
  | 'booking_confirmed'
  | 'event_cancelled'
  | 'event_updated'
  | 'new_message'
  | 'payout_completed';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  related_user_id?: string | null;
  related_event_id?: string | null;
  related_booking_id?: string | null;
  data?: any;
  action_url?: string | null;
  created_at: string;
  read_at?: string | null;

  // Joined data
  related_user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userId: string, limit = 50) {
  if (!userId) {
    console.warn('[NOTIFICATIONS] getUserNotifications called without userId');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(
        `
      *,
      related_user:profiles!related_user_id(id, full_name, avatar_url)
    `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // If table doesn't exist yet, return empty array
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.warn('[NOTIFICATIONS] Table not found - returning empty array');
        return [];
      }
      throw error;
    }

    return (data || []) as Notification[];
  } catch (error) {
    console.error('[NOTIFICATIONS] Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  if (!userId) {
    console.warn('[NOTIFICATIONS] getUnreadCount called without userId');
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      // If table doesn't exist yet, return 0
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.warn('[NOTIFICATIONS] Table not found - returning 0');
        return 0;
      }
      console.error('[NOTIFICATIONS] Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[NOTIFICATIONS] Exception getting unread count:', error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string) {
  if (!notificationId) {
    console.warn('[NOTIFICATIONS] markAsRead called without notificationId');
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    console.error('[NOTIFICATIONS] Error marking notification as read:', error);
    console.error('[NOTIFICATIONS] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  if (!userId) {
    console.warn('[NOTIFICATIONS] markAllAsRead called without userId');
    return;
  }

  console.log('[NOTIFICATIONS SERVICE] 🔵 Marking all notifications as read for user:', userId);

  const { data, error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('read', false)
    .select();

  if (error) {
    console.error('[NOTIFICATIONS SERVICE] ❌ Error marking all as read:', error);
    console.error('[NOTIFICATIONS SERVICE] ❌ Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log(
    '[NOTIFICATIONS SERVICE] ✅ Successfully marked as read. Updated rows:',
    data?.length
  );
  console.log(
    '[NOTIFICATIONS SERVICE] ✅ Updated notification IDs:',
    data?.map((n) => n.id)
  );
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  if (!notificationId) {
    console.warn('[NOTIFICATIONS] deleteNotification called without notificationId');
    return;
  }

  const { error } = await supabase.from('notifications').delete().eq('id', notificationId);

  if (error) {
    console.error('[NOTIFICATIONS] Error deleting notification:', error);
    console.error('[NOTIFICATIONS] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Delete all read notifications for a user
 */
export async function deleteAllRead(userId: string) {
  if (!userId) {
    console.warn('[NOTIFICATIONS] deleteAllRead called without userId');
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('read', true);

  if (error) {
    console.error('[NOTIFICATIONS] Error deleting read notifications:', error);
    console.error('[NOTIFICATIONS] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Subscribe to real-time notification updates
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void,
  onUpdate?: (notification: Notification) => void,
  onDelete?: (notificationId: string) => void
) {
  console.log('[NOTIFICATIONS SERVICE] 🔵 Setting up realtime subscription for user:', userId);

  // Create a unique channel name to avoid conflicts when multiple components subscribe
  const channelName = `notifications:${userId}:${Math.random().toString(36).substring(7)}`;
  console.log('[NOTIFICATIONS SERVICE] 📡 Channel name:', channelName);

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('[NOTIFICATIONS SERVICE] 🟢 INSERT event received:', payload.new);

        // Fetch full notification with related user data
        const { data, error } = await supabase
          .from('notifications')
          .select(
            `
            *,
            related_user:profiles!related_user_id(id, full_name, avatar_url)
          `
          )
          .eq('id', payload.new.id)
          .single();

        if (error) {
          console.error('[NOTIFICATIONS SERVICE] ❌ Error fetching new notification:', error);
          return;
        }

        if (data) {
          console.log('[NOTIFICATIONS SERVICE] ✅ Fetched full notification data:', data);
          onNotification(data as Notification);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('[NOTIFICATIONS SERVICE] 🟡 UPDATE event received:', payload.new);
        console.log('[NOTIFICATIONS SERVICE] 🟡 Old value:', payload.old);

        if (onUpdate) {
          // Fetch full notification with related user data
          const { data, error } = await supabase
            .from('notifications')
            .select(
              `
              *,
              related_user:profiles!related_user_id(id, full_name, avatar_url)
            `
            )
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('[NOTIFICATIONS SERVICE] ❌ Error fetching updated notification:', error);
            return;
          }

          if (data) {
            console.log('[NOTIFICATIONS SERVICE] ✅ Fetched updated notification data:', data);
            onUpdate(data as Notification);
          }
        } else {
          console.warn('[NOTIFICATIONS SERVICE] ⚠️ onUpdate callback not provided');
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('[NOTIFICATIONS SERVICE] 🔴 DELETE event received:', payload.old.id);

        if (onDelete) {
          onDelete(payload.old.id);
        } else {
          console.warn('[NOTIFICATIONS SERVICE] ⚠️ onDelete callback not provided');
        }
      }
    )
    .subscribe((status) => {
      console.log('[NOTIFICATIONS SERVICE] 📡 Subscription status:', status);

      if (status === 'SUBSCRIBED') {
        console.log('[NOTIFICATIONS SERVICE] ✅ Successfully subscribed to realtime updates');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[NOTIFICATIONS SERVICE] ❌ Channel error - realtime not working!');
      } else if (status === 'TIMED_OUT') {
        console.error('[NOTIFICATIONS SERVICE] ⏱️ Subscription timed out');
      } else if (status === 'CLOSED') {
        console.warn('[NOTIFICATIONS SERVICE] 🔒 Channel closed');
      }
    });

  return channel;
}

/**
 * Create a manual notification (for testing or admin use)
 */
export async function createNotification(notification: {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_user_id?: string;
  related_event_id?: string;
  related_booking_id?: string;
  data?: any;
  action_url?: string;
}) {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single();

  if (error) {
    console.error('[NOTIFICATIONS] Error creating notification:', error);
    console.error('[NOTIFICATIONS] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  return data as Notification;
}
