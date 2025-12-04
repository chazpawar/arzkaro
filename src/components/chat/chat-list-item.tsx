import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, Typography } from '../../constants/styles';

interface ChatListItemProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isGroup?: boolean;
  onPress: () => void;
}

function ChatListItem({
  name,
  avatarUrl,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  isGroup = false,
  onPress,
}: ChatListItemProps) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      onPress={onPress}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, isGroup && styles.avatarGroup]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        {isGroup && (
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>G</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {lastMessageTime && (
            <Text style={[styles.time, unreadCount > 0 && styles.timeUnread]}>
              {formatTime(lastMessageTime)}
            </Text>
          )}
        </View>

        <View style={styles.previewRow}>
          <Text style={[styles.preview, unreadCount > 0 && styles.previewUnread]} numberOfLines={1}>
            {lastMessage || 'No messages yet'}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  containerPressed: {
    backgroundColor: Colors.surface,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGroup: {
    backgroundColor: Colors.secondary,
  },
  avatarText: {
    ...Typography.h4,
    color: Colors.textInverse,
  },
  groupBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  groupBadgeText: {
    ...Typography.captionMedium,
    color: Colors.textInverse,
    fontSize: 10,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  time: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  timeUnread: {
    color: Colors.primary,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  previewUnread: {
    color: Colors.text,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: '600',
    fontSize: 11,
  },
});

export default memo(ChatListItem);
