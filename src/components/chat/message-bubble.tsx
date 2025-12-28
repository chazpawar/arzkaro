import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing, Typography, BorderRadius } from '../../constants/Styles';
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
    marginVertical: 2,
    paddingHorizontal: Spacing.lg,
    maxWidth: '100%',
  },
  containerOwn: {
    justifyContent: 'flex-end',
  },
  containerOther: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: Spacing.xs,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  avatarSpacer: {
    width: 28 + Spacing.xs,
  },
  bubble: {
    maxWidth: '70%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  bubbleOwn: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#EFEFEF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.text,
  },
  messageTextOwn: {
    color: Colors.textInverse,
  },
  timestamp: {
    fontSize: 9,
    color: Colors.textTertiary,
    alignSelf: 'flex-end',
    marginTop: 3,
    opacity: 0.6,
  },
  timestampOwn: {
    color: Colors.textInverse,
    opacity: 0.7,
  },
  // System message
  systemContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  systemText: {
    fontSize: 11,
    color: Colors.textTertiary,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
});

export default memo(MessageBubble);
