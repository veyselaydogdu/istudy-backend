import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

// ─── Types ────────────────────────────────────────────────

interface ActivityClassDetail {
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
  teachers: Array<{ id: number; name: string; role: string | null }>;
  materials: Array<{ id: number; name: string; quantity: string | null; is_required: boolean; description: string | null }>;
  enrolled_child_ids: number[];
}

interface FamilyChild {
  id: number;
  full_name: string;
  school_id: number | null;
}

interface GalleryItem {
  id: number;
  url: string;
  caption: string | null;
}

interface MyEnrollment {
  enrollment_id: number;
  activity_class: { id: number } | null;
  child: { id: number; name: string } | null;
  invoice: {
    status: string;
    amount: string;
    currency: string;
    payment_required: boolean;
  } | null;
}

// ─── Screen ───────────────────────────────────────────────

export default function ActivityClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activityClassId = Number(id);

  const [activityClass, setActivityClass] = useState<ActivityClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const [myEnrollments, setMyEnrollments] = useState<MyEnrollment[]>([]);
  const [familyChildren, setFamilyChildren] = useState<FamilyChild[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      const [detailRes, enrollmentsRes, childrenRes] = await Promise.all([
        api.get(`/parent/activity-classes/${activityClassId}`),
        api.get('/parent/activity-classes/my-enrollments'),
        api.get('/parent/children'),
      ]);

      const ac = detailRes.data?.data as ActivityClassDetail;
      setActivityClass(ac);
      setMyEnrollments(enrollmentsRes.data?.data ?? []);
      setFamilyChildren(childrenRes.data?.data ?? []);
    } catch (err) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activityClassId]);

  const loadGallery = useCallback(async () => {
    if (galleryLoaded) return;
    try {
      const res = await api.get(`/parent/activity-classes/${activityClassId}/gallery`);
      setGallery(res.data?.data ?? []);
      setGalleryLoaded(true);
    } catch { /* silent */ }
  }, [activityClassId, galleryLoaded]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const onRefresh = () => { setRefreshing(true); loadDetail(); };

  const enrolledChildIds = new Set(
    myEnrollments
      .filter(e => e.activity_class?.id === activityClassId)
      .map(e => e.child?.id)
      .filter((id): id is number => id != null)
  );

  const availableChildren = activityClass
    ? familyChildren.filter(c =>
        c.school_id != null && !enrolledChildIds.has(c.id)
      )
    : [];

  const handleEnroll = async () => {
    if (!selectedChildId) return;
    setEnrolling(true);
    try {
      await api.post(`/parent/activity-classes/${activityClassId}/enroll`, { child_id: selectedChildId });
      Alert.alert('Başarılı', 'Çocuğunuz etkinlik sınıfına kaydedildi.');
      setShowEnrollModal(false);
      setSelectedChildId(null);
      loadDetail();
    } catch (err) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = (childId: number, childName: string) => {
    Alert.alert(
      'Kaydı İptal Et',
      `${childName} adlı çocuğun kaydını iptal etmek istiyor musunuz?`,
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet, İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/parent/activity-classes/${activityClassId}/children/${childId}/unenroll`);
              Alert.alert('Başarılı', 'Kayıt iptal edildi.');
              loadDetail();
            } catch (err) {
              Alert.alert('Hata', getApiError(err));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!activityClass) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#9CA3AF' }}>Etkinlik sınıfı bulunamadı.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const enrolledChildren = familyChildren.filter(c => enrolledChildIds.has(c.id));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{activityClass.name}</Text>
          <View style={styles.heroTags}>
            <View style={styles.langTag}>
              <Text style={styles.langTagText}>{activityClass.language.toUpperCase()}</Text>
            </View>
            {activityClass.is_paid ? (
              <View style={styles.paidTag}>
                <Ionicons name="card-outline" size={12} color="#D97706" />
                <Text style={styles.paidTagText}>{activityClass.price} {activityClass.currency}</Text>
              </View>
            ) : (
              <View style={styles.freeTag}>
                <Text style={styles.freeTagText}>Ücretsiz</Text>
              </View>
            )}
          </View>
          {activityClass.description ? (
            <Text style={styles.heroDesc}>{activityClass.description}</Text>
          ) : null}
        </View>

        {/* Info Cards */}
        <View style={styles.infoGrid}>
          {(activityClass.age_min != null || activityClass.age_max != null) && (
            <View style={styles.infoCard}>
              <Ionicons name="people-outline" size={20} color="#208AEF" />
              <Text style={styles.infoLabel}>Yaş Aralığı</Text>
              <Text style={styles.infoValue}>{activityClass.age_min ?? '?'} - {activityClass.age_max ?? '?'}</Text>
            </View>
          )}
          {activityClass.capacity ? (
            <View style={styles.infoCard}>
              <Ionicons name="grid-outline" size={20} color="#208AEF" />
              <Text style={styles.infoLabel}>Kapasite</Text>
              <Text style={styles.infoValue}>{activityClass.active_enrollments_count}/{activityClass.capacity}</Text>
            </View>
          ) : null}
          {activityClass.schedule ? (
            <View style={styles.infoCard}>
              <Ionicons name="time-outline" size={20} color="#208AEF" />
              <Text style={styles.infoLabel}>Program</Text>
              <Text style={styles.infoValue}>{activityClass.schedule}</Text>
            </View>
          ) : null}
          {activityClass.location ? (
            <View style={styles.infoCard}>
              <Ionicons name="location-outline" size={20} color="#208AEF" />
              <Text style={styles.infoLabel}>Konum</Text>
              <Text style={styles.infoValue}>{activityClass.location}</Text>
            </View>
          ) : null}
          {(activityClass.start_date || activityClass.end_date) && (
            <View style={[styles.infoCard, { flex: 2 }]}>
              <Ionicons name="calendar-outline" size={20} color="#208AEF" />
              <Text style={styles.infoLabel}>Tarih</Text>
              <Text style={styles.infoValue}>
                {activityClass.start_date ? new Date(activityClass.start_date).toLocaleDateString('tr-TR') : '—'}
                {' – '}
                {activityClass.end_date ? new Date(activityClass.end_date).toLocaleDateString('tr-TR') : '—'}
              </Text>
            </View>
          )}
        </View>

        {/* Enrollment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kayıt Durumu</Text>
          {enrolledChildren.length > 0 ? (
            <>
              {enrolledChildren.map(child => (
                <View key={child.id} style={styles.enrolledRow}>
                  <View style={styles.enrolledInfo}>
                    <Ionicons name="checkmark-circle" size={20} color="#059669" />
                    <Text style={styles.enrolledName}>{child.full_name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleUnenroll(child.id, child.full_name)}>
                    <Text style={styles.unenrollText}>İptal</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.noEnrollText}>Kayıtlı çocuğunuz yok.</Text>
          )}
          {availableChildren.length > 0 && (
            <TouchableOpacity style={styles.enrollBtn} onPress={() => setShowEnrollModal(true)}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.enrollBtnText}>Çocuğumu Kayıt Et</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Teachers */}
        {activityClass.teachers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Öğretmenler</Text>
            {activityClass.teachers.map(t => (
              <View key={t.id} style={styles.teacherRow}>
                <Ionicons name="person-outline" size={18} color="#6B7280" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.teacherName}>{t.name}</Text>
                  {t.role ? <Text style={styles.teacherRole}>{t.role}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Materials */}
        {activityClass.materials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Getirilmesi Gerekenler</Text>
            {activityClass.materials.map(m => (
              <View key={m.id} style={styles.materialRow}>
                <View style={[styles.materialDot, { backgroundColor: m.is_required ? '#EF4444' : '#10B981' }]} />
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

        {/* Gallery Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.galleryBtn}
            onPress={() => {
              loadGallery();
              setShowGallery(true);
            }}
          >
            <Ionicons name="images-outline" size={20} color="#208AEF" />
            <Text style={styles.galleryBtnText}>Galeriyi Görüntüle</Text>
            <Ionicons name="chevron-forward" size={16} color="#208AEF" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Enroll Modal */}
      <Modal visible={showEnrollModal} transparent animationType="slide" onRequestClose={() => setShowEnrollModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Çocuğumu Kayıt Et</Text>
            <Text style={styles.modalSubtitle}>Kayıt etmek istediğiniz çocuğu seçin</Text>

            <View style={styles.childList}>
              {availableChildren.map(child => (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.childItem, selectedChildId === child.id && styles.childItemSelected]}
                  onPress={() => setSelectedChildId(child.id)}
                >
                  <Ionicons
                    name={selectedChildId === child.id ? 'checkmark-circle' : 'radio-button-off'}
                    size={20}
                    color={selectedChildId === child.id ? '#208AEF' : '#9CA3AF'}
                  />
                  <Text style={styles.childName}>{child.full_name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {activityClass.is_paid && (
              <View style={styles.invoiceNotice}>
                <Ionicons name="information-circle-outline" size={16} color="#D97706" />
                <Text style={styles.invoiceNoticeText}>
                  Bu etkinlik ücretlidir: {activityClass.price} {activityClass.currency}
                  {activityClass.invoice_required ? ' (Ödeme zorunlu)' : ' (Sonra ödenebilir)'}
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
            {gallery.length === 0 ? (
              <Text style={styles.galleryEmpty}>Galeri boş.</Text>
            ) : (
              gallery.map(item => (
                <View key={item.id} style={styles.galleryItem}>
                  <Image source={{ uri: item.url }} style={styles.galleryImage} resizeMode="cover" />
                  {item.caption ? <Text style={styles.galleryCaption}>{item.caption}</Text> : null}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { padding: 16 },
  topBar: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  hero: { backgroundColor: '#FFFFFF', padding: 20, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  langTag: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  langTagText: { fontSize: 12, color: '#1D4ED8', fontWeight: '600' },
  paidTag: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  paidTagText: { fontSize: 12, color: '#D97706', fontWeight: '600' },
  freeTag: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  freeTagText: { fontSize: 12, color: '#065F46', fontWeight: '600' },
  heroDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  infoCard: {
    flex: 1, minWidth: 140, backgroundColor: '#FFFFFF', borderRadius: 10,
    padding: 12, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  infoLabel: { fontSize: 11, color: '#9CA3AF' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'center' },
  section: { backgroundColor: '#FFFFFF', marginBottom: 8, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  enrolledRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  enrolledInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  enrolledName: { fontSize: 14, color: '#111827', fontWeight: '500' },
  unenrollText: { fontSize: 13, color: '#EF4444', fontWeight: '500' },
  noEnrollText: { fontSize: 14, color: '#9CA3AF', marginBottom: 12 },
  enrollBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#208AEF', borderRadius: 10, paddingVertical: 12, marginTop: 12 },
  enrollBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  teacherRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  teacherName: { fontSize: 14, color: '#111827', fontWeight: '500' },
  teacherRole: { fontSize: 12, color: '#9CA3AF' },
  materialRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  materialDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  materialName: { fontSize: 14, color: '#111827', fontWeight: '500' },
  materialQty: { fontSize: 13, color: '#9CA3AF', fontWeight: '400' },
  materialDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  requiredBadge: { fontSize: 10, color: '#EF4444', backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  galleryBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#EFF6FF', borderRadius: 10 },
  galleryBtnText: { flex: 1, color: '#208AEF', fontWeight: '600', fontSize: 14 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  childList: { gap: 10, marginBottom: 16 },
  childItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB' },
  childItemSelected: { borderColor: '#208AEF', backgroundColor: '#EFF6FF' },
  childName: { fontSize: 15, color: '#111827', fontWeight: '500' },
  invoiceNotice: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#FEF3C7', borderRadius: 8, padding: 12, marginBottom: 16 },
  invoiceNoticeText: { flex: 1, fontSize: 13, color: '#92400E' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  modalCancelText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#208AEF', alignItems: 'center' },
  modalConfirmDisabled: { backgroundColor: '#93C5FD' },
  modalConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Gallery Modal
  galleryOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  galleryClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  galleryGrid: { padding: 16, paddingTop: 90, gap: 12 },
  galleryItem: { borderRadius: 10, overflow: 'hidden' },
  galleryImage: { width: '100%', height: 200 },
  galleryCaption: { color: '#E5E7EB', fontSize: 12, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)' },
  galleryEmpty: { color: '#9CA3AF', textAlign: 'center', marginTop: 60, fontSize: 16 },
});
