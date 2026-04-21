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

/** Duolingo-inspired design tokens — Indigo palette */
export const AppColors = {
  // Primary — Indigo #5E60CE
  primary: '#5E60CE',
  primaryContainer: '#ECEEFF',
  primaryDim: '#4547A0',

  // Accent — Blue (interactive); light blue #74C0FC used as container fill
  secondary: '#4895EF',
  secondaryContainer: '#E7F5FF',
  secondaryDim: '#2E86E0',

  // Tertiary — for "YENİ!" badges / highlights
  tertiary: '#E67700',
  tertiaryContainer: '#FFD43B',

  // Surfaces
  surface: '#F8F9FA',
  surfaceContainer: '#E9ECEF',
  surfaceContainerLow: '#F1F3F5',

  // Text
  onSurface: '#212529',
  onSurfaceVariant: '#6C757D',

  // States
  error: '#E03131',
  errorContainer: '#FFE3E3',
  white: '#FFFFFF',

  // Semantic aliases
  success: '#2F9E44',
  successContainer: '#EBFBEE',
  warning: '#F08C00',
  warningContainer: '#FFF9DB',
  info: '#1971C2',
  infoContainer: '#E7F5FF',
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
