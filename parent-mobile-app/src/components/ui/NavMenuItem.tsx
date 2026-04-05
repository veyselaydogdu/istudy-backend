import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColors } from '@/constants/theme';

interface NavMenuItemProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel?: string;
  onPress?: () => void;
  badge?: number | boolean;
  rightElement?: React.ReactNode;
  showDivider?: boolean;
}

/**
 * NavMenuItem — profile menu row matching new-parent-mobile-ui:
 * - Surface-container rounded icon box
 * - Bold label, optional sublabel
 * - ChevronRight or badge on right
 */
export function NavMenuItem({
  icon,
  label,
  sublabel,
  onPress,
  badge,
  rightElement,
  showDivider = false,
}: NavMenuItemProps) {
  return (
    <>
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color={AppColors.primary} />
        </View>
        <View style={styles.textArea}>
          <Text style={styles.label}>{label}</Text>
          {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
        </View>
        {rightElement !== undefined ? (
          rightElement
        ) : badge ? (
          <View style={styles.badge}>
            {typeof badge === 'number' ? (
              <Text style={styles.badgeText}>{badge}</Text>
            ) : (
              <View style={styles.badgeDot} />
            )}
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={AppColors.surfaceContainer} />
        )}
      </TouchableOpacity>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textArea: { flex: 1 },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  sublabel: {
    fontSize: 11,
    color: AppColors.onSurfaceVariant,
    fontWeight: '500',
    marginTop: 2,
  },
  badge: {
    backgroundColor: AppColors.error,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: AppColors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.white,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.surfaceContainerLow,
    marginHorizontal: 16,
  },
});
