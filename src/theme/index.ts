import { Platform } from 'react-native';

// Clean design with Orange accent color
export const COLORS = {
  // Primary - Orange/Coral accent
  primary: '#F05A28',
  primaryDark: '#D94820',
  primaryLight: '#FF7A4D',
  primaryMuted: 'rgba(240, 90, 40, 0.1)',
  
  // Secondary - Gray tones
  secondary: '#666666',
  secondaryDark: '#333333',
  secondaryLight: '#999999',
  
  // Accent - Orange
  accent: '#F05A28',
  accentAlt: '#FF7A4D',
  accentLight: 'rgba(240, 90, 40, 0.15)',
  
  // Backgrounds - Clean white
  background: '#FFFFFF',
  backgroundLight: '#F8F8F8',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#FAFAFA',
  
  // Text - Black and grays
  text: '#1A1A1A',
  textSecondary: '#333333',
  textLight: '#666666',
  textGray: '#999999',
  textPlaceholder: '#AAAAAA',
  
  // Borders - Light grays
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  borderFocused: '#F05A28',
  borderDark: '#CCCCCC',
  
  // System colors
  success: '#34A853',
  error: '#EA4335',
  warning: '#FBBC04',
  info: '#4285F4',
  
  // Base
  white: '#FFFFFF',
  black: '#1A1A1A',
  
  // Overlay and shadows
  shadow: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Card backgrounds
  cardBackground: '#FFFFFF',
  cardBackgroundPressed: '#F5F5F5',
  
  // Gradient colors
  gradientPrimary: ['#F05A28', '#FF7A4D'],
  gradientSecondary: ['#333333', '#666666'],
  gradientDark: ['#1A1A1A', '#333333'],
};

// Clean sizes
export const SIZES = {
  base: 8,
  radius: 12,
  radiusSmall: 8,
  radiusLarge: 16,
  radiusXL: 24,
  radiusRound: 9999,
  
  padding: 16,
  paddingLarge: 20,
  paddingSmall: 12,
  
  margin: 16,
  marginLarge: 24,
  marginSmall: 12,
  
  // Typography Scale
  font: 16,
  fontLarge: 18,
  fontSmall: 14,
  fontXSmall: 12,
  fontCaption: 11,
  
  // Title sizes
  h1: 32,
  h2: 26,
  h3: 22,
  h4: 20,
  h5: 18,
  
  icon: 24,
  iconSmall: 20,
  iconLarge: 28,
  iconXL: 32,
  
  // Touch targets
  touchTarget: 44,
  buttonHeight: 52,
  inputHeight: 52,
  tabBarHeight: 80,
  headerHeight: Platform.OS === 'ios' ? 96 : 56,
};

// System fonts
export const FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
  semiBold: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
  bold: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
  light: Platform.OS === 'ios' ? 'System' : 'Roboto-Light',
};

// Minimal shadows
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  card: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  button: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Consistent spacing scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Animation configurations
export const ANIMATIONS = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
  },
};

// Border radius presets
export const BORDER_RADIUS = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export default {
  COLORS,
  SIZES,
  FONTS,
  SHADOWS,
  SPACING,
  ANIMATIONS,
  BORDER_RADIUS,
};
