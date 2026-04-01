import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

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

export default function AppLayout() {
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
      {/* 5 Ana Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Akış',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="meal-menu"
        options={{
          title: 'Yemek Listesi',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'restaurant', 'restaurant-outline'),
          tabBarLabelStyle: {
            fontSize: 8,
            fontWeight: '600',
            marginTop: 2,
            flexWrap: 'wrap',
            textAlign: 'center',
          },
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Etkinlikler',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'flame', 'flame-outline'),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'İstatistikler',
          tabBarIcon: ({ focused }) => tabIcon(focused, 'bar-chart', 'bar-chart-outline'),
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
