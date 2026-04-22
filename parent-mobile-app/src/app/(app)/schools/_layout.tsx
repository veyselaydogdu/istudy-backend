import { Stack } from 'expo-router';
import React from 'react';

/**
 * Okullar bölümü Stack navigatörü.
 *
 * Tab → schools/index  (Okul listesi)
 *   ├── schools/join          (Okula katıl)
 *   └── schools/[id]/index    (Okul detayı + sosyal feed)
 */
export default function SchoolsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="join" />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/post/[postId]" />
    </Stack>
  );
}
