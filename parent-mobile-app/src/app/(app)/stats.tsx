import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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

import { AppColors } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { StatCard } from '@/components/ui/StatCard';
import api from '../../lib/api';
import { getApiError } from '../../lib/auth';

interface ChildSummary {
  id: number;
  full_name: string;
  school_id: number | null;
  school: { id: number; name: string } | null;
  profile_photo: string | null;
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
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" backgroundColor={AppColors.white} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>İstatistikler</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={AppColors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={44} color={AppColors.surfaceContainer} />
            </View>
            <Text style={styles.emptyTitle}>Henüz Çocuk Eklenmemiş</Text>
            <Text style={styles.emptyText}>İstatistik görmek için önce bir çocuk ekleyin.</Text>
            <Button
              label="Çocuk Ekle"
              variant="primary"
              onPress={() => router.push('/(app)/children/add')}
              icon={<Ionicons name="add" size={18} color={AppColors.white} />}
            />
          </View>
        ) : (
          <>
            {/* Çocuk seçici — yatay scroll pill row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.childPills}
            >
              {children.map((c) => {
                const active = selectedChild?.id === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.childPill, active && styles.childPillActive]}
                    onPress={() => setSelectedChild(c)}
                    activeOpacity={0.7}
                  >
                    <Avatar
                      name={c.full_name}
                      size={32}
                      shape="circle"
                      color={active ? AppColors.white : AppColors.primary}
                      uri={c.profile_photo}
                    />
                    <Text style={[styles.childPillText, active && styles.childPillTextActive]} numberOfLines={1}>
                      {c.full_name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {loadingStats ? (
              <View style={styles.statsLoader}>
                <ActivityIndicator size="large" color={AppColors.primary} />
              </View>
            ) : stats ? (
              <>
                {/* Kayıt Bilgisi */}
                <View>
                  <SectionLabel>Kayıt Bilgisi</SectionLabel>
                  <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconBox}>
                        <Ionicons name="school-outline" size={18} color={AppColors.primary} />
                      </View>
                      <View style={styles.infoBody}>
                        <Text style={styles.infoRowLabel}>Okul</Text>
                        {stats.school ? (
                          <TouchableOpacity
                            onPress={() => stats.school && router.push(`/(app)/schools/${stats.school.id}`)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.infoRowValueLink}>{stats.school.name}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.infoRowValueMuted}>Okula kayıtlı değil</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconBox}>
                        <Ionicons name="book-outline" size={18} color={AppColors.secondary} />
                      </View>
                      <View style={styles.infoBody}>
                        <Text style={styles.infoRowLabel}>Sınıf</Text>
                        {stats.classes.length > 0 ? (
                          <Text style={styles.infoRowValue}>{stats.classes.map((c) => c.name).join(', ')}</Text>
                        ) : (
                          <Text style={styles.infoRowValueMuted}>Sınıfa atanmadı</Text>
                        )}
                      </View>
                    </View>
                  </Card>
                </View>

                {/* Devam Durumu */}
                <View>
                  <View style={styles.sectionHeaderRow}>
                    <SectionLabel style={styles.sectionLabelFlex}>Devam Durumu</SectionLabel>
                    {attendanceRate !== null && (
                      <View style={styles.rateBadge}>
                        <Text style={styles.rateBadgeText}>%{attendanceRate} Devam</Text>
                      </View>
                    )}
                  </View>

                  {stats.attendance.total === 0 ? (
                    <Card style={styles.noDataCard}>
                      <Text style={styles.noDataText}>Henüz yoklama kaydı yok.</Text>
                    </Card>
                  ) : (
                    <>
                      <View style={styles.statGrid}>
                        <StatCard
                          value={stats.attendance.present}
                          label="Geldi"
                          accentColor={AppColors.success}
                          icon={<Ionicons name="checkmark-circle" size={24} color={AppColors.success} />}
                        />
                        <StatCard
                          value={stats.attendance.absent}
                          label="Gelmedi"
                          accentColor={AppColors.error}
                          icon={<Ionicons name="close-circle" size={24} color={AppColors.error} />}
                        />
                        <StatCard
                          value={stats.attendance.late}
                          label="Geç Geldi"
                          accentColor={AppColors.warning}
                          icon={<Ionicons name="time" size={24} color={AppColors.warning} />}
                        />
                        <StatCard
                          value={stats.attendance.excused}
                          label="İzinli"
                          accentColor={AppColors.info}
                          icon={<Ionicons name="document-text" size={24} color={AppColors.info} />}
                        />
                      </View>

                      {/* Görsel bar */}
                      <Card style={styles.barCard}>
                        <View style={styles.barContainer}>
                          {stats.attendance.present > 0 && (
                            <View style={[styles.barSegment, { flex: stats.attendance.present, backgroundColor: AppColors.success }]} />
                          )}
                          {stats.attendance.late > 0 && (
                            <View style={[styles.barSegment, { flex: stats.attendance.late, backgroundColor: AppColors.warning }]} />
                          )}
                          {stats.attendance.excused > 0 && (
                            <View style={[styles.barSegment, { flex: stats.attendance.excused, backgroundColor: AppColors.info }]} />
                          )}
                          {stats.attendance.absent > 0 && (
                            <View style={[styles.barSegment, { flex: stats.attendance.absent, backgroundColor: AppColors.error }]} />
                          )}
                        </View>
                        <Text style={styles.totalLabel}>Toplam {stats.attendance.total} kayıt</Text>
                      </Card>
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
  safeArea: { flex: 1, backgroundColor: AppColors.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainer,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: AppColors.primary, letterSpacing: -0.3 },

  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 16, backgroundColor: AppColors.surface },

  // Child pills
  childPills: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  childPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: AppColors.surfaceContainer,
  },
  childPillActive: {
    backgroundColor: AppColors.primary,
  },
  childPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.onSurfaceVariant,
    maxWidth: 80,
  },
  childPillTextActive: {
    color: AppColors.white,
  },

  statsLoader: { paddingVertical: 60, alignItems: 'center' },

  // Info card
  infoCard: { padding: 0, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  infoBody: { flex: 1 },
  infoRowLabel: { fontSize: 11, color: AppColors.onSurfaceVariant, fontWeight: '600', marginBottom: 2 },
  infoRowValue: { fontSize: 14, fontWeight: '700', color: AppColors.onSurface },
  infoRowValueLink: { fontSize: 14, fontWeight: '700', color: AppColors.primary },
  infoRowValueMuted: { fontSize: 13, color: AppColors.onSurfaceVariant, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: AppColors.surfaceContainerLow, marginHorizontal: 14 },

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionLabelFlex: { marginBottom: 0 },
  rateBadge: {
    backgroundColor: AppColors.successContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  rateBadgeText: { color: AppColors.success, fontSize: 12, fontWeight: '700' },

  // Stat grid
  statGrid: { flexDirection: 'row', gap: 8 },

  // Bar card
  barCard: { padding: 16, gap: 10 },
  barContainer: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: AppColors.surfaceContainer,
  },
  barSegment: { height: 10 },
  totalLabel: { fontSize: 12, color: AppColors.onSurfaceVariant, textAlign: 'right', fontWeight: '600' },

  noDataCard: { alignItems: 'center', padding: 24 },
  noDataText: { fontSize: 14, color: AppColors.onSurfaceVariant },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: AppColors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: AppColors.onSurface },
  emptyText: { fontSize: 13, color: AppColors.onSurfaceVariant, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20, marginBottom: 8 },
});
