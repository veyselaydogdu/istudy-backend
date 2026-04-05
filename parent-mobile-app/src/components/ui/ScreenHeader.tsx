import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  /** When true, shows the bell notification icon (default true) */
  showBell?: boolean;
  /** Show a red dot on the bell when there are notifications */
  hasBellNotification?: boolean;
}

/**
 * ScreenHeader — sticky page header matching new-parent-mobile-ui design:
 * - White background with bottom rounded corners
 * - Title in primary green
 * - Optional back button (left) / bell icon (right)
 */
export function ScreenHeader({
  title,
  onBack,
  rightElement,
  showBell = true,
  hasBellNotification = false,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={AppColors.onSurface} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      {rightElement !== undefined ? (
        rightElement
      ) : showBell ? (
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color={AppColors.onSurfaceVariant} />
          {hasBellNotification && <View style={styles.bellDot} />}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainer,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.primary,
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.error,
    borderWidth: 1.5,
    borderColor: AppColors.white,
  },
});
