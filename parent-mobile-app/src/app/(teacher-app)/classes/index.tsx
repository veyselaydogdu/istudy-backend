import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

interface TeacherClass {
  id: number;
  name: string;
  school_name: string;
  student_count: number;
  color: string | null;
}

const CLASS_COLORS = [AppColors.primary, '#8B5CF6', '#EC4899', AppColors.warning, AppColors.success, AppColors.error];

function classColor(cls: TeacherClass): string {
  if (cls.color) { return cls.color; }
  return CLASS_COLORS[cls.id % CLASS_COLORS.length];
}

function ClassCard({ cls, onPress }: { cls: TeacherClass; onPress: () => void }) {
  const color = classColor(cls);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.className}>{cls.name}</Text>
          <View style={styles.countBadge}>
            <Ionicons name="people-outline" size={13} color="#208AEF" />
            <Text style={styles.countText}>{cls.student_count}</Text>
          </View>
        </View>
        <View style={styles.schoolRow}>
          <Ionicons name="location-outline" size={13} color="#9CA3AF" />
          <Text style={styles.schoolName}>{cls.school_name}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

export default function ClassesScreen() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async (isRefresh = false) => {
    if (!isRefresh) { setLoading(true); }
    setError(null);
    try {
      const response = await api.get<{ data: TeacherClass[] }>('/teacher/classes');
      setClasses(response.data.data);
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchClasses();
    }, [fetchClasses])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchClasses(true);
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
      <View style={styles.header}>
        <Text style={styles.headerSub}>Öğretmen</Text>
        <Text style={styles.headerTitle}>Sınıflarım</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={classes}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ClassCard
            cls={item}
            onPress={() => router.push(`/(teacher-app)/classes/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#208AEF" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="book-outline" size={40} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Henüz sınıf atanmadı</Text>
            <Text style={styles.emptyText}>Size atanmış sınıflar burada görünecek.</Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerSub: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: AppColors.onSurface,
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  colorBar: {
    width: 6,
    alignSelf: 'stretch',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primaryContainer,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 13,
    color: AppColors.primary,
    fontWeight: '700',
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  schoolName: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: AppColors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  emptyText: {
    fontSize: 14,
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
  },
});
