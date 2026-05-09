import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { AppHeader } from '@/components/ui/AppHeader';
import { PillTabs } from '@/components/ui/PillTabs';
import { PrivateImage } from '@/components/ui/PrivateImage';
import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_IMG_HEIGHT = 160;
const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Activity {
  id: number;
  name: string;
  description: string | null;
  is_paid: boolean;
  is_enrollment_required: boolean;
  is_global?: boolean;
  price: string | null;
  currency?: string;
  capacity: number | null;
  address: string | null;
  start_date: string | null;
  end_date: string | null;
  school: { id: number; name: string } | null;
  tenant?: { id: number; name: string } | null;
  tenant_name?: string | null;
  classes: Array<{ id: number; name: string }>;
  enrollments_count?: number;
  enrolled_child_ids?: string[];
  cover_image_url?: string | null;
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
  cover_image_url?: string | null;
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
  cover_image_url?: string | null;
}

// ─── Cover Card ───────────────────────────────────────────────────────────────

interface CoverCardProps {
  name: string;
  coverImageUrl?: string | null;
  schoolLabel?: string | null;
  isGlobal?: boolean;
  startDate?: string | null;
  description?: string | null;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  onPress: () => void;
}

function CoverCard({ name, coverImageUrl, schoolLabel, isGlobal, startDate, description, footerLeft, footerRight, onPress }: CoverCardProps) {
  const date = startDate ? new Date(startDate) : null;

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Cover */}
      <View style={cardStyles.coverWrap}>
        {coverImageUrl ? (
          <PrivateImage uri={coverImageUrl} style={cardStyles.coverImage} contentFit="cover" />
        ) : (
          <View style={[cardStyles.coverImage, cardStyles.coverPlaceholder]} />
        )}
        <View style={cardStyles.coverOverlay} />

        <View style={cardStyles.coverBottom}>
          <View style={{ flex: 1 }}>
            <View style={cardStyles.metaRow}>
              {isGlobal ? (
                <View style={cardStyles.globalBadge}>
                  <Ionicons name="globe-outline" size={9} color="#fff" />
                  <Text style={cardStyles.globalBadgeText}>Global</Text>
                </View>
              ) : null}
              {schoolLabel ? (
                <Text style={cardStyles.coverSchool} numberOfLines={1}>{schoolLabel}</Text>
              ) : null}
            </View>
            <Text style={cardStyles.coverTitle} numberOfLines={2}>{name}</Text>
          </View>

          {date ? (
            <View style={cardStyles.dateBadge}>
              <Text style={cardStyles.dateBadgeDay}>{date.getDate()}</Text>
              <Text style={cardStyles.dateBadgeMonth}>{TR_MONTHS[date.getMonth()]}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Description */}
      {description ? (
        <View style={cardStyles.descWrap}>
          <Text style={cardStyles.descText} numberOfLines={2}>{description}</Text>
        </View>
      ) : null}

      {/* Footer */}
      {(footerLeft || footerRight) ? (
        <View style={cardStyles.footer}>
          <View style={cardStyles.footerLeft}>{footerLeft}</View>
          {footerRight}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function FooterChip({ icon, text, color }: { icon: string; text: string; color?: string }) {
  return (
    <View style={cardStyles.footerChip}>
      <Ionicons name={icon as never} size={12} color={color ?? AppColors.onSurfaceVariant} />
      <Text style={[cardStyles.footerChipText, color ? { color } : null]} numberOfLines={1}>{text}</Text>
    </View>
  );
}

// ─── Activity card ────────────────────────────────────────────────────────────

function ActivityCard({ item }: { item: Activity }) {
  const schoolLabel = item.is_global
    ? (item.tenant_name ?? item.tenant?.name ?? null)
    : (item.school?.name ?? item.tenant_name ?? null);

  const classNames = (item.classes ?? []).length > 0
    ? item.classes.map(c => c.name).join(', ')
    : null;

  const enrolledCount = item.enrolled_child_ids?.length ?? 0;
  const isEnrolled = enrolledCount > 0;

  const footerLeft = (
    <View style={cardStyles.footerChips}>
      {item.address ? <FooterChip icon="location-outline" text={item.address} /> : null}
      {item.capacity ? (
        <FooterChip icon="people-outline" text={`${item.enrollments_count ?? 0}/${item.capacity}`} />
      ) : item.enrollments_count != null ? (
        <FooterChip icon="people-outline" text={`${item.enrollments_count} katılımcı`} />
      ) : null}
      {classNames ? <FooterChip icon="school-outline" text={classNames} /> : null}
    </View>
  );

  const footerRight = item.is_paid ? (
    <View style={[cardStyles.priceBadge, cardStyles.priceBadgePaid]}>
      <Ionicons name="card-outline" size={11} color="#D97706" />
      <Text style={cardStyles.priceBadgePaidText}>{item.price} {item.currency ?? '₺'}</Text>
    </View>
  ) : (
    <View style={[cardStyles.priceBadge, cardStyles.priceBadgeFree]}>
      <Text style={cardStyles.priceBadgeFreeText}>Ücretsiz</Text>
    </View>
  );

  return (
    <View style={{ position: 'relative' }}>
      <CoverCard
        name={item.name}
        coverImageUrl={item.cover_image_url}
        schoolLabel={schoolLabel}
        isGlobal={item.is_global}
        startDate={item.start_date}
        description={item.description}
        footerLeft={footerLeft}
        footerRight={footerRight}
        onPress={() => router.push(`/(app)/activities/event/${item.id}`)}
      />
      {isEnrolled ? (
        <View style={cardStyles.enrolledOverlay}>
          <Ionicons name="checkmark-circle" size={12} color="#fff" />
          <Text style={cardStyles.enrolledOverlayText}>{enrolledCount > 1 ? `${enrolledCount} Çocuk` : 'Katıldınız'}</Text>
        </View>
      ) : item.is_enrollment_required ? (
        <View style={[cardStyles.enrolledOverlay, { backgroundColor: AppColors.warning }]}>
          <Text style={cardStyles.enrolledOverlayText}>Kayıt Gerekli</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── ActivityClass card ───────────────────────────────────────────────────────

function ActivityClassCard({ item }: { item: ActivityClass }) {
  const schoolLabel = item.is_global
    ? (item.tenant_name ?? null)
    : (item.school_name ?? item.tenant_name ?? null);

  const classNames = item.is_school_wide || !item.school_classes?.length
    ? 'Tüm Sınıflar'
    : item.school_classes.map(c => c.name).join(', ');

  const footerLeft = (
    <View style={cardStyles.footerChips}>
      {item.location ? <FooterChip icon="location-outline" text={item.location} /> : null}
      {item.address && !item.location ? <FooterChip icon="location-outline" text={item.address} /> : null}
      {item.capacity ? (
        <FooterChip icon="people-outline" text={`${item.active_enrollments_count}/${item.capacity}`} />
      ) : null}
      <FooterChip icon="school-outline" text={classNames} />
    </View>
  );

  const footerRight = item.is_paid ? (
    <View style={[cardStyles.priceBadge, cardStyles.priceBadgePaid]}>
      <Ionicons name="card-outline" size={11} color="#D97706" />
      <Text style={cardStyles.priceBadgePaidText}>{item.price} {item.currency}</Text>
    </View>
  ) : (
    <View style={[cardStyles.priceBadge, cardStyles.priceBadgeFree]}>
      <Text style={cardStyles.priceBadgeFreeText}>Ücretsiz</Text>
    </View>
  );

  return (
    <View style={{ position: 'relative' }}>
      <CoverCard
        name={item.name}
        coverImageUrl={item.cover_image_url}
        schoolLabel={schoolLabel}
        isGlobal={item.is_global}
        startDate={item.start_date}
        description={item.description}
        footerLeft={footerLeft}
        footerRight={footerRight}
        onPress={() => router.push(`/(app)/activities/${item.id}`)}
      />
      {item.enrolled_child_ids.length > 0 ? (
        <View style={cardStyles.enrolledOverlay}>
          <Ionicons name="checkmark-circle" size={12} color="#fff" />
          <Text style={cardStyles.enrolledOverlayText}>Kayıtlı</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Katıldıklarım card ───────────────────────────────────────────────────────

function KatilCard({ item }: { item: KatildiklarimItem }) {
  const schoolLabel = item.is_global
    ? (item.tenant_name ?? null)
    : (item.school_name ?? item.tenant_name ?? null);

  const footerLeft = (
    <View style={cardStyles.footerChips}>
      {item.children.length > 0 ? (
        <FooterChip icon="people-outline" text={item.children.map(c => c.full_name).join(', ')} />
      ) : null}
    </View>
  );

  const footerRight = item.is_paid ? (
    <View style={[cardStyles.priceBadge, cardStyles.priceBadgePaid]}>
      <Ionicons name="card-outline" size={11} color="#D97706" />
      <Text style={cardStyles.priceBadgePaidText}>{item.price} {item.currency}</Text>
    </View>
  ) : (
    <View style={[cardStyles.priceBadge, cardStyles.priceBadgeFree]}>
      <Text style={cardStyles.priceBadgeFreeText}>Ücretsiz</Text>
    </View>
  );

  const dest = item.type === 'activity'
    ? `/(app)/activities/event/${item.id}`
    : `/(app)/activities/${item.id}`;

  return (
    <View style={{ position: 'relative' }}>
      <CoverCard
        name={item.name}
        coverImageUrl={item.cover_image_url}
        schoolLabel={schoolLabel}
        isGlobal={item.is_global}
        startDate={item.start_date}
        footerLeft={footerLeft}
        footerRight={footerRight}
        onPress={() => router.push(dest as never)}
      />
      <View style={[cardStyles.enrolledOverlay, { backgroundColor: AppColors.primary }]}>
        <Ionicons name="checkmark-circle" size={12} color="#fff" />
        <Text style={cardStyles.enrolledOverlayText}>
          {item.type === 'activity' ? 'Etkinlik' : 'Sınıf'}
        </Text>
      </View>
    </View>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'Etkinlikler' | 'Etkinlik Sınıfları';
type KatilFilter = 'all' | 'activity' | 'activity_class';
type KatilSort = 'date_desc' | 'date_asc';

const TABS: { key: Tab; label: string }[] = [
  { key: 'Etkinlikler', label: 'Etkinlikler' },
  { key: 'Etkinlik Sınıfları', label: 'Etkinlik Sınıfları' },
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ActivitiesScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Etkinlikler');
  const [showKatildiklarim, setShowKatildiklarim] = useState(false);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [actPage, setActPage] = useState(1);
  const [actLastPage, setActLastPage] = useState(1);
  const [actLoading, setActLoading] = useState(false);
  const [actRefreshing, setActRefreshing] = useState(false);
  const [actLoadingMore, setActLoadingMore] = useState(false);
  const [actFetched, setActFetched] = useState(false);

  const [activityClasses, setActivityClasses] = useState<ActivityClass[]>([]);
  const [acPage, setAcPage] = useState(1);
  const [acLastPage, setAcLastPage] = useState(1);
  const [acLoading, setAcLoading] = useState(false);
  const [acRefreshing, setAcRefreshing] = useState(false);
  const [acLoadingMore, setAcLoadingMore] = useState(false);
  const [acFetched, setAcFetched] = useState(false);

  const [katildiklarim, setKatildiklarim] = useState<KatildiklarimItem[]>([]);
  const [myLoading, setMyLoading] = useState(false);
  const [myRefreshing, setMyRefreshing] = useState(false);
  const [myFetched, setMyFetched] = useState(false);
  const [katilFilter, setKatilFilter] = useState<KatilFilter>('all');
  const [katilSort, setKatilSort] = useState<KatilSort>('date_desc');

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
        cover_image_url: null,
      }));

      const acItems: KatildiklarimItem[] = (acRes.data?.data ?? []).map((e: {
        enrollment_id: number;
        activity_class: {
          id: number; name: string; is_global?: boolean; is_paid: boolean;
          price: string | null; currency: string; start_date: string | null; end_date: string | null;
          tenant_name?: string | null; school?: { id: number; name: string } | null;
          school_name?: string | null;
        } | null;
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
          school_name: ac.school_name ?? ac.school?.name ?? null,
          children: e.child ? [{ id: e.child.id, full_name: e.child.name }] : [],
          enrolled_at: e.enrolled_at,
          cover_image_url: null,
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

  useEffect(() => {
    if (!actFetched) { void loadActivities(1); }
    if (!myFetched) { void loadMyEnrollments(); }
  }, [actFetched, myFetched, loadActivities, loadMyEnrollments]);

  useEffect(() => {
    if (activeTab === 'Etkinlik Sınıfları' && !acFetched) { void loadActivityClasses(1); }
  }, [activeTab, acFetched, loadActivityClasses]);

  useEffect(() => {
    if (showKatildiklarim && !myFetched) { void loadMyEnrollments(); }
  }, [showKatildiklarim, myFetched, loadMyEnrollments]);

  // ─── Render helpers ───────────────────────────────────────────────────────────

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
        refreshControl={<RefreshControl refreshing={actRefreshing} onRefresh={() => { setActRefreshing(true); void loadActivities(1); }} />}
        onEndReached={() => { if (!actLoadingMore && actPage < actLastPage) { void loadActivities(actPage + 1, true); } }}
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
        refreshControl={<RefreshControl refreshing={acRefreshing} onRefresh={() => { setAcRefreshing(true); void loadActivityClasses(1); }} />}
        onEndReached={() => { if (!acLoadingMore && acPage < acLastPage) { void loadActivityClasses(acPage + 1, true); } }}
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

  const filteredKatildiklarim = katildiklarim
    .filter((item) => katilFilter === 'all' || item.type === katilFilter)
    .sort((a, b) => {
      const dateA = a.start_date ?? a.enrolled_at;
      const dateB = b.start_date ?? b.enrolled_at;
      return katilSort === 'date_desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
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
        refreshControl={<RefreshControl refreshing={myRefreshing} onRefresh={() => { setMyRefreshing(true); void loadMyEnrollments(); }} />}
        ListHeaderComponent={
          <View style={myStyles.controls}>
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
                  <Text style={[myStyles.filterChipText, katilFilter === f.key && myStyles.filterChipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
                  <Text style={[myStyles.sortChipText, katilSort === s.key && myStyles.sortChipTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => <KatilCard item={item} />}
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

  const enrollCount = katildiklarim.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar style="dark" />
      <AppHeader
        title="Etkinlikler"
        rightContent={
          <TouchableOpacity
            style={[styles.enrollBtn, showKatildiklarim && styles.enrollBtnActive]}
            onPress={() => setShowKatildiklarim((v) => !v)}
            activeOpacity={0.8}
          >
            <Text style={[styles.enrollBtnLabel, showKatildiklarim && styles.enrollBtnLabelActive]}>
              Katıldıklarım
            </Text>
            {enrollCount > 0 && (
              <View style={[styles.enrollBadge, showKatildiklarim && styles.enrollBadgeActive]}>
                <Text style={[styles.enrollBadgeText, showKatildiklarim && styles.enrollBadgeTextActive]}>
                  {enrollCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />
      <View style={styles.tabWrap}>
        <PillTabs items={TABS} activeKey={activeTab} onSelect={setActiveTab} showIcons={false} scrollable={true} />
      </View>
      <View style={styles.content}>
        {showKatildiklarim
          ? renderKatildiklarim()
          : activeTab === 'Etkinlikler'
            ? renderActivities()
            : renderActivityClasses()}
      </View>
    </SafeAreaView>
  );
}

// ─── Cover card styles ────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  coverWrap: { width: '100%', height: CARD_IMG_HEIGHT, position: 'relative' },
  coverImage: { width: '100%', height: CARD_IMG_HEIGHT },
  coverPlaceholder: { backgroundColor: AppColors.primary },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.40)' },
  coverBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingBottom: 12, gap: 10,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  globalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#7C3AED', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  globalBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  coverSchool: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  coverTitle: { fontSize: 17, fontWeight: '800', color: '#fff', lineHeight: 22 },
  dateBadge: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  dateBadgeDay: { fontSize: 16, fontWeight: '800', color: '#fff', lineHeight: 20 },
  dateBadgeMonth: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.9)', lineHeight: 12 },

  descWrap: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 },
  descText: { fontSize: 13, color: AppColors.onSurfaceVariant, lineHeight: 18 },

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: AppColors.surfaceContainerLow,
  },
  footerLeft: { flex: 1 },
  footerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  footerChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  footerChipText: { fontSize: 11, color: AppColors.onSurfaceVariant, maxWidth: 90 },

  priceBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginLeft: 8 },
  priceBadgePaid: { backgroundColor: AppColors.warningContainer },
  priceBadgePaidText: { fontSize: 11, color: '#D97706', fontWeight: '700' },
  priceBadgeFree: { backgroundColor: AppColors.successContainer },
  priceBadgeFreeText: { fontSize: 11, color: '#065F46', fontWeight: '700' },

  enrolledOverlay: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: AppColors.primary, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  enrolledOverlayText: { fontSize: 11, color: '#fff', fontWeight: '700' },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surfaceContainerLow },
  tabWrap: { },
  content: { flex: 1 },
  listContent: { padding: 16, gap: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  moreLoader: { marginVertical: 16 },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: AppColors.onSurface },
  emptyText: { fontSize: 14, color: AppColors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 32 },

  // ── Header "Katıldıklarım" button — PillTabs pill style, no bottom border ──
  enrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: AppColors.white,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 6,
  },
  enrollBtnActive: {
    backgroundColor: AppColors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  enrollBtnLabel: { fontSize: 13, fontWeight: '700', color: AppColors.onSurface },
  enrollBtnLabelActive: { color: AppColors.white },
  enrollBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  enrollBadgeActive: { backgroundColor: AppColors.white },
  enrollBadgeText: { fontSize: 11, fontWeight: '800', color: AppColors.white },
  enrollBadgeTextActive: { color: AppColors.primary },
});

// ─── Katıldıklarım styles ─────────────────────────────────────────────────────

const myStyles = StyleSheet.create({
  controls: { gap: 8, marginBottom: 4 },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: AppColors.surfaceContainer, backgroundColor: AppColors.white },
  filterChipActive: { borderColor: AppColors.primary, backgroundColor: AppColors.primaryContainer },
  filterChipText: { fontSize: 12, fontWeight: '600', color: AppColors.onSurfaceVariant },
  filterChipTextActive: { color: AppColors.primary },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1.5, borderColor: AppColors.surfaceContainer, backgroundColor: AppColors.white },
  sortChipActive: { borderColor: AppColors.primary, backgroundColor: AppColors.primaryContainer },
  sortChipText: { fontSize: 12, fontWeight: '500', color: AppColors.onSurfaceVariant },
  sortChipTextActive: { color: AppColors.primary, fontWeight: '700' },
});
