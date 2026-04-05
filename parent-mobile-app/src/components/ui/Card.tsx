import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { AppColors } from '@/constants/theme';

interface CardProps extends ViewProps {
  /** Border-bottom color for the tactile 3D shadow effect */
  accentColor?: string;
  padding?: number;
}

/**
 * Card — white card with border-b-4 tactile bottom shadow, matching new-parent-mobile-ui design.
 *
 * Usage:
 *   <Card>…content…</Card>
 *   <Card accentColor={AppColors.primary}>…</Card>
 */
export function Card({ children, style, accentColor, padding = 16, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { borderBottomColor: accentColor ?? AppColors.surfaceContainer, padding },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    borderBottomWidth: 4,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
});
