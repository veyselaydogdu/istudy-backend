import { Stack } from 'expo-router';
import React from 'react';

/**
 * Çocuklar bölümü Stack navigatörü.
 *
 * Tab → children/index  (Çocuk listesi)
 *   ├── children/add              (Çocuk ekle)
 *   ├── children/[id]/index       (Çocuk detayı)
 *   ├── children/[id]/edit        (Çocuk düzenle)
 *   └── children/[id]/health      (Sağlık bilgileri)
 *
 * Tüm ekranlar kendi topBar'ını yönettiğinden headerShown: false.
 */
export default function ChildrenLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/edit" />
      <Stack.Screen name="[id]/health" />
    </Stack>
  );
}
