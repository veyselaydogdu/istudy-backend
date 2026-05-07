import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  hasBellNotification?: boolean;
  onBellPress?: () => void;
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  hasBellNotification = false,
  onBellPress,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="dark" backgroundColor={AppColors.surfaceContainerLow} />

      {showBack ? (
        /* Back button layout */
        <>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={AppColors.primary} />
          </TouchableOpacity>
          <Text style={styles.pageTitle} numberOfLines={1}>{title ?? ''}</Text>
        </>
      ) : (
        /* Logo layout */
        <View style={styles.left}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={20} color={AppColors.primary} />
          </View>
          <View>
            <Text style={styles.brand}>{title ?? 'iStudy'}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8} onPress={onBellPress}>
        <Ionicons name="notifications-outline" size={20} color={AppColors.primary} />
        {hasBellNotification && <View style={styles.bellDot} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: AppColors.surfaceContainerLow,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    zIndex: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.white,
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    color: AppColors.primary,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 12,
    color: AppColors.onSurfaceVariant,
    fontWeight: '600',
    lineHeight: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    color: AppColors.primary,
    letterSpacing: -0.5,
    lineHeight: 28,
    marginLeft: 12,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.error,
    borderWidth: 1.5,
    borderColor: AppColors.white,
  },
});
