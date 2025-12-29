import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../../backend/supabase';

// =============================================
// Types
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

export interface NotificationData {
  type: 'chat' | 'booking' | 'promotional' | 'event_reminder' | 'system';
  id: string;
  [key: string]: any;
}

// =============================================
// Configuration
// =============================================

// Configure how notifications are displayed
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
// Permission & Token Management
// =============================================

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      console.log('[NOTIFICATIONS] Not a physical device, skipping permission request');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[NOTIFICATIONS] Permission not granted');
      return false;
    }

    console.log('[NOTIFICATIONS] Permission granted');
    return true;
  } catch (error) {
    console.error('[NOTIFICATIONS] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Get the Expo Push Token for this device
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log('[NOTIFICATIONS] Not a physical device, cannot get push token');
      return null;
    }

    // Setup notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
      });

      // Create channel for chat notifications
      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Chat Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
      });

      // Create channel for promotional notifications
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
      console.error('[NOTIFICATIONS] Project ID not found in config');
      return null;
    }

    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('[NOTIFICATIONS] Got push token:', pushTokenData.data);
    return pushTokenData.data;
  } catch (error) {
    console.error('[NOTIFICATIONS] Error getting push token:', error);
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

    console.log('[NOTIFICATIONS] Registering push token for user:', userId);

    // Type assertion for RPC call until migrations are applied
    const { data, error } = await (supabase as any).rpc('upsert_push_token', {
      p_user_id: userId,
      p_expo_push_token: expoPushToken,
      p_device_id: deviceId,
      p_device_name: deviceName,
      p_platform: platform,
      p_app_version: appVersion,
    });

    if (error) {
      console.error('[NOTIFICATIONS] Error registering push token:', error);
      return null;
    }

    console.log('[NOTIFICATIONS] Push token registered successfully');
    return data as PushToken;
  } catch (error) {
    console.error('[NOTIFICATIONS] Error in registerPushToken:', error);
    return null;
  }
}

/**
 * Unregister push token (when user logs out or revokes permissions)
 */
export async function unregisterPushToken(expoPushToken: string): Promise<boolean> {
  try {
    // Type assertion until migrations are applied
    const { error } = await (supabase as any)
      .from('push_tokens')
      .delete()
      .eq('expo_push_token', expoPushToken);

    if (error) {
      console.error('[NOTIFICATIONS] Error unregistering push token:', error);
      return false;
    }

    console.log('[NOTIFICATIONS] Push token unregistered');
    return true;
  } catch (error) {
    console.error('[NOTIFICATIONS] Error in unregisterPushToken:', error);
    return false;
  }
}

/**
 * Get all push tokens for a user
 */
export async function getUserPushTokens(userId: string): Promise<PushToken[]> {
  try {
    // Type assertion until migrations are applied
    const { data, error } = await (supabase as any).rpc('get_user_push_tokens', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[NOTIFICATIONS] Error getting user push tokens:', error);
      return [];
    }

    return (data || []) as PushToken[];
  } catch (error) {
    console.error('[NOTIFICATIONS] Error in getUserPushTokens:', error);
    return [];
  }
}

// =============================================
// Notification Listeners
// =============================================

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
 * Get the notification that launched the app (if any)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}

// =============================================
// Badge Management
// =============================================

/**
 * Set the app badge count
 */
export async function setBadgeCount(count: number): Promise<boolean> {
  try {
    await Notifications.setBadgeCountAsync(count);
    return true;
  } catch (error) {
    console.error('[NOTIFICATIONS] Error setting badge count:', error);
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
 * Get current badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('[NOTIFICATIONS] Error getting badge count:', error);
    return 0;
  }
}

// =============================================
// Testing (Development Only)
// =============================================

/**
 * Send a test notification (for development/testing)
 * NOTE: This will only work in development mode
 */
export async function sendTestNotification(expoPushToken: string): Promise<void> {
  try {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: 'Test Notification',
      body: 'This is a test notification from ArzKaro!',
      data: { type: 'test', timestamp: Date.now() },
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('[NOTIFICATIONS] Test notification sent:', result);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error sending test notification:', error);
  }
}

// =============================================
// Utility Functions
// =============================================

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
    console.error('[NOTIFICATIONS] Error dismissing notifications:', error);
  }
}

/**
 * Dismiss a specific notification by ID
 */
export async function dismissNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(notificationId);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error dismissing notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('[NOTIFICATIONS] Error canceling scheduled notifications:', error);
  }
}
