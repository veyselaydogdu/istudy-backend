import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { TabSelector } from '@/components/ui/TabSelector';
import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Activity {
  id: number;
  name: string;
  description: string | null;
  is_paid: boolean;
  is_enrollment_required: boolean;
  is_global?: boolean;
  price: string | null;
  capacity: number | null;
  address: string | null;
  start_date: string | null;
  end_date: string | null;
  school: { id: number; name: string } | null;
  tenant?: { id: number; name: string } | null;
  tenant_name?: string | null;
  classes: Array<{ id: number; name: string }>;
  enrollments_count?: number;
  enrolled_child_ids?: number[];
}

interface KatildiklarimItem {
  key: string;
  type: 'activity' | 'activity_class';
  id: number;
  name: string;
  is_global: boolean;
  is_paid: boolean;
  price: string | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  tenant_name: string | null;
  school_name: string | null;
  children: Array<{ id: string; full_name: string }>;
  enrolled_at: string;
}

interface ActivityClass {
  id: number;
  name: string;
  description: string | null;
  language: string;
  is_global?: boolean;
  school_name?: string | null;
  tenant_name?: string | null;
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
  const fmt = (d: string) => new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  if (start && end) { return `${fmt(start)} – ${fmt(end)}`; }
  if (start) { return `${fmt(start)}'den itibaren`; }
  return `${fmt(end!)}'e kadar`;
}

// ─── Activity card ────────────────────────────────────────────────────────────

