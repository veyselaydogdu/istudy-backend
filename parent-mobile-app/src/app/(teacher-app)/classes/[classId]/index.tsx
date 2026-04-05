import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../../lib/api';
import { getApiError } from '../../../../lib/auth';

interface ClassDetail {
  id: number;
  name: string;
  school_name: string;
  school_id: number;
  student_count: number;
  color: string | null;
}

interface ClassChild {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string | null;
  allergens: Array<{ id: number; name: string }>;
  medications: Array<{ id: number; name: string }>;
}

type TabType = 'students' | 'attendance' | 'reports';

const AVATAR_COLORS = [AppColors.primary, '#8B5CF6', '#EC4899', AppColors.warning, AppColors.success, AppColors.error];

function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function ChildRow({ child, classId }: { child: ClassChild; classId: string }) {
  const initials = `${child.first_name.charAt(0)}${child.last_name.charAt(0)}`.toUpperCase();
  const color = avatarColor(child.first_name);

  return (
    <TouchableOpacity
      style={styles.childRow}
      onPress={() => router.push(`/(teacher-app)/children/${child.id}`)}
      activeOpacity={0.75}
    >
      <View style={[styles.childAvatar, { backgroundColor: color }]}>
        <Text style={styles.childAvatarText}>{initials}</Text>
      </View>
      <View style={styles.childInfo}>
        <Text style={styles.childName}>{child.full_name}</Text>
        <View style={styles.badgeRow}>
          {child.allergens.length > 0 && (
            <View style={styles.allergenBadge}>
              <Ionicons name="warning-outline" size={11} color="#D97706" />
              <Text style={styles.allergenBadgeText}>Alerjen</Text>
            </View>
          )}
          {child.medications.length > 0 && (
            <View style={styles.medicationBadge}>
              <Ionicons name="medical-outline" size={11} color="#7C3AED" />
              <Text style={styles.medicationBadgeText}>İlaç</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

export default function ClassDetailScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [children, setChildren] = useState<ClassChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('students');

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) { setLoading(true); }
      setError(null);
      try {
        const [classRes, childrenRes] = await Promise.all([
          api.get<{ data: ClassDetail }>(`/teacher/classes/${classId}`),
          api.get<{ data: ClassChild[] }>(`/teacher/classes/${classId}/children`),
        ]);
        setClassDetail(classRes.data.data);
        setChildren(childrenRes.data.data);
      } catch (err: unknown) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [classId]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchData(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{classDetail?.name ?? 'Sınıf'}</Text>
          <Text style={styles.headerSub}>{classDetail?.school_name}</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Tab buttons */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'students' && styles.tabActive]}
          onPress={() => setActiveTab('students')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'students' && styles.tabTextActive]}>
            Öğrenciler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'attendance' && styles.tabActive]}
          onPress={() => {
            router.push(`/(teacher-app)/classes/${classId}/attendance`);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}>
            Devamsızlık
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.tabActive]}
          onPress={() => {
            router.push(`/(teacher-app)/classes/${classId}/reports`);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            Raporlar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Students list */}
      <FlatList
        data={children}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ChildRow child={item} classId={classId ?? ''} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#208AEF" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Öğrenci bulunamadı</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.surface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.onSurface,
  },
  headerSub: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
    marginTop: 1,
  },
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
  errorText: {
    color: AppColors.error,
    fontSize: 13,
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: AppColors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.onSurfaceVariant,
  },
  tabTextActive: {
    color: AppColors.white,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  childRow: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  childInfo: {
    flex: 1,
    gap: 5,
  },
  childName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  allergenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.warningContainer,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  allergenBadgeText: {
    fontSize: 11,
    color: AppColors.warning,
    fontWeight: '600',
  },
  medicationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EDE9FE',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  medicationBadgeText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.onSurfaceVariant,
  },
});
