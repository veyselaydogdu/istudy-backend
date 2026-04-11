import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '../_layout';
import { useTranslation } from '@/hooks/useTranslation';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(focused: boolean, active: IoniconsName, inactive: IoniconsName) {
  return (
    <Ionicons
      name={focused ? active : inactive}
      size={24}
      color={focused ? AppColors.primary : AppColors.onSurfaceVariant}
    />
  );
}

export default function TeacherAppLayout() {
  const { teacherToken } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!teacherToken) {
      router.replace('/(auth)/teacher-login');
    }
  }, [teacherToken]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: AppColors.white,
          borderTopColor: AppColors.surfaceContainerLow,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 96 : 72,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: AppColors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('teacher.dashboard'),
          tabBarIcon: ({ focused }) => tabIcon(focused, 'home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: t('teacher.myClasses'),
          tabBarIcon: ({ focused }) => tabIcon(focused, 'book', 'book-outline'),
        }}
      />
      <Tabs.Screen
        name="daily"
        options={{
          title: t('tabs.daily'),
          tabBarIcon: ({ focused }) => tabIcon(focused, 'clipboard', 'clipboard-outline'),
        }}
      />
      <Tabs.Screen
        name="meal-menu"
        options={{
          title: t('tabs.meals'),
          tabBarIcon: ({ focused }) => tabIcon(focused, 'restaurant', 'restaurant-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarIcon: ({ focused }) => tabIcon(focused, 'person', 'person-outline'),
        }}
      />

      {/* Tab bar'da gizlenecek ekranlar */}
      <Tabs.Screen name="children" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
    </Tabs>
  );
}
