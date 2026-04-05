import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColors } from '@/constants/theme';

interface Tab<T extends string> {
  key: T;
  label: string;
  icon?: React.ReactNode;
}

interface TabSelectorProps<T extends string> {
  tabs: Tab<T>[];
  activeKey: T;
  onSelect: (key: T) => void;
  /** When true renders a horizontally scrollable row (for many tabs) */
  scrollable?: boolean;
}

/**
 * TabSelector — pill-style segment control matching new-parent-mobile-ui:
 * - Container: rounded, surface-container background
 * - Active pill: white background with primary text + shadow
 * - Inactive: transparent with on-surface-variant text
 */
export function TabSelector<T extends string>({
  tabs,
  activeKey,
  onSelect,
  scrollable = false,
}: TabSelectorProps<T>) {
  const inner = (
    <>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.7}
          >
            {tab.icon && <View style={styles.tabIcon}>{tab.icon}</View>}
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollOuter}
        contentContainerStyle={styles.container}
      >
        {inner}
      </ScrollView>
    );
  }

  return <View style={styles.container}>{inner}</View>;
}

const styles = StyleSheet.create({
  scrollOuter: { flexGrow: 0 },
  container: {
    flexDirection: 'row',
    backgroundColor: AppColors.surfaceContainer,
    borderRadius: 999,
    padding: 5,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    gap: 6,
  },
  tabActive: {
    backgroundColor: AppColors.white,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabIcon: {},
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.onSurfaceVariant,
  },
  tabLabelActive: {
    color: AppColors.primary,
    fontWeight: '800',
  },
});
