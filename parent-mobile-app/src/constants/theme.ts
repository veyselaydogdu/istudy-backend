/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

/** Material Design 3 inspired design tokens for the parent mobile app */
export const AppColors = {
  primary: '#2a6900',
  primaryContainer: '#84fb42',
  primaryDim: '#235b00',
  secondary: '#00628c',
  secondaryContainer: '#a3d8ff',
  secondaryDim: '#00557a',
  tertiary: '#725800',
  tertiaryContainer: '#fec700',
  surface: '#f6f6f6',
  surfaceContainer: '#e8e8e8',
  surfaceContainerLow: '#f2f2f2',
  onSurface: '#2d2f2f',
  onSurfaceVariant: '#5a5c5c',
  error: '#b02500',
  errorContainer: '#f95630',
  white: '#ffffff',
  // Semantic aliases
  success: '#16a34a',
  successContainer: '#dcfce7',
  warning: '#d97706',
  warningContainer: '#fef3c7',
  info: '#2563eb',
  infoContainer: '#dbeafe',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
