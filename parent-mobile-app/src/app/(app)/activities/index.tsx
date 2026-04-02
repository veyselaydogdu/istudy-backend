import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Activity {
  id: number;
  name: string;
  description: string | null;
  is_paid: boolean;
  is_enrollment_required: boolean;
  price: string | null;
  capacity: number | null;
  address: string | null;
  start_date: string | null;
  end_date: string | null;
  school: { id: number; name: string } | null;
  classes: Array<{ id: number; name: string }>;
  enrollments_count?: number;
  enrolled_child_ids?: number[];
}

interface ActivityClass {
  id: number;
  name: string;
  description: string | null;
  language: string;
  age_min: number | null;
  age_max: number | null;
  capacity: number | null;
  active_enrollments_count: number;
  is_paid: boolean;
  price: string | null;
  currency: string;
  invoice_required: boolean;
  start_date: string | null;
  end_date: string | null;
  schedule: string | null;
  location: string | null;
  address: string | null;
  is_school_wide: boolean;
  school_classes: Array<{ id: number; name: string }>;
  enrolled_child_ids: number[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) { return null; }
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  if (start && end) { return `${fmt(start)} – ${fmt(end)}`; }
  if (start) { return `${fmt(start)}'den itibaren`; }
  return `${fmt(end!)}'e kadar`;
}

// ─── Activity card ────────────────────────────────────────────────────────────

