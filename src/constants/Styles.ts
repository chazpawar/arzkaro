import { StyleSheet } from 'react-native';
import { Fonts } from './Fonts';

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius scale
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// Typography scale
export const Typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontFamily: Fonts.bold as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontFamily: Fonts.semiBold as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontFamily: Fonts.semiBold as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontFamily: Fonts.semiBold as const,
    lineHeight: 24,
  },
  // Body text
  body: {
    fontSize: 16,
    fontFamily: Fonts.regular as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 18,
    fontFamily: Fonts.regular as const,
    lineHeight: 26,
  },
  bodyMedium: {
    fontSize: 16,
    fontFamily: Fonts.medium as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontFamily: Fonts.regular as const,
    lineHeight: 20,
  },
  bodySmallMedium: {
    fontSize: 14,
    fontFamily: Fonts.medium as const,
    lineHeight: 20,
  },
  // Caption
  caption: {
    fontSize: 12,
    fontFamily: Fonts.regular as const,
    lineHeight: 16,
  },
  captionMedium: {
    fontSize: 12,
    fontFamily: Fonts.medium as const,
    lineHeight: 16,
  },
  // Labels
  label: {
    fontSize: 14,
    fontFamily: Fonts.semiBold as const,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: 12,
    fontFamily: Fonts.semiBold as const,
    lineHeight: 16,
  },
};

// Shadow presets
export const Shadows = StyleSheet.create({
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
});

// Layout helpers
export const Layout = {
  screenPadding: Spacing.lg,
  cardPadding: Spacing.md,
  inputHeight: 48,
  buttonHeight: 48,
  headerHeight: 56,
  tabBarHeight: 60,
  maxContentWidth: 600,
};