function ActivityCard({ item }: { item: Activity }) {
  const dateRange = formatDateRange(item.start_date, item.end_date);
  const enrolledCount = item.enrolled_child_ids?.length ?? 0;
  const isEnrolled = enrolledCount > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/activities/event/${item.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="flag-outline" size={20} color={AppColors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {(item.tenant_name || item.school?.name) ? (
            <Text style={styles.cardSchool}>{item.tenant_name ?? item.school?.name}</Text>
          ) : null}
        </View>
        <View style={{ gap: 4, alignItems: 'flex-end' }}>
          {item.is_global && (
            <View style={styles.globalBadge}>
              <Ionicons name="globe-outline" size={11} color="#7C3AED" />
              <Text style={styles.globalBadgeText}>Global</Text>
            </View>
          )}
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
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
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
            <Ionicons name="people-outline" size={13} color={item.enrollments_count != null && item.enrollments_count >= item.capacity ? AppColors.error : AppColors.onSurfaceVariant} />
            <Text style={[styles.metaText, item.enrollments_count != null && item.enrollments_count >= item.capacity ? { color: AppColors.error } : null]}>
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

      <View style={styles.cardFooter}>
        {(item.tenant_name || item.school?.name) ? (
          <View style={[styles.schoolBadge, item.is_global && styles.schoolBadgeGlobal]}>
            <Ionicons name={item.is_global ? 'globe-outline' : 'business-outline'} size={11} color={item.is_global ? '#7C3AED' : AppColors.primary} />
            <Text style={[styles.schoolBadgeText, item.is_global && { color: '#7C3AED' }]}>
              {item.tenant_name ?? item.school?.name}
            </Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>

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
        <View style={[styles.cardIconWrap, { backgroundColor: AppColors.successContainer }]}>
          <Ionicons name="star-outline" size={20} color={AppColors.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSchool}>
            {item.tenant_name ?? item.school_name ?? item.language.toUpperCase()}
          </Text>
        </View>
        <View style={{ gap: 4, alignItems: 'flex-end' }}>
          {item.is_global && (
            <View style={styles.globalBadge}>
              <Ionicons name="globe-outline" size={11} color="#7C3AED" />
              <Text style={styles.globalBadgeText}>Global</Text>
            </View>
          )}
          {hasEnrolled && (
            <View style={styles.enrolledBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#fff" />
              <Text style={styles.enrolledText}>Kayıtlı</Text>
            </View>
          )}
        </View>
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
        {(item.tenant_name || item.school_name) ? (
          <View style={[styles.schoolBadge, item.is_global && styles.schoolBadgeGlobal]}>
            <Ionicons name={item.is_global ? 'globe-outline' : 'business-outline'} size={11} color={item.is_global ? '#7C3AED' : AppColors.primary} />
            <Text style={[styles.schoolBadgeText, item.is_global && { color: '#7C3AED' }]}>
              {item.tenant_name ?? item.school_name}
            </Text>
          </View>
        ) : null}
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

type Tab = 'Etkinlikler' | 'Etkinlik Sınıfları' | 'Katıldıklarım';
type KatilFilter = 'all' | 'activity' | 'activity_class';
type KatilSort = 'date_desc' | 'date_asc';

const TABS: { key: Tab; label: string }[] = [
  { key: 'Etkinlikler', label: 'Etkinlikler' },
  { key: 'Etkinlik Sınıfları', label: 'Etkinlik Sınıfları' },
  { key: 'Katıldıklarım', label: 'Katıldıklarım' },
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ActivitiesScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Etkinlikler');

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

  // Katıldıklarım state
  const [katildiklarim, setKatildiklarim] = useState<KatildiklarimItem[]>([]);
  const [myLoading, setMyLoading] = useState(false);
  const [myRefreshing, setMyRefreshing] = useState(false);
  const [myFetched, setMyFetched] = useState(false);
  const [katilFilter, setKatilFilter] = useState<KatilFilter>('all');
  const [katilSort, setKatilSort] = useState<KatilSort>('date_desc');

  const switchTab = (tab: Tab) => setActiveTab(tab);

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

  const loadMyEnrollments = useCallback(async () => {
    try {
      setMyLoading(true);
      const [actRes, acRes] = await Promise.all([
        api.get('/parent/activities/my-enrollments'),
        api.get('/parent/activity-classes/my-enrollments'),
      ]);

      const actItems: KatildiklarimItem[] = (actRes.data?.data ?? []).map((e: {
        activity_id: number; name: string; is_global: boolean; is_paid: boolean;
        price: string | null; start_date: string | null; end_date: string | null;
        tenant_name: string | null; school: { id: number; name: string } | null;
        children: Array<{ id: string; full_name: string }>; enrolled_at: string;
      }) => ({
        key: `act-${e.activity_id}`,
        type: 'activity' as const,
        id: e.activity_id,
        name: e.name,
        is_global: e.is_global,
        is_paid: e.is_paid,
        price: e.price,
        currency: '₺',
        start_date: e.start_date,
        end_date: e.end_date,
        tenant_name: e.tenant_name,
        school_name: e.school?.name ?? null,
        children: e.children,
        enrolled_at: e.enrolled_at,
      }));

      const acItems: KatildiklarimItem[] = (acRes.data?.data ?? []).map((e: {
        enrollment_id: number;
        activity_class: { id: number; name: string; is_global?: boolean; is_paid: boolean;
          price: string | null; currency: string; start_date: string | null; end_date: string | null;
          tenant_name?: string | null; school?: { id: number; name: string } | null } | null;
        child: { id: string; name: string } | null;
        enrolled_at: string;
      }) => {
        const ac = e.activity_class;
        if (!ac) { return null; }
        return {
          key: `ac-${e.enrollment_id}`,
          type: 'activity_class' as const,
          id: ac.id,
          name: ac.name,
          is_global: ac.is_global ?? false,
          is_paid: ac.is_paid,
          price: ac.price,
          currency: ac.currency ?? '₺',
          start_date: ac.start_date ?? null,
          end_date: ac.end_date ?? null,
          tenant_name: ac.tenant_name ?? null,
          school_name: ac.school_name ?? null,
          children: e.child ? [{ id: e.child.id, full_name: e.child.name }] : [],
          enrolled_at: e.enrolled_at,
        };
      }).filter(Boolean) as KatildiklarimItem[];

      setKatildiklarim([...actItems, ...acItems]);
      setMyFetched(true);
    } catch (err) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setMyLoading(false);
      setMyRefreshing(false);
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
    if (activeTab === 'Katıldıklarım' && !myFetched) {
      void loadMyEnrollments();
    }
  }, [activeTab, acFetched, myFetched, loadActivityClasses, loadMyEnrollments]);

  // ─── Render helpers ───────────────────────────────────────────────────────────

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

  // ─── Katıldıklarım list ───────────────────────────────────────────────────────

  const filteredKatildiklarim = katildiklarim
    .filter((item) => katilFilter === 'all' || item.type === katilFilter)
    .sort((a, b) => {
      const dateA = a.start_date ?? a.enrolled_at;
      const dateB = b.start_date ?? b.enrolled_at;
      return katilSort === 'date_desc'
        ? dateB.localeCompare(dateA)
        : dateA.localeCompare(dateB);
    });

  const renderKatildiklarim = () => {
    if (myLoading) {
      return <View style={styles.centered}><ActivityIndicator size="large" color={AppColors.primary} /></View>;
    }
    return (
      <FlatList
        data={filteredKatildiklarim}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={myRefreshing}
            onRefresh={() => { setMyRefreshing(true); void loadMyEnrollments(); }}
          />
        }
        ListHeaderComponent={
          <View style={myStyles.controls}>
            {/* Filtre */}
            <View style={myStyles.filterRow}>
              {([
                { key: 'all', label: 'Tümü' },
                { key: 'activity', label: 'Etkinlikler' },
                { key: 'activity_class', label: 'Sınıflar' },
              ] as { key: KatilFilter; label: string }[]).map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[myStyles.filterChip, katilFilter === f.key && myStyles.filterChipActive]}
                  onPress={() => setKatilFilter(f.key)}
                >
                  <Text style={[myStyles.filterChipText, katilFilter === f.key && myStyles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Sıralama */}
            <View style={myStyles.sortRow}>
              <Ionicons name="swap-vertical-outline" size={14} color={AppColors.onSurfaceVariant} />
              {([
                { key: 'date_desc', label: 'Tarihe göre ↓' },
                { key: 'date_asc', label: 'Tarihe göre ↑' },
              ] as { key: KatilSort; label: string }[]).map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[myStyles.sortChip, katilSort === s.key && myStyles.sortChipActive]}
                  onPress={() => setKatilSort(s.key)}
                >
                  <Text style={[myStyles.sortChipText, katilSort === s.key && myStyles.sortChipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(
              item.type === 'activity'
                ? `/(app)/activities/event/${item.id}`
                : `/(app)/activities/${item.id}`
            )}
            activeOpacity={0.75}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: item.type === 'activity' ? AppColors.successContainer : AppColors.primaryContainer }]}>
                <Ionicons
                  name={item.type === 'activity' ? 'flag' : 'star'}
                  size={18}
                  color={item.type === 'activity' ? AppColors.success : AppColors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {(item.tenant_name ?? item.school_name) ? (
                  <Text style={styles.cardSchool}>{item.tenant_name ?? item.school_name}</Text>
                ) : null}
              </View>
              <View style={{ gap: 4, alignItems: 'flex-end' }}>
                <View style={item.type === 'activity' ? myStyles.typeBadgeAct : myStyles.typeBadgeAc}>
                  <Text style={item.type === 'activity' ? myStyles.typeBadgeActText : myStyles.typeBadgeAcText}>
                    {item.type === 'activity' ? 'Etkinlik' : 'Sınıf'}
                  </Text>
                </View>
                {item.is_paid ? (
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidText}>{item.price} {item.currency}</Text>
                  </View>
                ) : (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeText}>Ücretsiz</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cardMeta}>
              {(item.start_date || item.end_date) && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
                  <Text style={styles.metaText}>{formatDateRange(item.start_date, item.end_date)}</Text>
                </View>
              )}
              {item.children.length > 0 && (
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={13} color="#9CA3AF" />
                  <Text style={styles.metaText}>{item.children.map(c => c.full_name).join(', ')}</Text>
                </View>
              )}
            </View>

            <View style={styles.cardFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                {(item.school_name || item.tenant_name) ? (
                  <View style={[styles.schoolBadge, item.is_global && styles.schoolBadgeGlobal]}>
                    <Ionicons name={item.is_global ? 'globe-outline' : 'business-outline'} size={11} color={item.is_global ? '#7C3AED' : AppColors.primary} />
                    <Text style={[styles.schoolBadgeText, item.is_global && { color: '#7C3AED' }]}>
                      {item.tenant_name ?? item.school_name}
                    </Text>
                  </View>
                ) : null}
                {item.is_global && (
                  <View style={styles.globalBadge}>
                    <Ionicons name="globe-outline" size={11} color="#7C3AED" />
                    <Text style={styles.globalBadgeText}>Global</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="calendar-clear-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Kayıt Yok</Text>
            <Text style={styles.emptyText}>
              {katilFilter === 'all'
                ? 'Henüz hiçbir etkinliğe veya sınıfa kayıt olmadınız.'
                : katilFilter === 'activity'
                  ? 'Katıldığınız etkinlik bulunmuyor.'
                  : 'Kayıtlı olduğunuz etkinlik sınıfı bulunmuyor.'}
            </Text>
          </View>
        }
      />
    );
  };

  // ─── Main render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={AppColors.white} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Etkinlikler</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabWrap}>
        <TabSelector tabs={TABS} activeKey={activeTab} onSelect={switchTab} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'Etkinlikler' ? renderActivities()
          : activeTab === 'Etkinlik Sınıfları' ? renderActivityClasses()
          : renderKatildiklarim()}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.white },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainer,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: AppColors.primary, letterSpacing: -0.3 },

  tabWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainer,
  },

  content: { flex: 1, backgroundColor: AppColors.surface },
  listContent: { padding: 16, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  moreLoader: { marginVertical: 16 },

  // Cards
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 14,
    borderBottomWidth: 3,
    borderBottomColor: AppColors.surfaceContainer,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface },
  cardSchool: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 1 },
  cardDesc: { fontSize: 13, color: AppColors.onSurfaceVariant, lineHeight: 18 },

  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: AppColors.onSurfaceVariant },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainerLow,
    paddingTop: 8,
    marginTop: 2,
  },

  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.warningContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  paidText: { fontSize: 12, color: AppColors.warning, fontWeight: '600' },
  freeBadge: { backgroundColor: AppColors.successContainer, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  freeText: { fontSize: 12, color: AppColors.success, fontWeight: '600' },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  enrolledText: { fontSize: 11, color: AppColors.white, fontWeight: '600' },
  enrollBadge: {
    backgroundColor: AppColors.warningContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  enrollBadgeText: { fontSize: 11, color: AppColors.warning, fontWeight: '600' },
  globalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  globalBadgeText: { fontSize: 11, color: '#7C3AED', fontWeight: '700' },
  schoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  schoolBadgeGlobal: { backgroundColor: '#EDE9FE' },
  schoolBadgeText: { fontSize: 11, color: AppColors.primary, fontWeight: '600' },
  cardLocked: { opacity: 0.85, backgroundColor: AppColors.surfaceContainerLow },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainerLow,
    paddingTop: 8,
    marginTop: 2,
  },
  lockedText: { fontSize: 12, color: AppColors.onSurfaceVariant },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: AppColors.onSurface },
  emptyText: { fontSize: 14, color: AppColors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 32 },
});

// ─── Katıldıklarım styles ─────────────────────────────────────────────────────

const myStyles = StyleSheet.create({
  controls: { gap: 8, marginBottom: 4 },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: AppColors.surfaceContainer,
    backgroundColor: AppColors.white,
  },
  filterChipActive: { borderColor: AppColors.primary, backgroundColor: AppColors.primaryContainer },
  filterChipText: { fontSize: 12, fontWeight: '600', color: AppColors.onSurfaceVariant },
  filterChipTextActive: { color: AppColors.primary },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: AppColors.surfaceContainer,
    backgroundColor: AppColors.white,
  },
  sortChipActive: { borderColor: AppColors.primary, backgroundColor: AppColors.primaryContainer },
  sortChipText: { fontSize: 12, fontWeight: '500', color: AppColors.onSurfaceVariant },
  sortChipTextActive: { color: AppColors.primary, fontWeight: '700' },
  typeBadgeAct: {
    backgroundColor: AppColors.successContainer,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeActText: { fontSize: 10, color: AppColors.success, fontWeight: '700' },
  typeBadgeAc: {
    backgroundColor: AppColors.primaryContainer,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeAcText: { fontSize: 10, color: AppColors.primary, fontWeight: '700' },
});
