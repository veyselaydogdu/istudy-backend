import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

/**
 * StatCard — vertical stat card matching new-parent-mobile-ui stats grid:
 * - White card, border-b-4 tactile shadow
 * - Colored icon box (rounded-2xl)
 * - Large bold value
 * - Small uppercase label
 *
 * Usage:
 *   <StatCard value="84" label="GELDİ" accentColor={AppColors.primary}
 *     icon={<Ionicons name="checkmark-circle" color={AppColors.primary} size={24} />}
 *   />
 */
export function StatCard({ value, label, icon, accentColor = AppColors.surfaceContainer }: StatCardProps) {
  return (
    <View style={styles.card}>
      {icon && (
        <View style={[styles.iconBox, { borderColor: accentColor + '33' }]}>
          {icon}
        </View>
      )}
      <Text style={[styles.value, { color: accentColor !== AppColors.surfaceContainer ? accentColor : AppColors.onSurface }]}>
        {value}
      </Text>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: AppColors.surfaceContainer,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: AppColors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: AppColors.onSurfaceVariant,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});