function ActivityCard({ item }: { item: Activity }) {
  const dateRange = formatDateRange(item.start_date, item.end_date);
  const enrolledCount = item.enrolled_child_ids?.length ?? 0;
  const isEnrolled = enrolledCount > 0;
  const isLocked = item.is_enrollment_required && !isEnrolled;

  return (
    <TouchableOpacity
      style={[styles.card, isLocked && styles.cardLocked]}
      onPress={() => router.push(`/(app)/activities/event/${item.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, isLocked && { backgroundColor: '#F3F4F6' }]}>
          <Ionicons name="flag-outline" size={20} color={isLocked ? '#9CA3AF' : AppColors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, isLocked && { color: '#9CA3AF' }]}>{item.name}</Text>
          {item.school && (
            <Text style={styles.cardSchool}>{item.school.name}</Text>
          )}
        </View>
        <View style={{ gap: 4, alignItems: 'flex-end' }}>
          {isEnrolled ? (
            <View style={styles.enrolledBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#fff" />
              <Text style={styles.enrolledText}>
                {enrolledCount > 1 ? `${enrolledCount} Çocuk` : 'Katıldınız'}
              </Text>
            </View>
          ) : item.is_enrollment_required ? (
            <View style={styles.enrollBadge}>
              <Text style={styles.enrollBadgeText}>Kayıt Gerekli</Text>
            </View>
          ) : null}
          {item.is_paid ? (
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>{item.price} ₺</Text>
            </View>
          ) : (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>Ücretsiz</Text>
            </View>
          )}
        </View>
      </View>

      {item.description ? (
        <Text style={[styles.cardDesc, isLocked && { color: '#D1D5DB' }]} numberOfLines={2}>{item.description}</Text>
      ) : null}

      <View style={styles.cardMeta}>
        {dateRange && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>{dateRange}</Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <Ionicons name="school-outline" size={13} color="#9CA3AF" />
          <Text style={styles.metaText}>
            {(item.classes ?? []).length > 0
              ? item.classes.map((c) => c.name).join(', ')
              : 'Her sınıfa açık'}
          </Text>
        </View>
        {item.capacity != null && (
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color={item.enrollments_count != null && item.enrollments_count >= item.capacity ? '#EF4444' : '#9CA3AF'} />
            <Text style={[styles.metaText, item.enrollments_count != null && item.enrollments_count >= item.capacity ? { color: '#EF4444' } : null]}>
              {item.enrollments_count ?? 0}/{item.capacity}
              {item.enrollments_count != null && item.enrollments_count >= item.capacity ? ' (Dolu)' : ' kontenjan'}
            </Text>
          </View>
        )}
        {item.address && (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.address}</Text>
          </View>
        )}
        {item.enrollments_count != null && item.capacity == null && (
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.enrollments_count} katılımcı</Text>
          </View>
        )}
      </View>

      {/* Kilitli etkinlik mesajı */}
      {isLocked && (
        <View style={styles.lockedRow}>
          <Ionicons name="lock-closed-outline" size={12} color="#9CA3AF" />
          <Text style={styles.lockedText}>Detayları görmek için etkinliğe katılın</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── ActivityClass card ───────────────────────────────────────────────────────

function ActivityClassCard({ item }: { item: ActivityClass }) {
  const hasEnrolled = item.enrolled_child_ids.length > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/activities/${item.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, { backgroundColor: '#F0FDF4' }]}>
          <Ionicons name="star-outline" size={20} color="#16A34A" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSchool}>{item.language.toUpperCase()}</Text>
        </View>
        {hasEnrolled && (
          <View style={styles.enrolledBadge}>
            <Ionicons name="checkmark-circle" size={13} color="#fff" />
            <Text style={styles.enrolledText}>Kayıtlı</Text>
          </View>
        )}
      </View>

      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}

      <View style={styles.cardMeta}>
        {(item.age_min != null || item.age_max != null) && (
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.age_min ?? '?'}-{item.age_max ?? '?'} yaş</Text>
          </View>
        )}
        {item.schedule && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.schedule}</Text>
          </View>
        )}
        {item.location && (
          <View style={styles.metaItem}>
            <Ionicons name="business-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
        )}
        {item.address && (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.address}</Text>
          </View>
        )}
        {item.capacity ? (
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.active_enrollments_count}/{item.capacity}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        {item.is_paid ? (
          <View style={styles.paidBadge}>
            <Ionicons name="card-outline" size={12} color="#D97706" />
            <Text style={styles.paidText}>{item.price} {item.currency}</Text>
          </View>
        ) : (
          <View style={styles.freeBadge}>
            <Text style={styles.freeText}>Ücretsiz</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

// ─── Tab indicator ────────────────────────────────────────────────────────────

const TABS = ['Etkinlikler', 'Etkinlik Sınıfları'] as const;
type Tab = typeof TABS[number];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ActivitiesScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Etkinlikler');
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  // Activities state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [actPage, setActPage] = useState(1);
  const [actLastPage, setActLastPage] = useState(1);
  const [actLoading, setActLoading] = useState(false);
  const [actRefreshing, setActRefreshing] = useState(false);
  const [actLoadingMore, setActLoadingMore] = useState(false);
  const [actFetched, setActFetched] = useState(false);

  // ActivityClasses state
  const [activityClasses, setActivityClasses] = useState<ActivityClass[]>([]);
  const [acPage, setAcPage] = useState(1);
  const [acLastPage, setAcLastPage] = useState(1);
  const [acLoading, setAcLoading] = useState(false);
  const [acRefreshing, setAcRefreshing] = useState(false);
  const [acLoadingMore, setAcLoadingMore] = useState(false);
  const [acFetched, setAcFetched] = useState(false);

  // ─── Tab switch ──────────────────────────────────────────────────────────────

  const switchTab = (tab: Tab) => {
    const idx = TABS.indexOf(tab);
    Animated.timing(indicatorAnim, {
      toValue: idx,
      duration: 200,
      useNativeDriver: false,
    }).start();
    setActiveTab(tab);
  };

  // ─── Activities load ──────────────────────────────────────────────────────────

  const loadActivities = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (!append) { setActLoading(true); } else { setActLoadingMore(true); }
      const res = await api.get('/parent/activities', { params: { page: pageNum, per_page: 20 } });
      const data: Activity[] = res.data?.data ?? [];
      const meta = res.data?.meta ?? {};
      setActivities((prev) => append ? [...prev, ...data] : data);
      setActLastPage(meta.last_page ?? 1);
      setActPage(pageNum);
      setActFetched(true);
    } catch (err) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setActLoading(false);
      setActRefreshing(false);
      setActLoadingMore(false);
    }
  }, []);

  // ─── ActivityClasses load ─────────────────────────────────────────────────────

  const loadActivityClasses = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (!append) { setAcLoading(true); } else { setAcLoadingMore(true); }
      const res = await api.get('/parent/activity-classes', { params: { page: pageNum, per_page: 20 } });
      const data: ActivityClass[] = res.data?.data ?? [];
      const meta = res.data?.meta ?? {};
      setActivityClasses((prev) => append ? [...prev, ...data] : data);
      setAcLastPage(meta.last_page ?? 1);
      setAcPage(pageNum);
      setAcFetched(true);
    } catch (err) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setAcLoading(false);
      setAcRefreshing(false);
      setAcLoadingMore(false);
    }
  }, []);

  // İlk yükleme — Etkinlikler sekmesi açık
  useEffect(() => {
    if (!actFetched) { void loadActivities(1); }
  }, [actFetched, loadActivities]);

  // Tab değişince lazy yükle
  useEffect(() => {
    if (activeTab === 'Etkinlik Sınıfları' && !acFetched) {
      void loadActivityClasses(1);
    }
  }, [activeTab, acFetched, loadActivityClasses]);

  // ─── Render helpers ───────────────────────────────────────────────────────────

  const indicatorLeft = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  // ─── Activities list ──────────────────────────────────────────────────────────

  const renderActivities = () => {
    if (actLoading) {
      return <View style={styles.centered}><ActivityIndicator size="large" color={AppColors.primary} /></View>;
    }
    return (
      <FlatList
        data={activities}
        keyExtractor={(item) => `act-${item.id}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ActivityCard item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={actRefreshing}
            onRefresh={() => { setActRefreshing(true); void loadActivities(1); }}
          />
        }
        onEndReached={() => {
          if (!actLoadingMore && actPage < actLastPage) { void loadActivities(actPage + 1, true); }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={actLoadingMore ? <ActivityIndicator color={AppColors.primary} style={styles.moreLoader} /> : null}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="flag-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Etkinlik Yok</Text>
            <Text style={styles.emptyText}>Okulunuzda henüz etkinlik bulunmuyor.</Text>
          </View>
        }
      />
    );
  };

  // ─── ActivityClasses list ─────────────────────────────────────────────────────

  const renderActivityClasses = () => {
    if (acLoading) {
      return <View style={styles.centered}><ActivityIndicator size="large" color={AppColors.primary} /></View>;
    }
    return (
      <FlatList
        data={activityClasses}
        keyExtractor={(item) => `ac-${item.id}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ActivityClassCard item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={acRefreshing}
            onRefresh={() => { setAcRefreshing(true); void loadActivityClasses(1); }}
          />
        }
        onEndReached={() => {
          if (!acLoadingMore && acPage < acLastPage) { void loadActivityClasses(acPage + 1, true); }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={acLoadingMore ? <ActivityIndicator color={AppColors.primary} style={styles.moreLoader} /> : null}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="star-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Etkinlik Sınıfı Yok</Text>
            <Text style={styles.emptyText}>Okulunuzda henüz etkinlik sınıfı bulunmuyor.</Text>
          </View>
        }
      />
    );
  };

  // ─── Main render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Etkinlikler</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => switchTab(tab)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
        <Animated.View style={[styles.tabIndicator, { left: indicatorLeft }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'Etkinlikler' ? renderActivities() : renderActivityClasses()}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A2E' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: AppColors.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '50%',
    height: 3,
    backgroundColor: AppColors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  content: { flex: 1 },
  listContent: { padding: 16, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  moreLoader: { marginVertical: 16 },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  cardSchool: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  cardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },

  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#9CA3AF' },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    marginTop: 2,
  },

  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  paidText: { fontSize: 12, color: '#D97706', fontWeight: '600' },
  freeBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  freeText: { fontSize: 12, color: '#065F46', fontWeight: '600' },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  enrolledText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  enrollBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  enrollBadgeText: { fontSize: 11, color: '#D97706', fontWeight: '600' },
  cardLocked: { opacity: 0.85, backgroundColor: '#FAFAFA' },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    marginTop: 2,
  },
  lockedText: { fontSize: 12, color: '#9CA3AF' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32 },
});
