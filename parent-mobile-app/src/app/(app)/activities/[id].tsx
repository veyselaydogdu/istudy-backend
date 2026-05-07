import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrivateImage } from '@/components/ui/PrivateImage';
import { AppColors } from '@/constants/theme';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HEADER_HEIGHT = 230;

const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// ─── Types ────────────────────────────────────────────────

interface ActivityDetail {
  id: number;
  name: string;
  description: string | null;
  is_global: boolean;
  school: { id: number; name: string } | null;
  tenant_name: string | null;
  cover_image_url: string | null;
  is_paid: boolean;
  price: string | null;
  currency: string;
  capacity: number | null;
  start_date: string | null;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  address: string | null;
  is_enrollment_required: boolean;
  classes: Array<{ id: number; name: string }>;
  materials: Array<{ id: number; name: string; quantity: string | null; is_required: boolean; description: string | null }>;
  enrolled_child_ids: string[];
  enrollments_count: number | null;
  gallery: Array<{ id: number; url: string; caption: string | null }>;
  participants: Array<{ name: string }>;
}

interface FamilyChild {
  id: string;
  full_name: string;
  school_id: number | null;
  birth_date: string | null;
  classes: Array<{ id: number; name: string }>;
}

// ─── Cover Header ─────────────────────────────────────────

