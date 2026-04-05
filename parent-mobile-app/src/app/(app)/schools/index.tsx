import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

import { AppColors } from '@/constants/theme';
import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

// ─── Types ────────────────────────────────────────────────

interface School {
  id: number;
  name: string;
  type: string | null;
  address: string | null;
  phone: string | null;
  logo: string | null;
  joined_at: string | null;
}

interface EnrollmentRequest {
  id: number;
  status: 'pending' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  school: {
    id: number;
    name: string;
    address: string | null;
  } | null;
}

// ─── Sub-components ────────────────────────────────────────

function SchoolInitials({ name, size = 52 }: { name: string; size?: number }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2
    ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`
    : name.substring(0, 2);
  return (
    <View style={[styles.schoolAvatar, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Text style={[styles.schoolAvatarText, { fontSize: size * 0.3 }]}>
        {initials.toUpperCase()}
      </Text>
    </View>
  );
}

// ─── Requests collapsible section ─────────────────────────

interface RequestsSectionProps {
  pending: EnrollmentRequest[];
  rejected: EnrollmentRequest[];
}

function RequestsSection({ pending, rejected }: RequestsSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending');

  const items = activeTab === 'pending' ? pending : rejected;

  return (
    <View style={styles.requestsSection}>
      {/* Section header — tıklanabilir, açılır/kapanır */}
      <TouchableOpacity
        style={styles.requestsHeader}
        onPress={() => setExpanded(v => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.requestsHeaderLeft}>
          <Ionicons name="time-outline" size={18} color="#6B7280" />
          <Text style={styles.requestsHeaderTitle}>Başvurularım</Text>
          {pending.length > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pending.length}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#9CA3AF"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.requestsBody}>
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
              onPress={() => setActiveTab('pending')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
                Bekleyen
              </Text>
              {pending.length > 0 && (
                <View style={[styles.tabCount, activeTab === 'pending' && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, activeTab === 'pending' && styles.tabCountTextActive]}>
                    {pending.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'rejected' && styles.tabActiveRed]}
              onPress={() => setActiveTab('rejected')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'rejected' && styles.tabTextRed]}>
                Reddedilen
              </Text>
              {rejected.length > 0 && (
                <View style={[styles.tabCount, activeTab === 'rejected' && styles.tabCountRed]}>
                  <Text style={[styles.tabCountText, activeTab === 'rejected' && styles.tabCountTextActive]}>
                    {rejected.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Request items */}
          {items.length === 0 ? (
            <View style={styles.tabEmpty}>
              <Text style={styles.tabEmptyText}>
                {activeTab === 'pending' ? 'Bekleyen başvuru yok.' : 'Reddedilen başvuru yok.'}
              </Text>
            </View>
          ) : (
            items.map(req => (
              <View key={req.id} style={styles.reqCard}>
                <SchoolInitials name={req.school?.name ?? '?'} size={44} />
                <View style={styles.reqInfo}>
                  <Text style={styles.reqSchoolName} numberOfLines={1}>
                    {req.school?.name ?? 'Bilinmeyen Okul'}
                  </Text>
                  {req.school?.address && (
                    <View style={styles.addressRow}>
                      <Ionicons name="location-outline" size={11} color="#9CA3AF" />
                      <Text style={styles.reqAddress} numberOfLines={1}>{req.school.address}</Text>
                    </View>
                  )}
                  {req.status === 'rejected' && req.rejection_reason && (
                    <Text style={styles.rejectionReason} numberOfLines={2}>
                      {req.rejection_reason}
                    </Text>
                  )}
                  <Text style={styles.reqDate}>
                    {new Date(req.created_at).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
                <View style={req.status === 'pending' ? styles.dotPending : styles.dotRejected} />
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────

export default function SchoolsScreen() {
  const [schools, setSchools] = useState<School[]>([]);
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) { setLoading(true); }
    setError(null);
    try {
      const [schoolsRes, requestsRes] = await Promise.all([
        api.get<{ data: School[] }>('/parent/schools'),
        api.get<{ data: EnrollmentRequest[] }>('/parent/my-enrollment-requests'),
      ]);
      setSchools(schoolsRes.data.data);
      setRequests(requestsRes.data.data);
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const pending = requests.filter(r => r.status === 'pending');
  const rejected = requests.filter(r => r.status === 'rejected');
  const hasRequests = requests.length > 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Kayıtlı</Text>
          <Text style={styles.headerTitle}>Okullarım</Text>
        </View>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => router.push('/(app)/schools/join')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.joinButtonText}>Katıl</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={schools}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(app)/schools/${item.id}`)}
            activeOpacity={0.75}
          >
            <SchoolInitials name={item.name} />
            <View style={styles.cardInfo}>
              <Text style={styles.schoolName} numberOfLines={1}>{item.name}</Text>
              {item.type && (
                <View style={styles.typeChip}>
                  <Text style={styles.typeChipText}>{item.type}</Text>
                </View>
              )}
              {item.address && (
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.schoolAddress} numberOfLines={1}>{item.address}</Text>
                </View>
              )}
              {item.joined_at && (
                <Text style={styles.joinedAt}>
                  Katılım: {new Date(item.joined_at).toLocaleDateString('tr-TR')}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchData(true); }} tintColor={AppColors.primary} />
        }
        ListEmptyComponent={
          !hasRequests ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="school-outline" size={40} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>Kayıtlı okul yok</Text>
              <Text style={styles.emptyText}>Davet kodu ile bir okula katılabilirsiniz.</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(app)/schools/join')}
                activeOpacity={0.8}
              >
                <Ionicons name="enter-outline" size={18} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Okula Katıl</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListFooterComponent={
          hasRequests ? (
            <RequestsSection pending={pending} rejected={rejected} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerSub: { fontSize: 13, color: AppColors.onSurfaceVariant, fontWeight: '500', marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: AppColors.onSurface },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  joinButtonText: { color: AppColors.white, fontSize: 14, fontWeight: '700' },
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
  errorText: { color: AppColors.error, fontSize: 13, flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },

  // Approved school card
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  schoolAvatar: {
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.infoContainer,
  },
  schoolAvatarText: { fontWeight: '800', color: AppColors.primary },
  cardInfo: { flex: 1 },
  schoolName: { fontSize: 16, fontWeight: '700', color: AppColors.onSurface, marginBottom: 5 },
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.primaryContainer,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 4,
  },
  typeChipText: { fontSize: 11, color: AppColors.primary, fontWeight: '600' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  schoolAddress: { fontSize: 12, color: AppColors.onSurfaceVariant, flex: 1 },
  joinedAt: { fontSize: 11, color: AppColors.surfaceContainer },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: AppColors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AppColors.onSurface },
  emptyText: { fontSize: 14, color: AppColors.onSurfaceVariant, textAlign: 'center' },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  emptyButtonText: { color: AppColors.white, fontSize: 14, fontWeight: '700' },

  // Requests collapsible section
  requestsSection: {
    marginTop: 6,
    backgroundColor: AppColors.white,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  requestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainerLow,
  },
  requestsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  requestsHeaderTitle: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface },
  pendingBadge: {
    backgroundColor: AppColors.warningContainer,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: AppColors.warning },
  requestsBody: { paddingBottom: 8 },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabActive: { backgroundColor: AppColors.white, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabActiveRed: { backgroundColor: AppColors.white, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: AppColors.onSurfaceVariant },
  tabTextActive: { color: AppColors.primary },
  tabTextRed: { color: AppColors.error },
  tabCount: { backgroundColor: AppColors.surfaceContainer, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  tabCountActive: { backgroundColor: AppColors.infoContainer },
  tabCountRed: { backgroundColor: '#FEE2E2' },
  tabCountText: { fontSize: 10, fontWeight: '700', color: AppColors.onSurfaceVariant },
  tabCountTextActive: { color: AppColors.onSurface },
  tabEmpty: { paddingVertical: 20, alignItems: 'center' },
  tabEmptyText: { fontSize: 13, color: AppColors.onSurfaceVariant },

  // Request card
  reqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainerLow,
  },
  reqInfo: { flex: 1 },
  reqSchoolName: { fontSize: 14, fontWeight: '700', color: AppColors.onSurface, marginBottom: 3 },
  reqAddress: { fontSize: 11, color: AppColors.onSurfaceVariant, flex: 1 },
  rejectionReason: { fontSize: 12, color: AppColors.onSurfaceVariant, fontStyle: 'italic', marginTop: 2, marginBottom: 2 },
  reqDate: { fontSize: 11, color: AppColors.surfaceContainer, marginTop: 2 },
  dotPending: { width: 8, height: 8, borderRadius: 4, backgroundColor: AppColors.warning, flexShrink: 0 },
  dotRejected: { width: 8, height: 8, borderRadius: 4, backgroundColor: AppColors.error, flexShrink: 0 },
});
