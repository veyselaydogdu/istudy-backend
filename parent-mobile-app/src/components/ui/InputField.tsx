import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppColors } from '@/constants/theme';

interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  /** Show a show/hide password toggle button */
  passwordToggle?: boolean;
  error?: string;
}

/**
 * InputField — labeled text input matching new-parent-mobile-ui design:
 * - Uppercase small label (on-surface-variant)
 * - Surface-container-low background, 2px border
 * - Focus: primary border color
 * - Optional left icon, right element
 */
export function InputField({
  label,
  icon,
  rightElement,
  passwordToggle = false,
  error,
  secureTextEntry,
  style,
  ...rest
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = passwordToggle ? !showPassword : secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          error ? styles.inputRowError : undefined,
        ]}
      >
        {icon && <View style={styles.iconLeft}>{icon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={AppColors.surfaceContainer}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isSecure}
          {...rest}
        />
        {passwordToggle && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.toggleText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
        {rightElement && !passwordToggle && rightElement}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surfaceContainerLow,
    borderWidth: 2,
    borderColor: AppColors.surfaceContainer,
    borderBottomWidth: 3,
    borderBottomColor: '#CED4DA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  inputRowFocused: {
    borderColor: AppColors.primary,
    borderBottomColor: AppColors.primaryDim,
    backgroundColor: AppColors.white,
  },
  inputRowError: {
    borderColor: AppColors.error,
  },
  iconLeft: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: AppColors.onSurface,
    padding: 0,
  },
  toggleText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: AppColors.error,
    fontWeight: '600',
    marginLeft: 2,
  },
});
