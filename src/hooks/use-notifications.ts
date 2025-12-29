import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/auth-context';
import * as NotificationService from '../services/notification-service';
import type { NotificationData } from '../services/notification-service';

// =============================================
// useNotifications Hook
// =============================================

export function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  // =============================================
  // Handle notification tap/interaction
  // =============================================

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as NotificationData;

      console.log('[useNotifications] Notification tapped:', data);

      // Route based on notification type
      switch (data.type) {
        case 'chat':
          // Navigate to the specific chat
          if (data.conversationId) {
            router.push(`/dm/${data.conversationId}`);
          } else if (data.groupId) {
            router.push(`/events/${data.eventId}/chat`);
          }
          break;

        case 'booking':
          // Navigate to ticket details
          if (data.ticketId) {
            router.push(`/tickets/${data.ticketId}`);
          }
          break;

        case 'promotional':
        case 'event_reminder':
          // Navigate to event details
          if (data.eventId) {
            router.push(`/events/${data.eventId}`);
          }
          break;

        case 'system':
          // Navigate based on system notification type
          if (data.route) {
            router.push(data.route as any);
          }
          break;

        default:
          console.log('[useNotifications] Unknown notification type:', data.type);
      }
    },
    [router]
  );

  // =============================================
  // Register for push notifications
  // =============================================

  const registerForPushNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.id || isRegistering) {
      return;
    }

    if (!NotificationService.isPushNotificationSupported()) {
      console.log('[useNotifications] Push notifications not supported on this device');
      return;
    }

    try {
      setIsRegistering(true);

      // Request permissions
      const hasPermission = await NotificationService.requestNotificationPermissions();
      setIsPermissionGranted(hasPermission);

      if (!hasPermission) {
        console.log('[useNotifications] Permission denied');
        return;
      }

      // Get push token
      const token = await NotificationService.getExpoPushToken();

      if (!token) {
        console.log('[useNotifications] Failed to get push token');
        return;
      }

      setExpoPushToken(token);

      // Register token with backend
      const result = await NotificationService.registerPushToken(user.id, token);

      if (result) {
        console.log('[useNotifications] Successfully registered for push notifications');
      }
    } catch (error) {
      console.error('[useNotifications] Error registering for push notifications:', error);
    } finally {
      setIsRegistering(false);
    }
  }, [isAuthenticated, user?.id, isRegistering]);

  // =============================================
  // Unregister push notifications
  // =============================================

  const unregisterPushNotifications = useCallback(async () => {
    if (!expoPushToken) return;

    try {
      await NotificationService.unregisterPushToken(expoPushToken);
      setExpoPushToken(null);
      setIsPermissionGranted(false);
      console.log('[useNotifications] Unregistered from push notifications');
    } catch (error) {
      console.error('[useNotifications] Error unregistering push notifications:', error);
    }
  }, [expoPushToken]);

  // =============================================
  // Setup notification listeners
  // =============================================

  useEffect(() => {
    // Check if app was launched by tapping a notification
    NotificationService.getLastNotificationResponse().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = NotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('[useNotifications] Notification received:', notification);
        setNotification(notification);
      }
    );

    // Listen for notification taps
    responseListener.current = NotificationService.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationResponse]);

  // =============================================
  // Auto-register when user logs in
  // =============================================

  useEffect(() => {
    if (isAuthenticated && user?.id && !expoPushToken && !isRegistering) {
      registerForPushNotifications();
    }
  }, [isAuthenticated, user?.id, expoPushToken, isRegistering, registerForPushNotifications]);

  // =============================================
  // Cleanup on logout
  // =============================================

  useEffect(() => {
    if (!isAuthenticated && expoPushToken) {
      unregisterPushNotifications();
    }
  }, [isAuthenticated, expoPushToken, unregisterPushNotifications]);

  return {
    expoPushToken,
    notification,
    isPermissionGranted,
    isRegistering,
    registerForPushNotifications,
    unregisterPushNotifications,
    setBadgeCount: NotificationService.setBadgeCount,
    clearBadge: NotificationService.clearBadge,
    getBadgeCount: NotificationService.getBadgeCount,
    dismissAllNotifications: NotificationService.dismissAllNotifications,
  };
}