function CoverHeader({ item }: { item: ActivityDetail }) {
  const startDate = item.start_date ? new Date(item.start_date) : null;
  const schoolLabel = item.is_global
    ? (item.tenant_name ?? 'Global')
    : (item.school?.name ?? item.tenant_name ?? null);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.coverContainer}>
      {item.cover_image_url ? (
        <PrivateImage uri={item.cover_image_url} style={styles.coverImage} contentFit="cover" />
      ) : (
        <View style={[styles.coverImage, styles.coverPlaceholder]} />
      )}

      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>

      <View style={styles.coverOverlay} />

      <View style={styles.coverBottom}>
        <View style={styles.coverLeft}>
          <View style={styles.coverMeta}>
            {item.is_global ? (
              <View style={styles.globalBadge}>
                <Ionicons name="globe-outline" size={10} color="#fff" />
                <Text style={styles.globalBadgeText}>Global</Text>
              </View>
            ) : null}
            {schoolLabel ? (
              <Text style={styles.coverSchool} numberOfLines={1}>{schoolLabel}</Text>
            ) : null}
          </View>
          <Text style={styles.coverTitle} numberOfLines={2}>{item.name}</Text>
        </View>

        {startDate ? (
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeDay}>{startDate.getDate()}</Text>
            <Text style={styles.dateBadgeMonth}>{TR_MONTHS[startDate.getMonth()]}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Footer Card ──────────────────────────────────────────

function FooterCard({ item }: { item: ActivityDetail }) {
  const classNames = item.classes?.length ? item.classes.map(c => c.name).join(', ') : null;

  return (
    <View style={styles.footerCard}>
      {item.address ? (
        <View style={styles.footerItem}>
          <Ionicons name="location-outline" size={14} color={AppColors.onSurfaceVariant} />
          <Text style={styles.footerText} numberOfLines={1}>{item.address}</Text>
        </View>
      ) : null}

      {item.capacity ? (
        <View style={styles.footerItem}>
          <Ionicons name="people-outline" size={14} color={AppColors.onSurfaceVariant} />
          <Text style={styles.footerText}>{item.enrollments_count ?? 0}/{item.capacity}</Text>
        </View>
      ) : null}

      {classNames ? (
        <View style={styles.footerItem}>
          <Ionicons name="school-outline" size={14} color={AppColors.onSurfaceVariant} />
          <Text style={styles.footerText} numberOfLines={1}>{classNames}</Text>
        </View>
      ) : null}

      {item.is_paid ? (
        <View style={[styles.footerBadge, styles.paidBadge]}>
          <Ionicons name="card-outline" size={12} color="#D97706" />
          <Text style={styles.paidBadgeText}>{item.price} {item.currency}</Text>
        </View>
      ) : (
        <View style={[styles.footerBadge, styles.freeBadge]}>
          <Text style={styles.freeBadgeText}>Ücretsiz</Text>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [familyChildren, setFamilyChildren] = useState<FamilyChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showGallery, setShowGallery] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      const [detailRes, childrenRes] = await Promise.all([
        api.get(`/parent/activities/${id}`),
        api.get('/parent/children'),
      ]);

      setActivity(detailRes.data?.data as ActivityDetail);
      setFamilyChildren(childrenRes.data?.data ?? []);
    } catch (err) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const onRefresh = () => { setRefreshing(true); loadDetail(); };

  const enrolledChildIds = new Set(activity?.enrolled_child_ids ?? []);

  const enrolledChildren = familyChildren.filter(c => enrolledChildIds.has(c.id));
  const unenrolledChildren = familyChildren.filter(c => !enrolledChildIds.has(c.id));

  const handleEnroll = async () => {
    if (!selectedChildId || !activity) return;
    setEnrolling(true);
    try {
      await api.post(`/parent/activities/${activity.id}/enroll`, { child_id: selectedChildId });
      Alert.alert('Başarılı', 'Çocuğunuz etkinliğe kaydedildi.');
      setShowEnrollModal(false);
      setSelectedChildId(null);
      loadDetail();
    } catch (err) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={[styles.backBtn, { top: 16, left: 16, position: 'absolute' }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={AppColors.primary} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={{ color: AppColors.onSurfaceVariant }}>Etkinlik bulunamadı.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <CoverHeader item={activity} />

        {activity.description ? (
          <View style={styles.descCard}>
            <Text style={styles.descText}>{activity.description}</Text>
          </View>
        ) : null}

        <FooterCard item={activity} />

        {/* Tarih */}
        {(activity.start_date || activity.end_date) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tarih</Text>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={AppColors.primary} />
              <Text style={styles.infoRowText}>
                {activity.start_date ? new Date(activity.start_date).toLocaleDateString('tr-TR') : '—'}
                {activity.start_time ? ` ${activity.start_time}` : ''}
                {activity.end_date ? ` – ${new Date(activity.end_date).toLocaleDateString('tr-TR')}` : ''}
                {activity.end_time ? ` ${activity.end_time}` : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Kayıt Durumu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kayıt Durumu</Text>
          {enrolledChildren.length > 0 ? (
            enrolledChildren.map(child => (
              <View key={child.id} style={styles.enrolledRow}>
                <View style={styles.enrolledInfo}>
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  <Text style={styles.enrolledName}>{child.full_name}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noEnrollText}>Kayıtlı çocuğunuz yok.</Text>
          )}
          {unenrolledChildren.length > 0 && (
            <TouchableOpacity style={styles.enrollBtn} onPress={() => setShowEnrollModal(true)}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.enrollBtnText}>Çocuğumu Kayıt Et</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Katılımcılar */}
        {activity.participants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Katılımcılar</Text>
            {activity.participants.map((p, i) => (
              <View key={i} style={styles.enrolledRow}>
                <Ionicons name="person-outline" size={16} color={AppColors.onSurfaceVariant} />
                <Text style={styles.enrolledName}>{p.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Malzemeler */}
        {activity.materials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Getirilmesi Gerekenler</Text>
            {activity.materials.map(m => (
              <View key={m.id} style={styles.materialRow}>
                <View style={[styles.materialDot, { backgroundColor: m.is_required ? AppColors.error : AppColors.success }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.materialName}>
                    {m.name}
                    {m.quantity ? <Text style={styles.materialQty}> × {m.quantity}</Text> : null}
                  </Text>
                  {m.description ? <Text style={styles.materialDesc}>{m.description}</Text> : null}
                </View>
                {m.is_required && <Text style={styles.requiredBadge}>Zorunlu</Text>}
              </View>
            ))}
          </View>
        )}

        {activity.gallery.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.galleryBtn}
              onPress={() => setShowGallery(true)}
            >
              <Ionicons name="images-outline" size={20} color={AppColors.primary} />
              <Text style={styles.galleryBtnText}>Galeriyi Görüntüle ({activity.gallery.length})</Text>
              <Ionicons name="chevron-forward" size={16} color={AppColors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Enroll Modal */}
      <Modal visible={showEnrollModal} transparent animationType="slide" onRequestClose={() => setShowEnrollModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Çocuğumu Kayıt Et</Text>
            <Text style={styles.modalSubtitle}>Kayıt etmek istediğiniz çocuğu seçin</Text>
            <View style={styles.childList}>
              {unenrolledChildren.map(child => (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.childItem, selectedChildId === child.id && styles.childItemSelected]}
                  onPress={() => setSelectedChildId(child.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={selectedChildId === child.id ? 'checkmark-circle' : 'radio-button-off'}
                    size={20}
                    color={selectedChildId === child.id ? AppColors.primary : AppColors.onSurfaceVariant}
                  />
                  <Text style={styles.childName}>{child.full_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {activity.is_paid && (
              <View style={styles.invoiceNotice}>
                <Ionicons name="information-circle-outline" size={16} color="#D97706" />
                <Text style={styles.invoiceNoticeText}>
                  Bu etkinlik ücretlidir: {activity.price} {activity.currency}
                </Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowEnrollModal(false); setSelectedChildId(null); }}>
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, (!selectedChildId || enrolling) && styles.modalConfirmDisabled]}
                onPress={handleEnroll}
                disabled={!selectedChildId || enrolling}
              >
                {enrolling ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalConfirmText}>Kayıt Et</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Gallery Modal */}
      <Modal visible={showGallery} transparent animationType="fade" onRequestClose={() => setShowGallery(false)}>
        <View style={styles.galleryOverlay}>
          <TouchableOpacity style={styles.galleryClose} onPress={() => setShowGallery(false)}>
            <Ionicons name="close-circle" size={32} color="#fff" />
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.galleryGrid}>
            {activity.gallery.map(item => (
              <View key={item.id} style={styles.galleryItem}>
                <Image source={{ uri: item.url }} style={styles.galleryImage} resizeMode="cover" />
                {item.caption ? <Text style={styles.galleryCaption}>{item.caption}</Text> : null}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.surfaceContainerLow },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  backBtn: {
    position: 'absolute', left: 16, zIndex: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  coverContainer: { width: SCREEN_WIDTH, height: HEADER_HEIGHT, position: 'relative' },
  coverImage: { width: SCREEN_WIDTH, height: HEADER_HEIGHT },
  coverPlaceholder: { backgroundColor: AppColors.primary },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  coverBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16, gap: 12,
  },
  coverLeft: { flex: 1 },
  coverMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  globalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#7C3AED', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  globalBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  coverSchool: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  coverTitle: { fontSize: 20, fontWeight: '800', color: '#fff', lineHeight: 26 },
  dateBadge: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  dateBadgeDay: { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 22 },
  dateBadgeMonth: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.9)', lineHeight: 13 },

  descCard: { backgroundColor: AppColors.white, padding: 16, marginTop: 8 },
  descText: { fontSize: 14, color: AppColors.onSurface, lineHeight: 21 },

  footerCard: {
    backgroundColor: AppColors.white, flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'center', gap: 10, padding: 12, marginTop: 8,
    borderBottomWidth: 1, borderBottomColor: AppColors.surfaceContainerLow,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: AppColors.onSurfaceVariant, maxWidth: 120 },
  footerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  paidBadge: { backgroundColor: AppColors.warningContainer },
  paidBadgeText: { fontSize: 12, color: '#D97706', fontWeight: '700' },
  freeBadge: { backgroundColor: AppColors.successContainer },
  freeBadgeText: { fontSize: 12, color: '#065F46', fontWeight: '700' },

  section: { backgroundColor: AppColors.white, marginTop: 8, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoRowText: { flex: 1, fontSize: 14, color: AppColors.onSurface, lineHeight: 20 },

  enrolledRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: AppColors.surfaceContainerLow },
  enrolledInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  enrolledName: { fontSize: 14, color: AppColors.onSurface, fontWeight: '500' },
  noEnrollText: { fontSize: 14, color: AppColors.onSurfaceVariant, marginBottom: 12 },
  enrollBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: AppColors.primary, borderRadius: 10, paddingVertical: 12, marginTop: 12 },
  enrollBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  materialRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: AppColors.surfaceContainerLow },
  materialDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  materialName: { fontSize: 14, color: AppColors.onSurface, fontWeight: '500' },
  materialQty: { fontSize: 13, color: AppColors.onSurfaceVariant, fontWeight: '400' },
  materialDesc: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 2 },
  requiredBadge: { fontSize: 10, color: AppColors.error, backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  galleryBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: AppColors.primaryContainer, borderRadius: 10 },
  galleryBtnText: { flex: 1, color: AppColors.primary, fontWeight: '600', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: AppColors.onSurface, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: AppColors.onSurfaceVariant, marginBottom: 20 },
  childList: { gap: 10, marginBottom: 16 },
  childItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: AppColors.surfaceContainer },
  childItemSelected: { borderColor: AppColors.primary, backgroundColor: AppColors.primaryContainer },
  childName: { fontSize: 15, color: AppColors.onSurface, fontWeight: '500' },
  invoiceNotice: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: AppColors.warningContainer, borderRadius: 8, padding: 12, marginBottom: 16 },
  invoiceNoticeText: { flex: 1, fontSize: 13, color: '#92400E' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: AppColors.surfaceContainer, alignItems: 'center' },
  modalCancelText: { color: AppColors.onSurfaceVariant, fontWeight: '600', fontSize: 15 },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: AppColors.primary, alignItems: 'center' },
  modalConfirmDisabled: { backgroundColor: '#93C5FD' },
  modalConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  galleryOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  galleryClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  galleryGrid: { padding: 16, paddingTop: 90, gap: 12 },
  galleryItem: { borderRadius: 10, overflow: 'hidden' },
  galleryImage: { width: '100%', height: 200 },
  galleryCaption: { color: AppColors.surfaceContainer, fontSize: 12, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)' },
});
