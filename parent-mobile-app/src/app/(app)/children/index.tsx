import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { PrivateImage } from '@/components/ui/PrivateImage';
import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

interface Child {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  blood_type: string | null;
  profile_photo: string | null;
  status: string;
  family_profile_id: number | null;
  family_name: string | null;
}

interface FamilyGroup {
  family_profile_id: number | null;
  family_name: string;
  children: Child[];
}

const AVATAR_COLORS = [AppColors.primary, '#8B5CF6', '#EC4899', AppColors.warning, AppColors.success, AppColors.error];

function avatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getAge(birthDate: string | null): string {
  if (!birthDate) { return ''; }
  const diff = Date.now() - new Date(birthDate).getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return `${age} yaş`;
}

function groupByFamily(children: Child[]): FamilyGroup[] {
  const map = new Map<number | null, FamilyGroup>();
  for (const child of children) {
    const key = child.family_profile_id;
    if (!map.has(key)) {
      map.set(key, {
        family_profile_id: key,
        family_name: child.family_name ?? 'Ailem',
        children: [],
      });
    }
    map.get(key)!.children.push(child);
  }
  return Array.from(map.values());
}

function ChildCard({ child, onPress }: { child: Child; onPress: () => void }) {
  const initials = `${child.first_name.charAt(0)}${child.last_name.charAt(0)}`.toUpperCase();
  const color = avatarColor(child.first_name);
  const genderIcon: React.ComponentProps<typeof Ionicons>['name'] =
    child.gender === 'male' ? 'male' : child.gender === 'female' ? 'female' : 'person';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        {child.profile_photo ? (
          <PrivateImage uri={child.profile_photo} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.childName}>{child.full_name}</Text>
        <View style={styles.cardMeta}>
          {child.gender && (
            <View style={styles.metaChip}>
              <Ionicons name={genderIcon} size={11} color="#6B7280" />
            </View>
          )}
          {child.birth_date && (
            <Text style={styles.metaText}>{getAge(child.birth_date)}</Text>
          )}
          {child.blood_type && (
            <View style={styles.bloodTag}>
              <Text style={styles.bloodTagText}>{child.blood_type}</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

export default function ChildrenScreen() {
  const [groups, setGroups] = useState<FamilyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = useCallback(async (isRefresh = false) => {
    if (!isRefresh) { setLoading(true); }
    setError(null);
    try {
      const response = await api.get<{ data: Child[] }>('/parent/children');
      setGroups(groupByFamily(response.data.data));
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchChildren();
    }, [fetchChildren])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchChildren(true);
  };

  const totalChildren = groups.reduce((sum, g) => sum + g.children.length, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={AppColors.surface} />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Takip Et</Text>
          <Text style={styles.headerTitle}>Çocuklarım</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(app)/children/add')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Ekle</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={AppColors.primary} />
        }
      >
        {totalChildren === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={40} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Henüz çocuk eklenmedi</Text>
            <Text style={styles.emptyText}>Çocuğunuzu ekleyerek başlayın.</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(app)/children/add')}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>İlk Çocuğu Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groups.map((group) => (
            <View key={String(group.family_profile_id)} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={styles.groupIconBox}>
                  <Ionicons name="home-outline" size={15} color={AppColors.primary} />
                </View>
                <Text style={styles.groupTitle}>{group.family_name}</Text>
                <View style={styles.groupCountBadge}>
                  <Text style={styles.groupCountText}>{group.children.length}</Text>
                </View>
              </View>
              {group.children.map((child) => (
                <ChildCard
                  key={String(child.id)}
                  child={child}
                  onPress={() => router.push(`/(app)/children/${child.id}`)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerSub: { fontSize: 13, color: AppColors.onSurfaceVariant, fontWeight: '500', marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: AppColors.onSurface },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonText: { color: AppColors.white, fontSize: 14, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: { color: AppColors.error, fontSize: 13, flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  group: { marginBottom: 8 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 16,
  },
  groupIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: AppColors.primary },
  groupCountBadge: {
    backgroundColor: AppColors.primaryContainer,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  groupCountText: { fontSize: 12, fontWeight: '800', color: AppColors.primary },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: 52, height: 52, borderRadius: 16, resizeMode: 'cover' },
  avatarText: { color: AppColors.white, fontSize: 18, fontWeight: '800' },
  cardInfo: { flex: 1 },
  childName: { fontSize: 16, fontWeight: '700', color: AppColors.onSurface, marginBottom: 5 },
  cardMeta: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  metaChip: { backgroundColor: AppColors.surfaceContainerLow, borderRadius: 6, padding: 4 },
  metaText: { fontSize: 13, color: AppColors.onSurfaceVariant },
  bloodTag: { backgroundColor: AppColors.warningContainer, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  bloodTagText: { fontSize: 11, color: AppColors.warning, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: AppColors.surfaceContainerLow,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AppColors.onSurface },
  emptyText: { fontSize: 14, color: AppColors.onSurfaceVariant, textAlign: 'center' },
  emptyButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: AppColors.primary, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 8,
  },
  emptyButtonText: { color: AppColors.white, fontSize: 14, fontWeight: '700' },
});
