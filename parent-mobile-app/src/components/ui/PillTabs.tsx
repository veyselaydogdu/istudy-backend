import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColors } from '@/constants/theme';

const PILL_HEIGHT = 44;

export interface PillTabItem<T extends string> {
  key: T;
  label: string;
  /** Optional icon rendered before the label. Hidden when showIcons=false. */
  icon?: React.ReactNode;
}

interface PillTabsProps<T extends string> {
  items: PillTabItem<T>[];
  activeKey: T;
  onSelect: (key: T) => void;
  /** Show or hide icons for all items. Defaults to true. */
  showIcons?: boolean;
  /** Wrap items in a horizontal ScrollView. Defaults to true. */
  scrollable?: boolean;
  /** Override pill height. Defaults to 44. */
  pillHeight?: number;
  /** Fix each pill to a specific width. */
  pillWidth?: number;
  style?: object;
}

export function PillTabs<T extends string>({
  items,
  activeKey,
  onSelect,
  showIcons = true,
  scrollable = true,
  pillHeight,
  pillWidth,
  style,
}: PillTabsProps<T>) {
  const pillSizeStyle = {
    height: pillHeight ?? PILL_HEIGHT,
    ...(pillWidth != null && { width: pillWidth }),
  };

  const content = items.map((item) => {
    const isActive = item.key === activeKey;
    return (
      <TouchableOpacity
        key={item.key}
        style={[styles.pill, pillSizeStyle, isActive && styles.pillActive, showIcons && item.icon != null && styles.pillWithIcon]}
        onPress={() => onSelect(item.key)}
        activeOpacity={0.8}
      >
        {showIcons && item.icon != null && (
          <View style={styles.iconWrap}>{item.icon}</View>
        )}
        <Text style={[styles.label, isActive && styles.labelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollOuter}
        contentContainerStyle={[styles.row, style]}
      >
        {content}
      </ScrollView>
    );
  }

  return <View style={[styles.row, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  scrollOuter: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: AppColors.white,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  pillActive: {
    backgroundColor: AppColors.primary,
    borderBottomWidth: 4,
    borderBottomColor: AppColors.primaryDim,
    paddingTop: 4,
    shadowOpacity: 0,
    elevation: 0,
  },
  pillWithIcon: {
    paddingLeft: 8,
  },
  iconWrap: {},
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  labelActive: {
    color: AppColors.white,
  },
});