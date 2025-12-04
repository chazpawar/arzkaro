import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, BorderRadius } from '../../constants/styles';
import type { Message, DMMessage } from '../../types';

interface MessageBubbleProps {
  message: Message | DMMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  onAvatarPress?: (userId: string) => void;
}

function MessageBubble({ message, isOwn, showAvatar = true, onAvatarPress }: MessageBubbleProps) {
  const user = 'user' in message ? message.user : 'sender' in message ? message.sender : null;
  const userName = user?.full_name || 'Unknown';
  const avatarUrl = user?.avatar_url;
  const initial = userName.charAt(0).toUpperCase();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // System message
  if (message.message_type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      {!isOwn && showAvatar && (
        <Pressable
          onPress={() => user?.id && onAvatarPress?.(user.id)}
          style={styles.avatarContainer}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
        </Pressable>
      )}

      {!isOwn && !showAvatar && <View style={styles.avatarSpacer} />}

      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && showAvatar && <Text style={styles.senderName}>{userName}</Text>}
        <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>{message.content}</Text>
        <Text style={[styles.timestamp, isOwn && styles.timestampOwn]}>
          {formatTime(message.created_at)}
        </Text>
      </View>

      {isOwn && <View style={styles.avatarSpacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    maxWidth: '100%',
  },
  containerOwn: {
    justifyContent: 'flex-end',
  },
  containerOther: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: Spacing.sm,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.bodySmallMedium,
    color: Colors.textInverse,
  },
  avatarSpacer: {
    width: 32 + Spacing.sm,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  bubbleOwn: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: BorderRadius.xs,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  senderName: {
    ...Typography.captionMedium,
    color: Colors.primary,
    marginBottom: 2,
  },
  messageText: {
    ...Typography.body,
    color: Colors.text,
  },
  messageTextOwn: {
    color: Colors.textInverse,
  },
  timestamp: {
    ...Typography.caption,
    color: Colors.textTertiary,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timestampOwn: {
    color: Colors.textInverse,
    opacity: 0.8,
  },
  // System message
  systemContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  systemText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
});

export default memo(MessageBubble);
