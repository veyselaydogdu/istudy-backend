import { Stack } from 'expo-router';
import React from 'react';

export default function ClassesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[classId]/index" />
      <Stack.Screen name="[classId]/attendance" />
      <Stack.Screen name="[classId]/reports" />
    </Stack>
  );
}
