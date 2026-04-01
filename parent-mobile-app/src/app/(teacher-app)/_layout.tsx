import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '../_layout';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(focused: boolean, active: IoniconsName, inactive: IoniconsName) {
  return (
    <Ionicons
      name={focused ? active : inactive}
      size={24}
      color={focused ? '#208AEF' : '#9CA3AF'}
    />
  );
}

export default function TeacherAppLayout() {
  const { teacherToken } = useAuth();

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
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F3F4F6',
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
        tabBarActiveTintColor: '#208AEF',
        tabBarInactiveTintColor: '#9CA3AF',
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
          title: 'Anasayfa',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Sınıflarım',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'book', 'book-outline'),
        }}
      />
      <Tabs.Screen
        name="daily"
        options={{
          title: 'Günlük',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'clipboard', 'clipboard-outline'),
        }}
      />
      <Tabs.Screen
        name="meal-menu"
        options={{
          title: 'Yemek',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'restaurant', 'restaurant-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'person', 'person-outline'),
        }}
      />

      {/* Tab bar'da gizlenecek ekranlar */}
      <Tabs.Screen name="children" options={{ href: null }} />
    </Tabs>
  );
}
