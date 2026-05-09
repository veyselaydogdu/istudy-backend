import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { AppColors } from '@/constants/theme';
import { AppHeader } from '@/components/ui/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PillTabs } from '@/components/ui/PillTabs';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { StatCard } from '@/components/ui/StatCard';
import api from '../../lib/api';
import { getApiError } from '../../lib/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface MoodDay {
  date: string;
  is_today: boolean;
  mood: string | null;
  appetite: string | null;
  attendance_status: string | null;
  has_report: boolean;
  notes: string | null;
  parent_notes: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TR_MONTHS_FULL = [
  'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık',
];
const TR_DAYS_SHORT = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'];

const MOOD_CONFIG = {
  happy:   { emoji: '😀', color: AppColors.success, bg: '#DCFCE7', label: 'Mutlu' },
  neutral: { emoji: '😐', color: '#6366F1',         bg: '#EEF2FF', label: 'Normal' },
  sad:     { emoji: '😔', color: AppColors.error,   bg: '#FEE2E2', label: 'Üzgün' },
} as const;
type MoodKey = keyof typeof MOOD_CONFIG;

const APPETITE_CONFIG = {
  good: { emoji: '😋', color: AppColors.success,  bg: '#DCFCE7', label: 'İyi' },
  fair: { emoji: '🙂', color: '#F59E0B',           bg: '#FEF3C7', label: 'Orta' },
  poor: { emoji: '😕', color: AppColors.error,    bg: '#FEE2E2', label: 'Az' },
} as const;
type AppetiteKey = keyof typeof APPETITE_CONFIG;

const ATTENDANCE_LABELS: Record<string, string> = {
  present: 'Geldi', late: 'Geç Geldi', absent: 'Gelmedi', excused: 'Mazeretli',
};

const PERIOD_TABS = [
  { key: 'monthly', label: 'Aylık' },
  { key: 'weekly',  label: 'Haftalık' },
] as const;

// 0=Mon … 6=Sun (ISO)
function dayOfWeek(dateStr: string): number {
  return (new Date(dateStr + 'T00:00:00').getDay() + 6) % 7;
}

// ─── AnimatedBar ──────────────────────────────────────────────────────────────

function AnimatedBar({ h, color }: { h: number; color: string }) {
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withSpring(h, { damping: 14, stiffness: 100, mass: 0.8 });
  }, [h]);

  const animStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View style={[{ borderRadius: 6, width: '100%', backgroundColor: color }, animStyle]} />
  );
}

// ─── MoodSection ──────────────────────────────────────────────────────────────

const TRACK_H = 88;

