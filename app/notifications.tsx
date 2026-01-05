import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/Colors';
import { Spacing, Typography } from '../src/constants/Styles';
import { useAuth } from '../src/contexts/auth-context';
import { useNotifications } from '../src/hooks/use-notifications';
import LoadingSpinner from '../src/components/ui/loading-spinner';
import type { NotificationType } from '../src/services/notification-service';

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Get icon based on notification type
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'friend_request_accepted':
      return 'person-add';
    case 'event_reminder':
      return 'time';
    case 'booking_confirmed':
      return 'checkmark-circle';
    case 'new_message':
      return 'chatbubble';
    case 'event_updated':
    case 'event_cancelled':
      return 'information-circle';
    case 'payout_completed':
      return 'cash';
    default:
      return 'notifications';
  }
};

// Get icon color based on notification type
const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'friend_request_accepted':
      return Colors.success;
    case 'event_reminder':
      return Colors.warning;
    case 'booking_confirmed':
      return Colors.primary;
    case 'new_message':
      return Colors.info;
    case 'event_updated':
      return Colors.primaryDark;
    case 'event_cancelled':
      return Colors.error;
    case 'payout_completed':
      return Colors.success;
    default:
      return Colors.textSecondary;
  }
};

// Swipeable notification component
interface SwipeableNotificationProps {
  notification: any;
  onDelete: () => void;
  children: React.ReactNode;
}

const SwipeableNotification: React.FC<SwipeableNotificationProps> = ({ onDelete, children }) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only allow horizontal swipes (more horizontal than vertical)
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10
        );
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe (negative dx)
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -100));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped more than 60px, show delete button
        if (gestureState.dx < -60) {
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
        } else {
          // Otherwise, spring back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.swipeableContainer}>
      {/* Delete button (behind the card) */}
      <View style={styles.deleteButtonContainer}>
        <Pressable onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash" size={24} color={Colors.background} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      </View>

      {/* Swipeable card */}
      <Animated.View
        style={[styles.swipeableCard, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View style={{ flex: 1 }}>{children}</View>
      </Animated.View>
    </View>
  );
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, error, markAllAsRead, deleteNotification, refresh } =
    useNotifications(user?.id);

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNotification(notificationId);
          } catch (err) {
            console.error('Error deleting notification:', err);
            Alert.alert('Error', 'Failed to delete notification. Please try again.');
          }
        },
      },
    ]);
  };

  const renderNotification = (notification: (typeof notifications)[0]) => {
    const iconName = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);

    // Get avatar from related_user or data
    const avatar =
      notification.related_user?.avatar_url || notification.data?.friend_avatar || null;

    return (
      <SwipeableNotification
        key={notification.id}
        notification={notification}
        onDelete={() => handleDeleteNotification(notification.id)}
      >
        <View
          style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}
        >
          {/* Left side: Avatar or Icon */}
          <View style={styles.notificationLeft}>
            {avatar ? (
              <View style={styles.avatarContainer}>
                <Image source={{ uri: avatar }} style={styles.avatar} />
                <View style={[styles.iconBadge, { backgroundColor: iconColor }]}>
                  <Ionicons name={iconName as any} size={12} color={Colors.background} />
                </View>
              </View>
            ) : (
              <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
                <Ionicons name={iconName as any} size={24} color={iconColor} />
              </View>
            )}
          </View>

          {/* Center: Content */}
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle} numberOfLines={2}>
              {notification.title}
            </Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={styles.notificationTime}>
              {formatRelativeTime(notification.created_at)}
            </Text>
          </View>

          {/* Right side: Unread indicator */}
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
      </SwipeableNotification>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="notifications-off-outline" size={64} color={Colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        You&apos;re all caught up! We&apos;ll notify you when there&apos;s something new.
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
      </View>
      <Text style={styles.emptyTitle}>Error Loading Notifications</Text>
      <Text style={styles.emptyText}>{error}</Text>
      <Pressable style={styles.retryButton} onPress={refresh}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </Pressable>
    </View>
  );

  if (loading && notifications.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Notifications',
            headerBackTitle: 'Back',
          }}
        />
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <LoadingSpinner fullScreen />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Header with Mark All Read button */}
        {notifications.length > 0 && unreadCount > 0 && (
          <View style={styles.header}>
            <Text style={styles.headerText}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
            <Pressable onPress={markAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>Mark all as read</Text>
            </Pressable>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {error ? (
            renderError()
          ) : notifications.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.notificationsList}>
              {notifications.map((notification) => renderNotification(notification))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  markAllButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  markAllText: {
    ...Typography.bodySmallMedium,
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  notificationsList: {
    paddingVertical: Spacing.sm,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  notificationCardUnread: {
    backgroundColor: Colors.primarySoft,
  },
  notificationLeft: {
    marginRight: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSecondary,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSecondary,
  },
  notificationContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  notificationTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationMessage: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  notificationTime: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.background,
  },
  swipeableContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.error,
  },
  deleteButton: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  deleteButtonText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  swipeableCard: {
    backgroundColor: Colors.background,
  },
});
