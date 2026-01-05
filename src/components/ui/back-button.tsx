import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';

export type BackButtonVariant = 'default' | 'minimal' | 'light';

interface BackButtonProps {
  /**
   * Custom onPress handler. If not provided, defaults to router.back()
   */
  onPress?: () => void;
  /**
   * Visual variant of the back button
   * - default: Circular button with surface background and shadow (best for custom headers)
   * - minimal: Simple icon with minimal padding (best for standard headers)
   * - light: White/light colored button for dark backgrounds
   */
  variant?: BackButtonVariant;
  /**
   * Icon name to use. Defaults to 'arrow-back'
   */
  icon?: 'arrow-back' | 'chevron-back' | 'close';
  /**
   * Icon size in pixels. Defaults to 24
   */
  iconSize?: number;
  /**
   * Icon color. Auto-determined based on variant if not provided
   */
  iconColor?: string;
  /**
   * Additional custom styles for the button container
   */
  style?: ViewStyle;
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
}

export default function BackButton({
  onPress,
  variant = 'default',
  icon = 'arrow-back',
  iconSize = 24,
  iconColor,
  style,
  disabled = false,
}: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (disabled) return;
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  // Determine icon color based on variant if not explicitly provided
  const getIconColor = () => {
    if (iconColor) return iconColor;
    switch (variant) {
      case 'light':
        return Colors.textInverse;
      case 'minimal':
        return Colors.text;
      case 'default':
      default:
        return Colors.text;
    }
  };

  // Get container style based on variant
  const getContainerStyle = () => {
    switch (variant) {
      case 'minimal':
        return styles.minimalContainer;
      case 'light':
        return styles.lightContainer;
      case 'default':
      default:
        return styles.defaultContainer;
    }
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), disabled && styles.disabled, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Ionicons name={icon} size={iconSize} color={getIconColor()} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  defaultContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  minimalContainer: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
  },
});