function MoodSection({ childId, refreshToken }: { childId: number; refreshToken: number }) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly');
  const [weekIdx, setWeekIdx] = useState(0);
  const [data, setData] = useState<MoodDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<MoodDay | null>(null);

  const isAtCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const todayStr = now.toISOString().slice(0, 10);

  const prevMonth = () => {
    setWeekIdx(0);
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else { setMonth(m => m - 1); }
  };
  const nextMonth = () => {
    if (isAtCurrentMonth) { return; }
    setWeekIdx(0);
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else { setMonth(m => m + 1); }
  };

  useEffect(() => {
    setLoading(true);
    api.get(`/parent/children/${childId}/reports`, { params: { year, month } })
      .then(res => { setData(res.data.data ?? []); })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [childId, year, month, refreshToken]);

  // ── Monthly grid ──────────────────────────────────────────────────────────

  const firstDow = data.length > 0 ? dayOfWeek(data[0].date) : 0;
  const gridPadding = Array<null>(firstDow).fill(null);
  const gridCells: (MoodDay | null)[] = [...gridPadding, ...data];
  while (gridCells.length % 7 !== 0) { gridCells.push(null); }
  const rows = Math.ceil(gridCells.length / 7);

  // ── Weekly view ───────────────────────────────────────────────────────────

  const weeks: MoodDay[][] = [];
  for (let i = 0; i < data.length; i += 7) { weeks.push(data.slice(i, i + 7)); }
  const maxWeekIdx = Math.max(0, weeks.length - 1);
  const currentWeek = weeks[weekIdx] ?? [];

  // ── Counts ────────────────────────────────────────────────────────────────

  const moodCounts = data.reduce<Partial<Record<MoodKey, number>>>((acc, d) => {
    if (d.mood && d.mood in MOOD_CONFIG) {
      const k = d.mood as MoodKey;
      acc[k] = (acc[k] ?? 0) + 1;
    }
    return acc;
  }, {});

  const appetiteCounts = data.reduce<Partial<Record<AppetiteKey, number>>>((acc, d) => {
    if (d.appetite && d.appetite in APPETITE_CONFIG) {
      const k = d.appetite as AppetiteKey;
      acc[k] = (acc[k] ?? 0) + 1;
    }
    return acc;
  }, {});

  // ── Monthly cell render ───────────────────────────────────────────────────

  const renderDayCell = (day: MoodDay | null, key: string | number) => {
    if (!day) { return <View key={key} style={moodStyles.cell} />; }
    const moodCfg  = day.mood    ? MOOD_CONFIG[day.mood as MoodKey]                  ?? null : null;
    const appCfg   = day.appetite ? APPETITE_CONFIG[day.appetite as AppetiteKey]     ?? null : null;
    const isFuture = day.date > todayStr;
    const dayNum   = new Date(day.date + 'T00:00:00').getDate();
    const hasNote  = Boolean(day.notes);
    return (
      <TouchableOpacity
        key={key}
        style={[
          moodStyles.cell,
          moodStyles.dayCell,
          moodCfg && { backgroundColor: moodCfg.bg },
          day.is_today && moodStyles.todayCell,
          isFuture && moodStyles.futureCell,
        ]}
        onPress={() => !isFuture && setSelectedDay(day)}
        activeOpacity={0.7}
        disabled={isFuture}
      >
        {moodCfg
          ? <Text style={moodStyles.cellEmoji}>{moodCfg.emoji}</Text>
          : <Text style={[moodStyles.cellDayNum, day.is_today && { color: AppColors.primary, fontWeight: '800' }]}>{dayNum}</Text>
        }
        {appCfg && <View style={[moodStyles.appetiteDot, { backgroundColor: appCfg.color }]} />}
        {hasNote && <View style={moodStyles.noteIndicatorWrap}><Ionicons name="information-circle" size={9} color={AppColors.primary} /></View>}
      </TouchableOpacity>
    );
  };

  const renderMonthly = () => (
    <View style={{ gap: 3 }}>
      <View style={moodStyles.gridRow}>
        {TR_DAYS_SHORT.map(d => (
          <View key={d} style={[moodStyles.cell, { height: 22 }]}>
            <Text style={moodStyles.dayHeader}>{d}</Text>
          </View>
        ))}
      </View>
      {Array.from({ length: rows }, (_, wi) => (
        <View key={wi} style={moodStyles.gridRow}>
          {gridCells.slice(wi * 7, wi * 7 + 7).map((cell, di) =>
            renderDayCell(cell, `${wi}-${di}`)
          )}
        </View>
      ))}
      <View style={moodStyles.calLegend}>
        <View style={moodStyles.legendItem}>
          <View style={[moodStyles.legendDot, { backgroundColor: AppColors.success }]} />
          <Text style={moodStyles.legendText}>Duygu rengi</Text>
        </View>
        <View style={moodStyles.legendItem}>
          <View style={[moodStyles.legendDotSmall, { backgroundColor: AppColors.success }]} />
          <Text style={moodStyles.legendText}>İştah noktası</Text>
        </View>
      </View>
    </View>
  );

  // ── Weekly bar chart ──────────────────────────────────────────────────────

  const renderWeekly = () => (
    <View>
      <View style={moodStyles.weekNav}>
        <TouchableOpacity
          onPress={() => setWeekIdx(i => Math.max(0, i - 1))}
          style={[moodStyles.weekNavBtn, weekIdx === 0 && { opacity: 0.3 }]}
          disabled={weekIdx === 0}
        >
          <Ionicons name="chevron-back" size={16} color={AppColors.primary} />
        </TouchableOpacity>
        <Text style={moodStyles.weekNavLabel}>
          {currentWeek.length > 0
            ? `${new Date(currentWeek[0].date + 'T00:00:00').getDate()} – ${new Date(currentWeek[currentWeek.length - 1].date + 'T00:00:00').getDate()} ${TR_MONTHS_FULL[month - 1]}`
            : `${TR_MONTHS_FULL[month - 1]} ${year}`}
        </Text>
        <TouchableOpacity
          onPress={() => setWeekIdx(i => Math.min(maxWeekIdx, i + 1))}
          style={[moodStyles.weekNavBtn, weekIdx === maxWeekIdx && { opacity: 0.3 }]}
          disabled={weekIdx === maxWeekIdx}
        >
          <Ionicons name="chevron-forward" size={16} color={AppColors.primary} />
        </TouchableOpacity>
      </View>

      {/* Chart legend */}
      <View style={moodStyles.chartLegend}>
        <View style={moodStyles.legendItem}>
          <View style={[moodStyles.legendBar, { backgroundColor: AppColors.primary }]} />
          <Text style={moodStyles.legendText}>Duygu</Text>
        </View>
        <View style={moodStyles.legendItem}>
          <View style={[moodStyles.legendBar, { backgroundColor: '#F59E0B' }]} />
          <Text style={moodStyles.legendText}>İştah</Text>
        </View>
      </View>

      {/* Bar chart */}
      <View style={moodStyles.barChart}>
        {TR_DAYS_SHORT.map((dayLabel, di) => {
          const day = currentWeek[di];

          if (!day) {
            return (
              <View key={di} style={moodStyles.barCol}>
                <View style={{ height: 24 }} />
                <View style={[moodStyles.dualTrack, { opacity: 0.3 }]}>
                  <View style={moodStyles.trackBg} />
                  <View style={moodStyles.trackBg} />
                </View>
                <Text style={moodStyles.barDayLabel}>{dayLabel}</Text>
                <Text style={moodStyles.barDateNum}>—</Text>
              </View>
            );
          }

          const moodCfg   = day.mood    ? MOOD_CONFIG[day.mood as MoodKey]             ?? null : null;
          const appCfg    = day.appetite ? APPETITE_CONFIG[day.appetite as AppetiteKey] ?? null : null;
          const moodScore = day.mood === 'happy' ? 1 : day.mood === 'neutral' ? 0.67 : day.mood === 'sad' ? 0.33 : 0;
          const appScore  = day.appetite === 'good' ? 1 : day.appetite === 'fair' ? 0.67 : day.appetite === 'poor' ? 0.33 : 0;
          const moodBarH  = moodCfg  ? Math.max(8, Math.round(TRACK_H * moodScore)) : 0;
          const appBarH   = appCfg   ? Math.max(8, Math.round(TRACK_H * appScore))  : 0;
          const isFuture  = day.date > todayStr;
          const dateNum   = new Date(day.date + 'T00:00:00').getDate();

          return (
            <TouchableOpacity
              key={day.date}
              style={[moodStyles.barCol, day.is_today && moodStyles.barColToday, isFuture && { opacity: 0.3 }]}
              onPress={() => !isFuture && setSelectedDay(day)}
              disabled={isFuture}
              activeOpacity={0.75}
            >
              {/* Emoji row */}
              <View style={moodStyles.emojiRow}>
                <Text style={moodStyles.barMoodEmoji}>{moodCfg?.emoji ?? '  '}</Text>
                <Text style={moodStyles.barAppEmoji}>{appCfg?.emoji ?? '  '}</Text>
              </View>

              {/* Dual animated bars */}
              <View style={moodStyles.dualTrack}>
                {/* Mood bar */}
                <View style={{ flex: 3, position: 'relative', height: TRACK_H }}>
                  <View style={[moodStyles.trackBg, { height: TRACK_H }]} />
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                    <AnimatedBar
                      key={`m-${day.date}-${moodBarH}`}
                      h={moodBarH}
                      color={moodCfg?.color ?? AppColors.surfaceContainer}
                    />
                  </View>
                </View>

                {/* Appetite bar */}
                <View style={{ flex: 2, position: 'relative', height: TRACK_H }}>
                  <View style={[moodStyles.trackBg, { height: TRACK_H }]} />
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                    <AnimatedBar
                      key={`a-${day.date}-${appBarH}`}
                      h={appBarH}
                      color={appCfg?.color ?? AppColors.surfaceContainer}
                    />
                  </View>
                </View>
              </View>

              <Text style={[moodStyles.barDayLabel, day.is_today && { color: AppColors.primary, fontWeight: '800' }]}>
                {dayLabel}
              </Text>
              <Text style={moodStyles.barDateNum}>{dateNum}</Text>
              {day.notes ? <Ionicons name="information-circle" size={10} color={AppColors.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // ── Stats rows ────────────────────────────────────────────────────────────

  const renderStats = () => (
    <View style={{ gap: 8 }}>
      <View style={moodStyles.statsRow}>
        <Text style={moodStyles.statsRowLabel}>Duygu</Text>
        {(Object.keys(MOOD_CONFIG) as MoodKey[]).map(key => {
          const cfg = MOOD_CONFIG[key];
          return (
            <View key={key} style={[moodStyles.statPill, { backgroundColor: cfg.bg }]}>
              <Text style={moodStyles.statEmoji}>{cfg.emoji}</Text>
              <Text style={[moodStyles.statLabel, { color: cfg.color }]}>{cfg.label}</Text>
              <Text style={[moodStyles.statCount, { color: cfg.color }]}>{moodCounts[key] ?? 0}</Text>
            </View>
          );
        })}
      </View>
      <View style={moodStyles.statsRow}>
        <Text style={moodStyles.statsRowLabel}>İştah</Text>
        {(Object.keys(APPETITE_CONFIG) as AppetiteKey[]).map(key => {
          const cfg = APPETITE_CONFIG[key];
          return (
            <View key={key} style={[moodStyles.statPill, { backgroundColor: cfg.bg }]}>
              <Text style={moodStyles.statEmoji}>{cfg.emoji}</Text>
              <Text style={[moodStyles.statLabel, { color: cfg.color }]}>{cfg.label}</Text>
              <Text style={[moodStyles.statCount, { color: cfg.color }]}>{appetiteCounts[key] ?? 0}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={{ gap: 8 }}>
      <SectionLabel>Günlük Raporlar</SectionLabel>

      <Card style={{ gap: 12 }}>
        {/* Month nav */}
        <View style={moodStyles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={moodStyles.navBtn}>
            <Ionicons name="chevron-back" size={18} color={AppColors.primary} />
          </TouchableOpacity>
          <Text style={moodStyles.monthLabel}>{TR_MONTHS_FULL[month - 1]} {year}</Text>
          <TouchableOpacity
            onPress={nextMonth}
            style={[moodStyles.navBtn, isAtCurrentMonth && { opacity: 0.3 }]}
            disabled={isAtCurrentMonth}
          >
            <Ionicons name="chevron-forward" size={18} color={AppColors.primary} />
          </TouchableOpacity>
        </View>

        {/* Period toggle */}
        <PillTabs
          items={PERIOD_TABS as unknown as { key: string; label: string }[]}
          activeKey={period}
          onSelect={(k) => {
            const p = k as 'monthly' | 'weekly';
            setPeriod(p);
            if (p === 'weekly') {
              const todayDay = isAtCurrentMonth ? now.getDate() : new Date(year, month, 0).getDate();
              setWeekIdx(Math.floor((todayDay - 1) / 7));
            }
          }}
          showIcons={false}
          scrollable={false}
          pillHeight={36}
          style={{ paddingHorizontal: 0, paddingVertical: 4 }}
        />

        {loading ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={AppColors.primary} />
          </View>
        ) : data.length === 0 ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: AppColors.onSurfaceVariant }}>Bu ay için rapor girilmemiş.</Text>
          </View>
        ) : (
          <>
            {period === 'monthly' ? renderMonthly() : renderWeekly()}
            {renderStats()}
          </>
        )}
      </Card>

      {/* Detail modal */}
      <Modal
        transparent
        animationType="slide"
        visible={selectedDay != null}
        onRequestClose={() => setSelectedDay(null)}
      >
        <TouchableOpacity
          style={moodStyles.overlay}
          onPress={() => setSelectedDay(null)}
          activeOpacity={1}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={moodStyles.modalCard}>
              <View style={moodStyles.modalHandle} />

              <View style={moodStyles.modalHeader}>
                <Text style={moodStyles.modalDate}>
                  {selectedDay
                    ? new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('tr-TR', {
                        weekday: 'long', day: 'numeric', month: 'long',
                      })
                    : ''}
                </Text>
                <TouchableOpacity onPress={() => setSelectedDay(null)}>
                  <Ionicons name="close-circle" size={24} color={AppColors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              {selectedDay && (() => {
                const moodCfg = selectedDay.mood    ? MOOD_CONFIG[selectedDay.mood as MoodKey]             ?? null : null;
                const appCfg  = selectedDay.appetite ? APPETITE_CONFIG[selectedDay.appetite as AppetiteKey] ?? null : null;
                return (
                  <View style={{ gap: 10 }}>
                    {/* Mood + Appetite side by side */}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={[moodStyles.modalMoodCard, { flex: 1, backgroundColor: moodCfg?.bg ?? AppColors.surfaceContainerLow }]}>
                        <Text style={moodStyles.modalBigEmoji}>{moodCfg?.emoji ?? '😶'}</Text>
                        <Text style={moodStyles.modalCardSub}>Duygu</Text>
                        <Text style={[moodStyles.modalCardValue, { color: moodCfg?.color ?? AppColors.onSurfaceVariant }]}>
                          {moodCfg?.label ?? '—'}
                        </Text>
                      </View>
                      <View style={[moodStyles.modalMoodCard, { flex: 1, backgroundColor: appCfg?.bg ?? AppColors.surfaceContainerLow }]}>
                        <Text style={moodStyles.modalBigEmoji}>{appCfg?.emoji ?? '—'}</Text>
                        <Text style={moodStyles.modalCardSub}>İştah</Text>
                        <Text style={[moodStyles.modalCardValue, { color: appCfg?.color ?? AppColors.onSurfaceVariant }]}>
                          {appCfg?.label ?? '—'}
                        </Text>
                      </View>
                    </View>

                    {/* Attendance */}
                    {selectedDay.attendance_status && (
                      <View style={moodStyles.modalInfoRow}>
                        <Ionicons name="calendar-outline" size={16} color={AppColors.onSurfaceVariant} />
                        <Text style={moodStyles.modalInfoLabel}>Devam:</Text>
                        <Text style={moodStyles.modalInfoValue}>
                          {ATTENDANCE_LABELS[selectedDay.attendance_status] ?? selectedDay.attendance_status}
                        </Text>
                      </View>
                    )}

                    {/* Teacher notes */}
                    {selectedDay.notes && (
                      <View style={moodStyles.modalTeacherNotes}>
                        <View style={moodStyles.modalNotesTitleRow}>
                          <Ionicons name="information-circle" size={14} color={AppColors.primary} />
                          <Text style={moodStyles.modalNotesTitleTeacher}>Öğretmen Notu</Text>
                        </View>
                        <Text style={moodStyles.modalNotesText}>{selectedDay.notes}</Text>
                      </View>
                    )}

                    {/* Parent notes */}
                    {selectedDay.parent_notes && (
                      <View style={moodStyles.modalNotes}>
                        <View style={moodStyles.modalNotesTitleRow}>
                          <Ionicons name="person-circle-outline" size={14} color={AppColors.onSurfaceVariant} />
                          <Text style={moodStyles.modalNotesLabel}>Veli Notu</Text>
                        </View>
                        <Text style={moodStyles.modalNotesText}>{selectedDay.parent_notes}</Text>
                      </View>
                    )}

                    {!selectedDay.has_report && (
                      <Text style={{ fontSize: 12, color: AppColors.onSurfaceVariant, textAlign: 'center', fontStyle: 'italic' }}>
                        Bu gün için öğretmen raporu girilmemiş.
                      </Text>
                    )}
                  </View>
                );
              })()}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── StatsScreen ──────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildSummary | null>(null);
  const [stats, setStats] = useState<ChildStats | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const fetchChildren = useCallback(async () => {
    try {
      const res = await api.get<{ data: ChildSummary[] }>('/parent/children');
      const data = res.data.data ?? [];
      setChildren(data);
      if (data.length > 0 && !selectedChild) { setSelectedChild(data[0]); }
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

  useEffect(() => { void fetchChildren(); }, [fetchChildren]);

  useEffect(() => {
    if (selectedChild) { void fetchStats(selectedChild.id); }
  }, [selectedChild, fetchStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChildren();
    if (selectedChild) { await fetchStats(selectedChild.id); }
    setRefreshToken(t => t + 1);
    setRefreshing(false);
  };

  const attendanceRate = stats && stats.attendance.total > 0
    ? Math.round((stats.attendance.present / stats.attendance.total) * 100)
    : null;

  if (loadingChildren) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <View style={styles.center}><ActivityIndicator size="large" color={AppColors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar style="dark" backgroundColor={AppColors.surfaceContainerLow} />
      <AppHeader title="İstatistikler" />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={AppColors.primary} />}
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
            {/* Çocuk seçici */}
            <PillTabs
              items={children.map((c) => ({
                key: String(c.id),
                label: c.full_name.split(' ')[0],
                icon: (
                  <Avatar
                    name={c.full_name}
                    size={28}
                    shape="circle"
                    uri={c.profile_photo}
                  />
                ),
              }))}
              activeKey={String(selectedChild?.id ?? '')}
              onSelect={(key) => {
                const child = children.find((c) => String(c.id) === key);
                if (child) { setSelectedChild(child); }
              }}
              showIcons
              style={{ paddingHorizontal: 0 }}
            />

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
                        <StatCard value={stats.attendance.present} label="Geldi" accentColor={AppColors.success}
                          icon={<Ionicons name="checkmark-circle" size={24} color={AppColors.success} />} />
                        <StatCard value={stats.attendance.absent} label="Gelmedi" accentColor={AppColors.error}
                          icon={<Ionicons name="close-circle" size={24} color={AppColors.error} />} />
                        <StatCard value={stats.attendance.late} label="Geç Geldi" accentColor={AppColors.warning}
                          icon={<Ionicons name="time" size={24} color={AppColors.warning} />} />
                        <StatCard value={stats.attendance.excused} label="İzinli" accentColor={AppColors.info}
                          icon={<Ionicons name="document-text" size={24} color={AppColors.info} />} />
                      </View>
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

                {/* Duygu Durumu */}
                <MoodSection childId={selectedChild!.id} refreshToken={refreshToken} />
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surfaceContainerLow },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 16, backgroundColor: AppColors.surface },
  statsLoader: { paddingVertical: 60, alignItems: 'center' },

  infoCard: { padding: 0, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: AppColors.primaryContainer, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  infoBody: { flex: 1 },
  infoRowLabel: { fontSize: 11, color: AppColors.onSurfaceVariant, fontWeight: '600', marginBottom: 2 },
  infoRowValue: { fontSize: 14, fontWeight: '700', color: AppColors.onSurface },
  infoRowValueLink: { fontSize: 14, fontWeight: '700', color: AppColors.primary },
  infoRowValueMuted: { fontSize: 13, color: AppColors.onSurfaceVariant, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: AppColors.surfaceContainerLow, marginHorizontal: 14 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 },
  sectionLabelFlex: { marginBottom: 0 },
  rateBadge: { backgroundColor: AppColors.successContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rateBadgeText: { color: AppColors.success, fontSize: 12, fontWeight: '700' },

  statGrid: { flexDirection: 'row', gap: 8 },
  barCard: { padding: 16, gap: 10 },
  barContainer: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: AppColors.surfaceContainer },
  barSegment: { height: 10 },
  totalLabel: { fontSize: 12, color: AppColors.onSurfaceVariant, textAlign: 'right', fontWeight: '600' },

  noDataCard: { alignItems: 'center', padding: 24 },
  noDataText: { fontSize: 14, color: AppColors.onSurfaceVariant },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 28, backgroundColor: AppColors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: AppColors.onSurface },
  emptyText: { fontSize: 13, color: AppColors.onSurfaceVariant, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20, marginBottom: 8 },
});

// ─── Mood styles ──────────────────────────────────────────────────────────────

const moodStyles = StyleSheet.create({
  // Month nav
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: AppColors.surfaceContainer, justifyContent: 'center', alignItems: 'center' },
  monthLabel: { fontSize: 15, fontWeight: '800', color: AppColors.onSurface },

  // Monthly grid
  gridRow: { flexDirection: 'row', gap: 3 },
  cell: { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  dayCell: { borderRadius: 10, backgroundColor: AppColors.surfaceContainerLow },
  todayCell: { borderWidth: 2, borderColor: AppColors.primary },
  futureCell: { opacity: 0.2 },
  dayHeader: { fontSize: 10, fontWeight: '700', color: AppColors.onSurfaceVariant },
  cellEmoji: { fontSize: 16 },
  cellDayNum: { fontSize: 11, fontWeight: '600', color: AppColors.onSurfaceVariant },
  appetiteDot: { position: 'absolute', bottom: 3, right: 3, width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: AppColors.white },
  noteIndicatorWrap: { position: 'absolute', top: 2, left: 2 },
  calLegend: { flexDirection: 'row', gap: 14, paddingTop: 4, justifyContent: 'center' },

  // Weekly bar chart
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  weekNavBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: AppColors.surfaceContainer, justifyContent: 'center', alignItems: 'center' },
  weekNavLabel: { fontSize: 13, fontWeight: '700', color: AppColors.onSurface },
  chartLegend: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginBottom: 8 },
  legendBar: { width: 14, height: 6, borderRadius: 3 },
  barChart: { flexDirection: 'row', gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6, borderRadius: 12 },
  barColToday: { backgroundColor: AppColors.primaryContainer },
  emojiRow: { flexDirection: 'row', gap: 2, height: 20, alignItems: 'center' },
  barMoodEmoji: { fontSize: 13 },
  barAppEmoji: { fontSize: 11 },
  dualTrack: { flexDirection: 'row', gap: 3, height: TRACK_H },
  trackBg: { flex: 1, borderRadius: 6, backgroundColor: AppColors.surfaceContainerLow, height: TRACK_H },
  barDayLabel: { fontSize: 9, fontWeight: '700', color: AppColors.onSurfaceVariant },
  barDateNum: { fontSize: 9, color: AppColors.onSurfaceVariant },

  // Legend shared
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendDotSmall: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 10, color: AppColors.onSurfaceVariant, fontWeight: '600' },

  // Stats rows
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statsRowLabel: { fontSize: 10, fontWeight: '700', color: AppColors.onSurfaceVariant, width: 36 },
  statPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 6, borderRadius: 12 },
  statEmoji: { fontSize: 12 },
  statLabel: { fontSize: 10, fontWeight: '600' },
  statCount: { fontSize: 13, fontWeight: '800' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: AppColors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, gap: 0 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: AppColors.surfaceContainer, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalDate: { fontSize: 16, fontWeight: '800', color: AppColors.onSurface, flex: 1 },
  modalMoodCard: { alignItems: 'center', padding: 14, borderRadius: 16, gap: 4 },
  modalBigEmoji: { fontSize: 38 },
  modalCardSub: { fontSize: 10, fontWeight: '600', color: AppColors.onSurfaceVariant },
  modalCardValue: { fontSize: 16, fontWeight: '800' },
  modalInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  modalInfoLabel: { fontSize: 13, color: AppColors.onSurfaceVariant, fontWeight: '600' },
  modalInfoValue: { fontSize: 13, color: AppColors.onSurface, fontWeight: '700' },
  modalTeacherNotes: { backgroundColor: AppColors.primaryContainer, borderRadius: 12, padding: 12, gap: 6, marginTop: 4 },
  modalNotes: { backgroundColor: AppColors.surfaceContainerLow, borderRadius: 12, padding: 12, gap: 6, marginTop: 4 },
  modalNotesTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  modalNotesTitleTeacher: { fontSize: 11, fontWeight: '700', color: AppColors.primary },
  modalNotesLabel: { fontSize: 11, fontWeight: '700', color: AppColors.onSurfaceVariant },
  modalNotesText: { fontSize: 13, color: AppColors.onSurface, lineHeight: 18 },
});
