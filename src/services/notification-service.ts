import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../../backend/supabase';

// =============================================
// Push Notification Configuration
// =============================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// =============================================
// Push Notification Types
// =============================================

export interface PushToken {
  id: string;
  user_id: string;
  expo_push_token: string;
  device_id: string | null;
  device_name: string | null;
  platform: 'ios' | 'android' | 'web' | null;
  app_version: string | null;
  created_at: string;
  updated_at: string;
  last_used_at: string;
}

// =============================================
// In-App Notification Types
// =============================================

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

  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('[NOTIFICATIONS] Error marking all as read:', error);
    console.error('[NOTIFICATIONS] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
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
  console.log('[NOTIFICATIONS] Setting up realtime subscription for user:', userId);

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('[NOTIFICATIONS] New notification received:', payload.new);

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
          console.error('[NOTIFICATIONS] Error fetching new notification:', error);
          return;
        }

        if (data) {
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
        console.log('[NOTIFICATIONS] Notification updated:', payload.new);

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
            console.error('[NOTIFICATIONS] Error fetching updated notification:', error);
            return;
          }

          if (data) {
            onUpdate(data as Notification);
          }
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
        console.log('[NOTIFICATIONS] Notification deleted:', payload.old.id);

        if (onDelete) {
          onDelete(payload.old.id);
        }
      }
    )
    .subscribe((status) => {
      console.log('[NOTIFICATIONS] Subscription status:', status);
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

// =============================================
// Push Notification Functions
// =============================================

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      console.log('[PUSH] Not a physical device, skipping permission request');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PUSH] Permission not granted');
      return false;
    }

    console.log('[PUSH] Permission granted');
    return true;
  } catch (error) {
    console.error('[PUSH] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Get the Expo Push Token for this device
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log('[PUSH] Not a physical device, cannot get push token');
      return null;
    }

    // Setup notification channels for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Chat Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('promotional', {
        name: 'Promotions & Events',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#FF6B35',
        sound: 'default',
      });
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.error('[PUSH] Project ID not found in config');
      return null;
    }

    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('[PUSH] Got push token:', pushTokenData.data);
    return pushTokenData.data;
  } catch (error) {
    console.error('[PUSH] Error getting push token:', error);
    return null;
  }
}

/**
 * Register push token with the backend
 */
export async function registerPushToken(
  userId: string,
  expoPushToken: string
): Promise<PushToken | null> {
  try {
    const deviceName = await Device.deviceName;
    const platform = Platform.OS as 'ios' | 'android';
    const appVersion = Constants?.expoConfig?.version || '1.0.0';
    const deviceId = Device.modelId || Device.modelName || 'unknown';

    console.log('[PUSH] Registering push token for user:', userId);

    const { data, error } = await supabase.rpc('upsert_push_token', {
      p_user_id: userId,
      p_expo_push_token: expoPushToken,
      p_device_id: deviceId,
      p_device_name: deviceName,
      p_platform: platform,
      p_app_version: appVersion,
    });

    if (error) {
      console.error('[PUSH] Error registering push token:', error);
      return null;
    }

    console.log('[PUSH] Push token registered successfully');
    return data as PushToken;
  } catch (error) {
    console.error('[PUSH] Error in registerPushToken:', error);
    return null;
  }
}

/**
 * Unregister push token (when user logs out or revokes permissions)
 */
export async function unregisterPushToken(expoPushToken: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('expo_push_token', expoPushToken);

    if (error) {
      console.error('[PUSH] Error unregistering push token:', error);
      return false;
    }

    console.log('[PUSH] Push token unregistered');
    return true;
  } catch (error) {
    console.error('[PUSH] Error in unregisterPushToken:', error);
    return false;
  }
}

/**
 * Get all push tokens for a user
 */
export async function getUserPushTokens(userId: string): Promise<PushToken[]> {
  try {
    const { data, error } = await supabase.rpc('get_user_push_tokens', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[PUSH] Error getting user push tokens:', error);
      return [];
    }

    return (data || []) as PushToken[];
  } catch (error) {
    console.error('[PUSH] Error in getUserPushTokens:', error);
    return [];
  }
}

/**
 * Add listener for when a notification is received while app is foregrounded
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener((event) => callback(event));
}

/**
 * Add listener for when user taps on a notification
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((event) => callback(event));
}

/**
 * Set the app badge count
 */
export async function setBadgeCount(count: number): Promise<boolean> {
  try {
    await Notifications.setBadgeCountAsync(count);
    return true;
  } catch (error) {
    console.error('[PUSH] Error setting badge count:', error);
    return false;
  }
}

/**
 * Clear the app badge
 */
export async function clearBadge(): Promise<boolean> {
  return await setBadgeCount(0);
}

/**
 * Check if device supports push notifications
 */
export function isPushNotificationSupported(): boolean {
  return Device.isDevice && (Platform.OS === 'ios' || Platform.OS === 'android');
}

/**
 * Dismiss all notifications
 */
export async function dismissAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('[PUSH] Error dismissing notifications:', error);
  }
}
