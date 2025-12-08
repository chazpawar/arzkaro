// ArzKaro Design System - Colors
// Modern Minimal Light Theme with Orange Accents (arz. branding)

export const Colors = {
  // Primary colors (Orange - matching arz. brand) - #ff785a
  primary: '#ff785a', // Vibrant orange accent
  primaryDark: '#e85a3b',
  primaryLight: '#ffb399',
  primarySoft: '#fff5f2', // Very light orange background

  // Secondary colors (Neutral/Soft)
  secondary: '#64748B',
  secondaryDark: '#475569',
  secondaryLight: '#94A3B8',

  // Background colors
  background: '#FFFFFF',
  surface: '#FAFAFA',
  surfaceSecondary: '#F5F5F5',

  // Text colors
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',

  // Status colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',

  // Social colors
  google: '#4285F4',
  googleRed: '#DB4437',
  googleYellow: '#F4B400',
  googleGreen: '#0F9D58',
  facebook: '#4267B2',

  // Card colors (for event cards with orange gradient)
  cardOrange: '#ff785a',
  cardOrangeLight: '#ffb399',

  // Transparent
  transparent: 'transparent',

  // Badge colors
  badgeUnread: '#ff785a',
};

// Export type for type safety
export type ColorKey = keyof typeof Colors;
