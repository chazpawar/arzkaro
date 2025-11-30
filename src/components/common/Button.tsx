import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  Platform,
} from 'react-native';
import { COLORS, SHADOWS } from '@theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  fullWidth = true,
}) => {
  const getButtonHeight = () => {
    switch (size) {
      case 'small': return 40;
      case 'medium': return 52;
      case 'large': return 56;
      default: return 52;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small': return 14;
      case 'medium': return 16;
      case 'large': return 17;
      default: return 16;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          button: styles.primaryButton,
          text: styles.primaryText,
        };
      case 'secondary':
        return {
          button: styles.secondaryButton,
          text: styles.secondaryText,
        };
      case 'outline':
        return {
          button: styles.outlineButton,
          text: styles.outlineText,
        };
      case 'ghost':
        return {
          button: styles.ghostButton,
          text: styles.ghostText,
        };
      default:
        return {
          button: styles.primaryButton,
          text: styles.primaryText,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { height: getButtonHeight() },
        variantStyles.button,
        disabled && styles.disabledButton,
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? COLORS.black : COLORS.white} 
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text 
            style={[
              styles.text, 
              { fontSize: getTextSize() },
              variantStyles.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.black,
    ...SHADOWS.button,
  },
  secondaryButton: {
    backgroundColor: COLORS.backgroundLight,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.black,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
    ...Platform.select({
      ios: {
        fontWeight: '600',
      },
      android: {
        fontFamily: 'Roboto-Medium',
      },
    }),
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.black,
  },
  outlineText: {
    color: COLORS.black,
  },
  ghostText: {
    color: COLORS.black,
  },
});

export default Button;
