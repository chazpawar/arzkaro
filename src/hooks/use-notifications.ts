import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../backend/supabase';
import * as NotificationService from '../services/notification-service';
import type { Notification } from '../services/notification-service';

/**
 * Hook for managing user notifications with real-time updates and push notifications
 */
export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const pushListenerRef = useRef<any>(null);

  // Register for push notifications on mount (one-time setup)
  useEffect(() => {
    if (!userId) return;

    const setupPushNotifications = async () => {
      try {
        // Check if push notifications are supported
        if (!NotificationService.isPushNotificationSupported()) {
          console.log('[PUSH] Push notifications not supported on this device');
          return;
        }

        // Request permissions
        const hasPermission = await NotificationService.requestNotificationPermissions();
        if (!hasPermission) {
          console.log('[PUSH] Push notification permissions not granted');
          return;
        }

        // Get push token
        const token = await NotificationService.getExpoPushToken();
        if (!token) {
          console.log('[PUSH] Failed to get push token');
          return;
        }

        setPushToken(token);

        // Register token with backend
        await NotificationService.registerPushToken(userId, token);
        console.log('[PUSH] Push notifications registered successfully');

        // Listen for notification taps
        const responseListener = NotificationService.addNotificationResponseReceivedListener(
          (response) => {
            console.log('[PUSH] Notification tapped:', response);
            // TODO: Handle navigation based on notification data
          }
        );

        pushListenerRef.current = responseListener;
      } catch (err) {
        console.error('[PUSH] Error setting up push notifications:', err);
      }
    };

    setupPushNotifications();

    // Cleanup push listener
    return () => {
      if (pushListenerRef.current) {
        pushListenerRef.current.remove();
      }
    };
  }, [userId]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [notificationsData, count] = await Promise.all([
        NotificationService.getUserNotifications(userId),
        NotificationService.getUnreadCount(userId),
      ]);

      setNotifications(notificationsData);
      setUnreadCount(count);

      // Update badge count for push notifications
      await NotificationService.setBadgeCount(count);
    } catch (err) {
      console.error('[NOTIFICATIONS HOOK] Error fetching notifications:', err);

      // If table doesn't exist yet or permissions not set up, fail silently
      if (err && typeof err === 'object') {
        const error = err as any;

        // Table doesn't exist yet (code 42P01) or permission denied (code 42501)
        if (error.code === '42P01' || error.code === '42501' || error.code === 'PGRST116') {
          console.warn('[NOTIFICATIONS HOOK] Notifications not set up yet - skipping');
          setError(null); // Don't show error to user
          setNotifications([]);
          setUnreadCount(0);
          setLoading(false);
          return;
        }
      }

      // For other errors, show user-friendly message
      setError('Unable to load notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Setup real-time subscription
  useEffect(() => {
    if (!userId) {
      return;
    }

    console.log('[NOTIFICATIONS HOOK] Setting up realtime for user:', userId);

    // Initial fetch
    fetchNotifications();

    // Subscribe to real-time updates
    const channel = NotificationService.subscribeToNotifications(
      userId,
      // On new notification
      (notification) => {
        console.log('[NOTIFICATIONS HOOK] New notification:', notification.id);
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      },
      // On update (e.g., marked as read)
      (notification) => {
        console.log('[NOTIFICATIONS HOOK] Notification updated:', notification.id);
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? notification : n)));

        // Recalculate unread count
        setUnreadCount((prev) => {
          const wasRead = prev > 0;
          const isNowRead = notification.read;
          if (!wasRead && isNowRead) {
            return Math.max(0, prev - 1);
          }
          return prev;
        });
      },
      // On delete
      (notificationId) => {
        console.log('[NOTIFICATIONS HOOK] Notification deleted:', notificationId);
        setNotifications((prev) => {
          const notification = prev.find((n) => n.id === notificationId);
          const wasUnread = notification && !notification.read;

          if (wasUnread) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }

          return prev.filter((n) => n.id !== notificationId);
        });
      }
    );

    channelRef.current = channel;

    // Cleanup
    return () => {
      console.log('[NOTIFICATIONS HOOK] Cleaning up realtime');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NOTIFICATIONS HOOK] Error marking as read:', err);
      throw err;
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await NotificationService.markAllAsRead(userId);

      // Optimistic update
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, read_at: now })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NOTIFICATIONS HOOK] Error marking all as read:', err);
      throw err;
    }
  }, [userId]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);

      // Optimistic update
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== notificationId);
      });
    } catch (err) {
      console.error('[NOTIFICATIONS HOOK] Error deleting notification:', err);
      throw err;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pushToken,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
