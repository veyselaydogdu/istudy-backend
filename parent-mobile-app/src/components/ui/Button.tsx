import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
  View,
} from 'react-native';

import { AppColors } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  label: string;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      style={[
        styles.base,
        vs.container,
        ss.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={vs.spinnerColor} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.label, vs.label, ss.label]}>{label}</Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.55,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});

const sizeStyles: Record<Size, { container: object; label: object }> = {
  sm: {
    container: { paddingVertical: 10, paddingHorizontal: 16 },
    label: { fontSize: 13 },
  },
  md: {
    container: { paddingVertical: 15, paddingHorizontal: 20 },
    label: { fontSize: 15 },
  },
  lg: {
    container: { paddingVertical: 18, paddingHorizontal: 24 },
    label: { fontSize: 17 },
  },
};

const variantStyles: Record<Variant, { container: object; label: object; spinnerColor: string }> = {
  primary: {
    container: {
      backgroundColor: AppColors.primary,
      borderWidth: 2,
      borderColor: AppColors.primaryDim,
      borderBottomWidth: 5,
      borderBottomColor: AppColors.primaryDim,
      shadowColor: AppColors.primaryDim,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5,
    },
    label: { color: AppColors.white },
    spinnerColor: AppColors.white,
  },
  secondary: {
    container: {
      backgroundColor: AppColors.secondary,
      borderWidth: 2,
      borderColor: AppColors.secondaryDim,
      borderBottomWidth: 5,
      borderBottomColor: AppColors.secondaryDim,
      shadowColor: AppColors.secondaryDim,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5,
    },
    label: { color: AppColors.white },
    spinnerColor: AppColors.white,
  },
  outline: {
    container: {
      backgroundColor: AppColors.white,
      borderWidth: 2,
      borderColor: AppColors.surfaceContainer,
      borderBottomWidth: 5,
      borderBottomColor: AppColors.surfaceContainer,
      shadowColor: AppColors.onSurface,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    label: { color: AppColors.primary },
    spinnerColor: AppColors.primary,
  },
  danger: {
    container: {
      backgroundColor: AppColors.error,
      borderWidth: 2,
      borderColor: '#B02020',
      borderBottomWidth: 5,
      borderBottomColor: '#B02020',
      shadowColor: AppColors.error,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5,
    },
    label: { color: AppColors.white },
    spinnerColor: AppColors.white,
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    label: { color: AppColors.primary },
    spinnerColor: AppColors.primary,
  },
};
