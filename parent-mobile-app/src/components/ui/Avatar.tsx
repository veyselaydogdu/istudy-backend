import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';

const PALETTE = [
  AppColors.primary,
  AppColors.secondary,
  AppColors.tertiary,
  '#8B5CF6',
  '#EC4899',
];

function pickColor(name: string): string {
  return PALETTE[name.charCodeAt(0) % PALETTE.length];
}

interface AvatarProps {
  name: string;
  size?: number;
  /** Square-ish rounded-2xl style (like post author avatars in mockup) vs circle */
  shape?: 'circle' | 'rounded';
  color?: string;
  /** Optional signed URL for a profile photo; shows initials when absent */
  uri?: string | null;
}

/**
 * Avatar — colored initial avatar matching new-parent-mobile-ui.
 * - `shape="circle"` → fully circular (profile avatars)
 * - `shape="rounded"` → rounded-2xl (feed post author avatars)
 * - `uri` → shows a profile photo instead of initials when provided
 */
export function Avatar({ name, size = 44, shape = 'circle', color, uri }: AvatarProps) {
  const bg = color ?? pickColor(name);
  const initial = name.charAt(0).toUpperCase();
  const borderRadius = shape === 'circle' ? size / 2 : size * 0.35;
  const fontSize = size * 0.38;

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius, backgroundColor: bg },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius }]}
        />
      ) : (
        <Text style={[styles.text, { fontSize }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  text: {
    color: AppColors.white,
    fontWeight: '800',
  },
});
