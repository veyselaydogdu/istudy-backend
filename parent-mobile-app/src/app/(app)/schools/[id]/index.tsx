import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import api from '../../../../lib/api';
import { getApiError } from '../../../../lib/auth';

interface SchoolDetail {
  id: number;
  name: string;
  type: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  current_academic_year: { id: number; name: string } | null;
}

interface Post {
  id: number;
  content: string;
  visibility: string;
  is_pinned: boolean;
  published_at: string | null;
  author: { id: number; name: string; surname: string } | null;
  reactions_count: number;
  comments_count: number;
}

interface FamilyChild {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  school_id: number | null;
}

interface ChildEnrollment {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  child: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
  } | null;
}

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const schoolId = Number(id);
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Child enrollment
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [allFamilyChildren, setAllFamilyChildren] = useState<FamilyChild[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [childEnrollments, setChildEnrollments] = useState<ChildEnrollment[]>([]);

  const fetchSchool = useCallback(async () => {
    try {
      const response = await api.get<{ data: SchoolDetail }>(`/parent/schools/${id}`);
      setSchool(response.data.data);
    } catch (err: unknown) {
      void getApiError(err);
    }
  }, [id]);

  const fetchPosts = useCallback(async (currentPage = 1, isRefresh = false) => {
    setPostsLoading(true);
    try {
      const response = await api.get<{
        data: Post[];
        meta: { current_page: number; last_page: number };
      }>(`/parent/schools/${id}/feed?page=${currentPage}`);
      const newPosts = response.data.data;
      const meta = response.data.meta;

      if (isRefresh || currentPage === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setPage(meta.current_page);
      setLastPage(meta.last_page);
    } catch {
      // sessizce geç
    } finally {
      setPostsLoading(false);
    }
  }, [id]);

  const fetchChildEnrollments = useCallback(async () => {
    try {
      const res = await api.get<{ data: ChildEnrollment[] }>(`/parent/schools/${id}/child-enrollments`);
      setChildEnrollments(res.data.data ?? []);
    } catch {
      // sessizce geç
    }
  }, [id]);

  const fetchAllChildren = useCallback(async () => {
    try {
      const res = await api.get<{ data: FamilyChild[] }>('/parent/children');
      setAllFamilyChildren(res.data.data ?? []);
    } catch {
      // sessizce geç
    }
  }, []);

  const loadAll = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    await Promise.all([fetchSchool(), fetchPosts(1, isRefresh), fetchChildEnrollments(), fetchAllChildren()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchSchool, fetchPosts, fetchChildEnrollments, fetchAllChildren]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadAll(true);
  };

  const handleLoadMore = () => {
    if (!postsLoading && page < lastPage) {
      void fetchPosts(page + 1);
    }
  };

  const openEnrollModal = async () => {
    setShowEnrollModal(true);
    setLoadingChildren(true);
    try {
      const res = await api.get<{ data: FamilyChild[] }>('/parent/children');
      const all = res.data.data ?? [];
      setAllFamilyChildren(all);
      // Modalda sadece bu okula kayıtlı olmayan ve onay beklemeyen çocukları göster
      const pendingChildIds = new Set(
        childEnrollments
          .filter((e) => e.status === 'pending')
          .map((e) => e.child?.id)
          .filter(Boolean)
      );
      const eligible = all.filter(
        (c) => c.school_id !== schoolId && !pendingChildIds.has(c.id)
      );
      setModalChildren(eligible);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
      setShowEnrollModal(false);
    } finally {
      setLoadingChildren(false);
    }
  };

  const [modalChildren, setModalChildren] = useState<FamilyChild[]>([]);

  const handleEnrollChild = async (child: FamilyChild) => {
    setEnrolling(true);
    try {
      await api.post(`/parent/schools/${id}/enroll-child`, { child_id: child.id });
      setShowEnrollModal(false);
      Alert.alert(
        'Talep Gönderildi',
        `${child.full_name} için okul kayıt talebiniz gönderildi. Okul onayını bekliyorsunuz.`
      );
      await Promise.all([fetchChildEnrollments(), fetchAllChildren()]);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Bu okula kayıtlı çocuklar (school_id eşleşiyor)
  const enrolledHere = allFamilyChildren.filter((c) => c.school_id === schoolId);

  // Bu okul için onay bekleyen talepler
  const pendingEnrollments = childEnrollments.filter((e) => e.status === 'pending');

  // Bu okula kayıtlı olmayan VE bekleyen talebi olmayan çocuklar var mı?
  const pendingChildIds = new Set(pendingEnrollments.map((e) => e.child?.id).filter(Boolean));
  const hasEligibleChildren = allFamilyChildren.some(
    (c) => c.school_id !== schoolId && !pendingChildIds.has(c.id)
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {school?.name ?? 'Okul'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {item.is_pinned && (
              <Text style={styles.pinned}>📌 Sabitlenmiş</Text>
            )}
            <View style={styles.postAuthor}>
              <View style={styles.postAvatar}>
                <Text style={styles.postAvatarText}>
                  {item.author
                    ? item.author.name.charAt(0).toUpperCase()
                    : '?'}
                </Text>
              </View>
              <View>
                <Text style={styles.postAuthorName}>
                  {item.author
                    ? `${item.author.name} ${item.author.surname}`
                    : 'Bilinmiyor'}
                </Text>
                <Text style={styles.postDate}>
                  {item.published_at
                    ? new Date(item.published_at).toLocaleDateString('tr-TR')
                    : ''}
                </Text>
              </View>
            </View>
            <Text style={styles.postContent}>{item.content}</Text>
            <View style={styles.postFooter}>
              <Text style={styles.postStat}>👍 {item.reactions_count}</Text>
              <Text style={styles.postStat}>💬 {item.comments_count}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          school ? (
            <View>
              <View style={styles.schoolCard}>
                <View style={styles.schoolIconBox}>
                  <Text style={styles.schoolIconText}>🏫</Text>
                </View>
                <Text style={styles.schoolName}>{school.name}</Text>
                {school.type && <Text style={styles.schoolType}>{school.type}</Text>}
                {school.address && (
                  <Text style={styles.schoolInfo}>📍 {school.address}</Text>
                )}
                {school.phone && (
                  <Text style={styles.schoolInfo}>📞 {school.phone}</Text>
                )}
                {school.current_academic_year && (
                  <View style={styles.yearBadge}>
                    <Text style={styles.yearBadgeText}>
                      {school.current_academic_year.name}
                    </Text>
                  </View>
                )}

                {/* Kayıtlı çocuklar */}
                {enrolledHere.length > 0 && (
                  <View style={styles.enrolledSection}>
                    <Text style={styles.enrolledTitle}>✅ Bu Okula Kayıtlı Çocuklar</Text>
                    {enrolledHere.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.enrolledItem}
                        onPress={() => router.push(`/(app)/children/${c.id}`)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.enrolledAvatar}>
                          <Text style={styles.enrolledAvatarText}>
                            {c.first_name.charAt(0)}{c.last_name.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.enrolledInfo}>
                          <Text style={styles.enrolledName}>{c.full_name}</Text>
                          {c.birth_date && (
                            <Text style={styles.enrolledBirth}>
                              {new Date(c.birth_date).toLocaleDateString('tr-TR')}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.enrolledArrow}>›</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Kayıt butonu — sadece uygun çocuk varsa göster */}
                {hasEligibleChildren && (
                  <TouchableOpacity
                    style={styles.enrollButton}
                    onPress={openEnrollModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.enrollButtonText}>👶 Çocuğumu Bu Okula Ekle</Text>
                  </TouchableOpacity>
                )}
              </View>

              {pendingEnrollments.length > 0 && (
                <View style={styles.pendingCard}>
                  <Text style={styles.pendingTitle}>⏳ Onay Bekleyen Kayıtlar</Text>
                  {pendingEnrollments.map((e) => (
                    <View key={e.id} style={styles.pendingItem}>
                      <Text style={styles.pendingChildName}>{e.child?.full_name}</Text>
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Onay Bekleniyor</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.activityClassesBtn}
                onPress={() => router.push('/(app)/activity-classes')}
              >
                <Ionicons name="star-outline" size={18} color={AppColors.primary} />
                <Text style={styles.activityClassesBtnText}>Etkinlik Sınıfları</Text>
                <Ionicons name="chevron-forward" size={16} color={AppColors.primary} />
              </TouchableOpacity>

              <Text style={styles.feedTitle}>Okul Akışı</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={AppColors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !postsLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Henüz paylaşım yok.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          postsLoading ? (
            <ActivityIndicator color={AppColors.primary} style={styles.loader} />
          ) : null
        }
      />

      {/* Çocuk Seçme Modalı */}
      <Modal
        visible={showEnrollModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEnrollModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Çocuğumu Ekle</Text>
              <TouchableOpacity onPress={() => setShowEnrollModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Okula kayıt talebinde bulunmak istediğiniz çocuğu seçin.
            </Text>

            {loadingChildren ? (
              <ActivityIndicator color={AppColors.primary} style={{ marginVertical: 32 }} />
            ) : modalChildren.length === 0 ? (
              <View style={styles.emptyModal}>
                <Text style={styles.emptyModalText}>
                  Tüm çocuklarınız zaten bu okula kayıtlı veya başvuru bekleniyor.
                </Text>
                <TouchableOpacity
                  style={styles.addChildBtn}
                  onPress={() => {
                    setShowEnrollModal(false);
                    router.push('/(app)/children/add');
                  }}
                >
                  <Text style={styles.addChildBtnText}>+ Çocuk Ekle</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {modalChildren.map((child) => (
                  <TouchableOpacity
                    key={child.id}
                    style={styles.childItem}
                    onPress={() => handleEnrollChild(child)}
                    disabled={enrolling}
                    activeOpacity={0.7}
                  >
                    <View style={styles.childAvatar}>
                      <Text style={styles.childAvatarText}>
                        {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{child.full_name}</Text>
                      {child.birth_date && (
                        <Text style={styles.childBirth}>
                          {new Date(child.birth_date).toLocaleDateString('tr-TR')}
                        </Text>
                      )}
                    </View>
                    {enrolling ? (
                      <ActivityIndicator color={AppColors.primary} size="small" />
                    ) : (
                      <Text style={styles.selectArrow}>→</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backText: { color: AppColors.primary, fontSize: 15, fontWeight: '500', width: 60 },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', flex: 1, textAlign: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  schoolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  schoolIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  schoolIconText: { fontSize: 28 },
  schoolName: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  schoolType: { fontSize: 12, color: AppColors.primary, fontWeight: '600' },
  schoolInfo: { fontSize: 13, color: '#6B7280' },
  yearBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  yearBadgeText: { color: '#059669', fontSize: 12, fontWeight: '600' },
  // Kayıtlı çocuklar bölümü
  enrolledSection: {
    alignSelf: 'stretch',
    marginTop: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  enrolledTitle: { fontSize: 13, fontWeight: '700', color: '#166534', marginBottom: 4 },
  enrolledItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  enrolledAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enrolledAvatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  enrolledInfo: { flex: 1 },
  enrolledName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  enrolledBirth: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  enrolledArrow: { fontSize: 20, color: '#16A34A', fontWeight: '700' },
  enrollButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 4,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  enrollButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8,
  },
  pendingTitle: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  pendingChildName: { fontSize: 13, color: '#374151', fontWeight: '600' },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingBadgeText: { fontSize: 11, color: '#92400E', fontWeight: '600' },
  activityClassesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  activityClassesBtnText: {
    flex: 1,
    color: AppColors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 4,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  pinned: { fontSize: 11, color: AppColors.primary, fontWeight: '600', marginBottom: 8 },
  postAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  postAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAvatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  postAuthorName: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  postDate: { fontSize: 11, color: '#9CA3AF' },
  postContent: { fontSize: 14, color: '#374151', lineHeight: 21, marginBottom: 10 },
  postFooter: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  postStat: { fontSize: 12, color: '#6B7280' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  loader: { paddingVertical: 20 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  modalClose: { fontSize: 18, color: '#6B7280', padding: 4 },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  emptyModal: { alignItems: 'center', paddingVertical: 24, gap: 16 },
  emptyModalText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  addChildBtn: {
    backgroundColor: AppColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  addChildBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  childInfo: { flex: 1 },
  childName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  childBirth: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  selectArrow: { fontSize: 18, color: AppColors.primary, fontWeight: '700' },
});
