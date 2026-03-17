import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../lib/api';
import { getApiError } from '../../lib/auth';

interface ChildSummary {
  id: number;
  full_name: string;
  school_id: number | null;
  school: { id: number; name: string } | null;
}

interface ChildStats {
  child: { id: number; full_name: string };
  school: { id: number; name: string } | null;
  classes: { id: number; name: string }[];
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildSummary | null>(null);
  const [stats, setStats] = useState<ChildStats | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChildren = useCallback(async () => {
    try {
      const res = await api.get<{ data: ChildSummary[] }>('/parent/children');
      const data = res.data.data ?? [];
      setChildren(data);
      if (data.length > 0 && !selectedChild) {
        setSelectedChild(data[0]);
      }
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setLoadingChildren(false);
    }
  }, []);

  const fetchStats = useCallback(async (childId: number) => {
    setLoadingStats(true);
    try {
      const res = await api.get<{ data: ChildStats }>(`/parent/children/${childId}/stats`);
      setStats(res.data.data);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    void fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (selectedChild) {
      void fetchStats(selectedChild.id);
    }
  }, [selectedChild, fetchStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChildren();
    if (selectedChild) {
      await fetchStats(selectedChild.id);
    }
    setRefreshing(false);
  };

  const attendanceRate =
    stats && stats.attendance.total > 0
      ? Math.round((stats.attendance.present / stats.attendance.total) * 100)
      : null;

  if (loadingChildren) {
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
        <Text style={styles.headerTitle}>İstatistikler</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#208AEF" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Çocuk Seçici */}
        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👶</Text>
            <Text style={styles.emptyTitle}>Henüz Çocuk Eklenmemiş</Text>
            <Text style={styles.emptyText}>
              İstatistik görmek için önce bir çocuk ekleyin.
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(app)/children/add')}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>+ Çocuk Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Çocuk sekmeleri */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.childTabs}
              contentContainerStyle={styles.childTabsContent}
            >
              {children.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.childTab,
                    selectedChild?.id === c.id && styles.childTabActive,
                  ]}
                  onPress={() => setSelectedChild(c)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.childTabAvatar,
                      selectedChild?.id === c.id && styles.childTabAvatarActive,
                    ]}
                  >
                    <Text style={styles.childTabAvatarText}>
                      {c.full_name.charAt(0)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.childTabName,
                      selectedChild?.id === c.id && styles.childTabNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {c.full_name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loadingStats ? (
              <View style={styles.statsLoader}>
                <ActivityIndicator size="large" color="#208AEF" />
              </View>
            ) : stats ? (
              <>
                {/* Okul & Sınıf Bilgisi */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Kayıt Bilgisi</Text>
                  {stats.school ? (
                    <TouchableOpacity
                      style={styles.infoRow}
                      onPress={() => stats.school && router.push(`/(app)/schools/${stats.school.id}`)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.infoLabel}>Okul</Text>
                      <Text style={[styles.infoValue, { color: '#208AEF' }]}>
                        🏫 {stats.school.name}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Okul</Text>
                      <Text style={styles.infoValueMuted}>Okula kayıtlı değil</Text>
                    </View>
                  )}
                  {stats.classes.length > 0 ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Sınıf</Text>
                      <Text style={styles.infoValue}>
                        {stats.classes.map((c) => c.name).join(', ')}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Sınıf</Text>
                      <Text style={styles.infoValueMuted}>Sınıfa atanmadı</Text>
                    </View>
                  )}
                </View>

                {/* Devam İstatistikleri */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Devam Durumu</Text>
                    {attendanceRate !== null && (
                      <View style={styles.rateBadge}>
                        <Text style={styles.rateBadgeText}>%{attendanceRate} Devam</Text>
                      </View>
                    )}
                  </View>

                  {stats.attendance.total === 0 ? (
                    <View style={styles.noData}>
                      <Text style={styles.noDataText}>Henüz yoklama kaydı yok.</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.statGrid}>
                        <StatCard label="Geldi" value={stats.attendance.present} color="#16A34A" />
                        <StatCard label="Gelmedi" value={stats.attendance.absent} color="#DC2626" />
                        <StatCard label="Geç Geldi" value={stats.attendance.late} color="#D97706" />
                        <StatCard label="İzinli" value={stats.attendance.excused} color="#2563EB" />
                      </View>

                      {/* Görsel bar */}
                      {stats.attendance.total > 0 && (
                        <View style={styles.barContainer}>
                          {stats.attendance.present > 0 && (
                            <View
                              style={[
                                styles.barSegment,
                                {
                                  flex: stats.attendance.present,
                                  backgroundColor: '#16A34A',
                                },
                              ]}
                            />
                          )}
                          {stats.attendance.late > 0 && (
                            <View
                              style={[
                                styles.barSegment,
                                {
                                  flex: stats.attendance.late,
                                  backgroundColor: '#D97706',
                                },
                              ]}
                            />
                          )}
                          {stats.attendance.excused > 0 && (
                            <View
                              style={[
                                styles.barSegment,
                                {
                                  flex: stats.attendance.excused,
                                  backgroundColor: '#2563EB',
                                },
                              ]}
                            />
                          )}
                          {stats.attendance.absent > 0 && (
                            <View
                              style={[
                                styles.barSegment,
                                {
                                  flex: stats.attendance.absent,
                                  backgroundColor: '#DC2626',
                                },
                              ]}
                            />
                          )}
                        </View>
                      )}
                      <Text style={styles.totalLabel}>Toplam: {stats.attendance.total} kayıt</Text>
                    </>
                  )}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  container: { paddingVertical: 16, paddingHorizontal: 20, gap: 16 },
  // Çocuk seçici
  childTabs: { marginHorizontal: -20 },
  childTabsContent: { paddingHorizontal: 20, gap: 12 },
  childTab: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  childTabActive: {},
  childTabAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  childTabAvatarActive: {
    backgroundColor: '#208AEF',
    borderColor: '#208AEF',
  },
  childTabAvatarText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  childTabName: { fontSize: 11, color: '#6B7280', fontWeight: '500', maxWidth: 56, textAlign: 'center' },
  childTabNameActive: { color: '#208AEF', fontWeight: '700' },
  statsLoader: { paddingVertical: 60, alignItems: 'center' },
  // Kartlar
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#1F2937', fontWeight: '600', textAlign: 'right', flex: 1, paddingLeft: 12 },
  infoValueMuted: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', textAlign: 'right', flex: 1, paddingLeft: 12 },
  rateBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  rateBadgeText: { color: '#059669', fontSize: 12, fontWeight: '700' },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 3,
    gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600', textAlign: 'center' },
  barContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  barSegment: { height: 8 },
  totalLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 8, textAlign: 'right' },
  noData: { paddingVertical: 20, alignItems: 'center' },
  noDataText: { fontSize: 14, color: '#9CA3AF' },
  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  addButton: {
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
