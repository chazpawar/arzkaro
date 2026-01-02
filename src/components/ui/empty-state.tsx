import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Styles';
import { Fonts } from '../../constants/Fonts';

interface EmptyStateProps {
  /**
   * Title text shown in the empty state
   */
  title: string;
  /**
   * Description/message text
   */
  message: string;
  /**
   * Icon name from Ionicons
   */
  icon?: keyof typeof Ionicons.glyphMap;
  /**
   * Optional emoji as alternative to icon
   */
  emoji?: string;
  /**
   * Optional custom image source
   */
  image?: ImageSourcePropType;
  /**
   * Optional action button
   */
  action?: {
    label: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
  };
  /**
   * Custom container style
   */
  style?: StyleProp<ViewStyle>;
}

export default function EmptyState({
  title,
  message,
  icon,
  emoji,
  image,
  action,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Icon, Image or Emoji */}
      {emoji ? (
        <Text style={styles.emoji}>{emoji}</Text>
      ) : image ? (
        <Image source={image} style={styles.image} resizeMode="contain" />
      ) : icon ? (
        <Ionicons name={icon} size={48} color={Colors.textTertiary} />
      ) : null}

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Message */}
      <Text style={styles.message}>{message}</Text>

      {/* Action Button */}
      {action && (
        <Pressable style={styles.actionButton} onPress={action.onPress}>
          {action.icon && <Ionicons name={action.icon} size={18} color={Colors.textInverse} />}
          <Text style={styles.actionButtonText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    minHeight: 200,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  image: {
    width: 48,
    height: 48,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.textInverse,
  },
});
