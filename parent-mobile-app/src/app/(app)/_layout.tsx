import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  label: string;
  active: IoniconsName;
  inactive: IoniconsName;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  index: { label: 'ANA SAYFA', active: 'home', inactive: 'home-outline' },
  'meal-menu': { label: 'YEMEK', active: 'restaurant', inactive: 'restaurant-outline' },
  activities: { label: 'ETKİNLİK', active: 'flame', inactive: 'flame-outline' },
  stats: { label: 'İSTATİSTİK', active: 'bar-chart', inactive: 'bar-chart-outline' },
  profile: { label: 'PROFİL', active: 'person', inactive: 'person-outline' },
};

const VISIBLE_TABS = ['index', 'meal-menu', 'activities', 'stats', 'profile'];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((r) => VISIBLE_TABS.includes(r.name));

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 6 }]}>
      {visibleRoutes.map((route) => {
        const isFocused = state.routes[state.index].key === route.key;
        const config = TAB_CONFIG[route.name];
        if (!config) { return null; }

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.tabPill, isFocused && styles.tabPillActive]}>
              <Ionicons
                name={isFocused ? config.active : config.inactive}
                size={22}
                color={isFocused ? AppColors.primary : AppColors.onSurfaceVariant}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {config.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AppLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="meal-menu" options={{ title: t('mealMenu.title') }} />
      <Tabs.Screen name="activities" options={{ title: t('activities.title') }} />
      <Tabs.Screen name="stats" options={{ title: t('stats.title') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile.title') }} />

      {/* Tab bar'da gizlenecek ekranlar */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="children" options={{ href: null }} />
      <Tabs.Screen name="schools" options={{ href: null }} />
      <Tabs.Screen name="activity-classes" options={{ href: null }} />
      <Tabs.Screen name="family" options={{ href: null }} />
      <Tabs.Screen name="invoices" options={{ href: null }} />
      <Tabs.Screen name="teachers" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 8,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabPill: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 3,
    minWidth: 56,
  },
  tabPillActive: {
    backgroundColor: `${AppColors.primary}1A`,
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: AppColors.onSurfaceVariant,
    letterSpacing: 0.4,
  },
  tabLabelActive: {
    color: AppColors.primary,
  },
});
