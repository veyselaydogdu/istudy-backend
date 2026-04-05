import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { AppColors } from '@/constants/theme';

/**
 * SectionLabel — small uppercase section heading matching new-parent-mobile-ui:
 * "HESAP", "ÇOCUKLAR & OKULLAR", etc.
 */
export function SectionLabel({ style, children, ...rest }: TextProps) {
  return (
    <Text style={[styles.label, style]} {...rest}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.onSurfaceVariant,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
});
