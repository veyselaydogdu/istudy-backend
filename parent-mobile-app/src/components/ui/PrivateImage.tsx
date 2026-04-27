import { Image as ExpoImage, type ImageStyle } from 'expo-image';
import React from 'react';
import { useAuth } from '@/app/_layout';

interface PrivateImageProps {
  uri: string | null | undefined;
  style?: ImageStyle | ImageStyle[];
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * Private API görsellerini Authorization header ile yükler.
 * Backend'de auth:sanctum + signed middleware gerektiren tüm medya URL'leri için.
 */
export function PrivateImage({ uri, style, contentFit = 'cover' }: PrivateImageProps) {
  const { token, teacherToken } = useAuth();
  const activeToken = token ?? teacherToken;

  if (!uri) { return null; }

  return (
    <ExpoImage
      source={{
        uri,
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined,
      }}
      contentFit={contentFit}
      style={style}
    />
  );
}
