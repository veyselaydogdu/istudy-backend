import { Stack } from 'expo-router';
import React from 'react';

export default function TeacherChildrenLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[childId]/index" />
      <Stack.Screen name="[childId]/health" />
      <Stack.Screen name="[childId]/pickup" />
    </Stack>
  );
}
