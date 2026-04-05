import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

// ─── Types ────────────────────────────────────────────────

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
  is_school_wide: boolean;
  school_classes: Array<{ id: number; name: string }>;
  enrolled_child_ids: number[];
}

// ─── Component ───────────────────────────────────────────

function ActivityClassCard({
  item,
  onPress,
}: {
  item: ActivityClass;
  onPress: () => void;
}) {
  const hasEnrolled = item.enrolled_child_ids.length > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardLanguage}>{item.language.toUpperCase()}</Text>
        </View>
        {hasEnrolled && (
          <View style={styles.enrolledBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
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
            <Text style={styles.metaText}>
              {item.age_min ?? '?'}-{item.age_max ?? '?'} yaş
            </Text>
          </View>
        )}
        {item.schedule ? (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.schedule}</Text>
          </View>
        ) : null}
        {item.location ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
        ) : null}
        {item.capacity ? (
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>
              {item.active_enrollments_count}/{item.capacity}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        {item.is_paid ? (
          <View style={styles.paidBadge}>
            <Ionicons name="card-outline" size={12} color="#D97706" />
            <Text style={styles.paidText}>
              {item.price} {item.currency}
            </Text>
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

// ─── Screen ───────────────────────────────────────────────

export default function ActivityClassesScreen() {
  const [activityClasses, setActivityClasses] = useState<ActivityClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadActivityClasses = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1 && !append) setLoading(true);
      else if (append) setLoadingMore(true);

      const res = await api.get('/parent/activity-classes', { params: { page: pageNum, per_page: 20 } });
      const data: ActivityClass[] = res.data?.data ?? [];
      const meta = res.data?.meta ?? {};

      setActivityClasses(prev => append ? [...prev, ...data] : data);
      setLastPage(meta.last_page ?? 1);
      setPage(pageNum);
    } catch (err) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadActivityClasses(1); }, [loadActivityClasses]);

  const onRefresh = () => {
    setRefreshing(true);
    loadActivityClasses(1);
  };

  const loadMore = () => {
    if (!loadingMore && page < lastPage) {
      loadActivityClasses(page + 1, true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Etkinlik Sınıfları</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Etkinlik Sınıfları</Text>
      </View>

      <FlatList
        data={activityClasses}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ActivityClassCard
            item={item}
            onPress={() => router.push(`/activity-classes/${item.id}`)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={AppColors.primary} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Etkinlik Sınıfı Yok</Text>
            <Text style={styles.emptyText}>Okulunuzda henüz etkinlik sınıfı bulunmuyor.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surfaceContainerLow },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    backgroundColor: AppColors.white, borderBottomWidth: 1, borderBottomColor: AppColors.surfaceContainerLow,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: AppColors.onSurface },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: AppColors.white, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: AppColors.onSurface },
  cardLanguage: { fontSize: 11, color: AppColors.onSurfaceVariant, marginTop: 2 },
  cardDesc: { fontSize: 13, color: AppColors.onSurfaceVariant, marginBottom: 8, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: AppColors.onSurfaceVariant },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: AppColors.surfaceContainerLow, paddingTop: 8 },
  paidBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: AppColors.warningContainer, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  paidText: { fontSize: 12, color: AppColors.warning, fontWeight: '600' },
  freeBadge: {
    backgroundColor: AppColors.successContainer, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  freeText: { fontSize: 12, color: '#065F46', fontWeight: '600' },
  enrolledBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: AppColors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  enrolledText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: AppColors.onSurface },
  emptyText: { fontSize: 14, color: AppColors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 32 },
});
