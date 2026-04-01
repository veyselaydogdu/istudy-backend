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

interface ClassSummary {
  id: number;
  name: string;
  school_name: string;
  student_count: number;
  attendance_summary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  } | null;
  color: string | null;
}

function getTodayString(): string {
  return new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const CLASS_COLORS = ['#208AEF', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];

function classColor(cls: ClassSummary): string {
  if (cls.color) { return cls.color; }
  return CLASS_COLORS[cls.id % CLASS_COLORS.length];
}

export default function DailyScreen() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) { setLoading(true); }
    setError(null);
    try {
      const response = await api.get<{ data: ClassSummary[] }>('/teacher/classes');
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
      void fetchData();
    }, [fetchData])
  );

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
      <View style={styles.header}>
        <Text style={styles.headerSub}>{getTodayString()}</Text>
        <Text style={styles.headerTitle}>Günlük Özet</Text>
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
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#208AEF" />
        }
        renderItem={({ item }) => {
          const color = classColor(item);
          const summary = item.attendance_summary;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(teacher-app)/classes/${item.id}/attendance`)}
              activeOpacity={0.75}
            >
              <View style={[styles.colorBar, { backgroundColor: color }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.className}>{item.name}</Text>
                  <Text style={styles.schoolName}>{item.school_name}</Text>
                </View>
                {summary ? (
                  <View style={styles.statsRow}>
                    <View style={[styles.statBadge, { backgroundColor: '#D1FAE5' }]}>
                      <Text style={[styles.statValue, { color: '#059669' }]}>{summary.present}</Text>
                      <Text style={styles.statLabel}>Geldi</Text>
                    </View>
                    <View style={[styles.statBadge, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.statValue, { color: '#DC2626' }]}>{summary.absent}</Text>
                      <Text style={styles.statLabel}>Gelmedi</Text>
                    </View>
                    <View style={[styles.statBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.statValue, { color: '#D97706' }]}>{summary.late}</Text>
                      <Text style={styles.statLabel}>Geç</Text>
                    </View>
                    <View style={[styles.statBadge, { backgroundColor: '#EDE9FE' }]}>
                      <Text style={[styles.statValue, { color: '#7C3AED' }]}>{summary.excused}</Text>
                      <Text style={styles.statLabel}>Mazeretli</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noAttendanceRow}>
                    <Ionicons name="clipboard-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.noAttendanceText}>
                      Yoklama girilmedi · {item.student_count} öğrenci
                    </Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Sınıf bulunamadı</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8FF',
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
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
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
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#1E3A5F',
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
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    gap: 2,
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  schoolName: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statBadge: {
    flex: 1,
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  noAttendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noAttendanceText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});
