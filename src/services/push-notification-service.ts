import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../../backend/supabase';

// =============================================
// Push Notification Configuration
// =============================================

// Only configure notifications if not in Expo Go
try {
  if (Constants?.appOwnership !== 'expo') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (_error) {
  console.log('[PUSH] Push notifications not available in Expo Go');
}

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

// =============================================
// Permission & Token Management
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
