import { Stack } from 'expo-router';
import React from 'react';

/**
 * Aile bölümü Stack navigatörü.
 *
 * Tab → family/index       (Aileler listesi + davetler)
 *   └── family/[ulid]      (Aile detayı: üyeler)
 *   └── family/emergency   (Acil durum kişileri — familyUlid param ile)
 */
export default function FamilyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[ulid]" />
      <Stack.Screen name="emergency" />
    </Stack>
  );
}
