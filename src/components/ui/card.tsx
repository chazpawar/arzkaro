import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, StyleProp } from 'react-native';
import { Colors } from '@/constants/colors';
import { BorderRadius, Spacing, Shadows } from '@/constants/styles';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
  onPress?: () => void;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export default function Card({
  children,
  style,
  variant = 'default',
  onPress,
  padding = 'medium',
}: CardProps) {
  const cardStyle = [
    styles.card,
    styles[variant],
    styles[`padding_${padding}` as keyof typeof styles],
    style,
  ];

  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [cardStyle, pressed && styles.pressed]} onPress={onPress}>
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  default: {
    // Minimal default style
  },
  elevated: {
    backgroundColor: Colors.background,
    ...Shadows.small,
    borderWidth: 0,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  padding_none: {
    padding: 0,
  },
  padding_small: {
    padding: Spacing.sm,
  },
  padding_medium: {
    padding: Spacing.md,
  },
  padding_large: {
    padding: Spacing.lg,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
});
