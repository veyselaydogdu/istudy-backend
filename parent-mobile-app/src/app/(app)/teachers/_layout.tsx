import { Stack } from 'expo-router';
import React from 'react';

export default function TeachersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/blog/[blogId]" />
    </Stack>
  );
}
