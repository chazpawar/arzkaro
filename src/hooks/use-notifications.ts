import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../backend/supabase';
import * as NotificationService from '../services/notification-service';
import type { Notification } from '../services/notification-service';

/**
 * Hook for managing user notifications with real-time updates
 * Note: Push notification registration is commented out for Expo Go compatibility
 */
export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TODO: Uncomment push notification registration when building with EAS
  // Register for push notifications on mount (one-time setup)
  // useEffect(() => {
  //   if (!userId) return;
  //
  //   const setupPushNotifications = async () => {
  //     try {
  //       const PushService = await import('../services/push-notification-service');
  //
  //       if (!PushService.isPushNotificationSupported()) {
  //         return;
  //       }
  //
  //       const hasPermission = await PushService.requestNotificationPermissions();
  //       if (!hasPermission) return;
  //
  //       const token = await PushService.getExpoPushToken();
  //       if (!token) return;
  //
  //       await PushService.registerPushToken(userId, token);
  //     } catch (err) {
  //       console.error('[PUSH] Error setting up push notifications:', err);
  //     }
  //   };
  //
  //   setupPushNotifications();
  // }, [userId]);

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

    // Subscribe to real-time updates (wrapped in try-catch to not break other channels)
    try {
      const channel = NotificationService.subscribeToNotifications(
        userId,
        // On new notification
        (notification) => {
          console.log('[NOTIFICATIONS HOOK] New notification:', notification.id);
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        },
        // On update (e.g., marked as read)
        async (notification) => {
          console.log(
            '[NOTIFICATIONS HOOK] 🟡 UPDATE callback triggered for notification:',
            notification.id
          );
          console.log('[NOTIFICATIONS HOOK] 🟡 Notification read status:', notification.read);

          // Update notification in list if we have it
          setNotifications((prev) => {
            const oldNotification = prev.find((n) => n.id === notification.id);
            if (oldNotification) {
              console.log('[NOTIFICATIONS HOOK] 📝 Found notification in list, updating it');
              return prev.map((n) => (n.id === notification.id ? notification : n));
            } else {
              console.log(
                '[NOTIFICATIONS HOOK] ⚠️ Notification not in list (explore tab?), keeping list unchanged'
              );
            }
            return prev;
          });

          // Debounce refetching unread count to avoid multiple simultaneous calls
          // when marking all as read (which triggers multiple UPDATE events)
          if (refetchTimeoutRef.current) {
            console.log('[NOTIFICATIONS HOOK] ⏱️ Clearing previous refetch timeout');
            clearTimeout(refetchTimeoutRef.current);
          }

          console.log('[NOTIFICATIONS HOOK] ⏱️ Setting refetch timeout (300ms)');
          refetchTimeoutRef.current = setTimeout(async () => {
            console.log(
              '[NOTIFICATIONS HOOK] 🔄 Refetch timeout fired, fetching unread count from DB'
            );
            try {
              const count = await NotificationService.getUnreadCount(userId);
              console.log('[NOTIFICATIONS HOOK] ✅ Fetched unread count from DB:', count);
              setUnreadCount((prev) => {
                console.log(
                  '[NOTIFICATIONS HOOK] 📝 Updating unread count from',
                  prev,
                  'to',
                  count
                );
                return count;
              });
            } catch (err) {
              console.error('[NOTIFICATIONS HOOK] ❌ Error refetching unread count:', err);
            }
          }, 300); // Wait 300ms after last update event
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
    } catch (err) {
      console.error('[NOTIFICATIONS HOOK] Failed to setup realtime, continuing without it:', err);
      // Don't throw - allow app to work without notification realtime
    }

    // Cleanup
    return () => {
      console.log('[NOTIFICATIONS HOOK] Cleaning up realtime');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
        refetchTimeoutRef.current = null;
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

    console.log('[NOTIFICATIONS HOOK] 🔵 markAllAsRead called for user:', userId);
    console.log('[NOTIFICATIONS HOOK] 🔵 Current unread count before:', unreadCount);

    try {
      await NotificationService.markAllAsRead(userId);

      console.log('[NOTIFICATIONS HOOK] ✅ API call successful, doing optimistic update');

      // Optimistic update
      const now = new Date().toISOString();
      setNotifications((prev) => {
        console.log('[NOTIFICATIONS HOOK] 📝 Updating', prev.length, 'notifications to read');
        return prev.map((n) => ({ ...n, read: true, read_at: now }));
      });
      setUnreadCount((prev) => {
        console.log('[NOTIFICATIONS HOOK] 📝 Setting unread count from', prev, 'to 0');
        return 0;
      });
    } catch (err) {
      console.error('[NOTIFICATIONS HOOK] ❌ Error marking all as read:', err);
      throw err;
    }
  }, [userId, unreadCount]);

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
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
