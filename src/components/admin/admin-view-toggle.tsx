import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/Colors';
import { BorderRadius, Spacing } from '@/constants/Styles';

interface AdminViewToggleProps {
  variant?: 'floating' | 'inline';
}

export default function AdminViewToggle({ variant = 'floating' }: AdminViewToggleProps) {
  const { isAdmin, viewAsUser, toggleViewMode } = useAuth();

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  const isFloating = variant === 'floating';

  return (
    <Pressable
      onPress={toggleViewMode}
      style={({ pressed }) => [
        isFloating ? styles.floatingContainer : styles.inlineContainer,
        pressed && styles.pressed,
      ]}
      accessibilityLabel={viewAsUser ? 'Switch to Admin view' : 'Switch to User view'}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <Ionicons
          name={viewAsUser ? 'eye-outline' : 'shield-checkmark-outline'}
          size={isFloating ? 20 : 18}
          color={viewAsUser ? Colors.warning : Colors.primary}
        />
        <Text style={[styles.text, isFloating ? styles.floatingText : styles.inlineText]}>
          {viewAsUser ? 'Viewing as User' : 'Admin Mode'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1.5,
    borderColor: Colors.border,
    zIndex: 999,
  },
  inlineContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  text: {
    fontWeight: '600',
  },
  floatingText: {
    fontSize: 13,
    color: Colors.text,
  },
  inlineText: {
    fontSize: 14,
    color: Colors.text,
  },
  pressed: {
    opacity: 0.7,
  },
});
