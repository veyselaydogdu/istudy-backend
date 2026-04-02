import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryItem {
  id: number;
  file_type: 'image' | 'video' | 'document';
  mime_type: string;
  file_size: number;
  original_name: string;
  caption: string | null;
  sort_order: number;
  url: string;
  created_at: string;
}

interface Participant {
  name: string;
}

interface FamilyChild {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  school_id: number | null;
  classes?: Array<{ id: number; name: string }>;
}

interface ActivityDetail {
  id: number;
  name: string;
  description: string | null;
  is_paid: boolean;
  is_enrollment_required: boolean;
  cancellation_allowed: boolean;
  cancellation_deadline: string | null;
  price: string | null;
  start_date: string | null;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  enrolled_child_ids: number[];
  enrollments_count: number | null;
  school: { id: number; name: string } | null;
  school_id: number | null;
  classes: Array<{ id: number; name: string }>;
  gallery: GalleryItem[];
  materials: string[];
  participants: Participant[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');

function fmtDate(d: string | null, t?: string | null): string | null {
  if (!d) { return null; }
  const base = new Date(d + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  return t ? `${base} ${t}` : base;
}

function fmtBytes(b: number): string {
  if (b < 1024) { return `${b} B`; }
  if (b < 1024 * 1024) { return `${(b / 1024).toFixed(1)} KB`; }
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Gallery item ─────────────────────────────────────────────────────────────

function GalleryTile({ item, onPress }: { item: GalleryItem; onPress: () => void }) {
  const isImage = item.file_type === 'image';
  const isVideo = item.file_type === 'video';

  return (
    <TouchableOpacity style={styles.galleryTile} onPress={onPress} activeOpacity={0.8}>
      {isImage ? (
        <Image source={{ uri: item.url }} style={styles.galleryImage} resizeMode="cover" />
      ) : (
        <View style={[styles.galleryThumb, { backgroundColor: isVideo ? '#EDE9FE' : '#FEF3C7' }]}>
          <Ionicons
            name={isVideo ? 'play-circle-outline' : 'document-outline'}
            size={32}
            color={isVideo ? '#7C3AED' : '#D97706'}
          />
        </View>
      )}
      {item.caption ? (
        <Text style={styles.galleryCaption} numberOfLines={1}>{item.caption}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Gallery lightbox ─────────────────────────────────────────────────────────

function GalleryModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.lightboxBg}>
        <TouchableOpacity style={styles.lightboxClose} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {item.file_type === 'image' ? (
          <Image source={{ uri: item.url }} style={styles.lightboxImage} resizeMode="contain" />
        ) : (
          <View style={styles.lightboxDoc}>
            <Ionicons
              name={item.file_type === 'video' ? 'play-circle-outline' : 'document-outline'}
              size={64}
              color="#fff"
            />
            <Text style={styles.lightboxDocName}>{item.original_name}</Text>
            <Text style={styles.lightboxDocSize}>{fmtBytes(item.file_size)}</Text>
            <TouchableOpacity
              style={styles.lightboxOpenBtn}
              onPress={() => Linking.openURL(item.url)}
            >
              <Text style={styles.lightboxOpenText}>Aç / İndir</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.caption ? (
          <View style={styles.lightboxCaption}>
            <Text style={styles.lightboxCaptionText}>{item.caption}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ActivityEventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<GalleryItem | null>(null);

  // Çocuk seçim modal state'i
  const [children, setChildren] = useState<FamilyChild[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerChildId, setPickerChildId] = useState<number | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); }
    try {
      const res = await api.get<{ data: ActivityDetail }>(`/parent/activities/${id}`);
      setActivity(res.data.data);
    } catch (err) {
      Alert.alert('Hata', getApiError(err));
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  const loadChildren = useCallback(async () => {
    try {
      const res = await api.get<{ data: FamilyChild[] }>('/parent/children');
      setChildren(res.data.data ?? []);
    } catch { /* sessizce geç */ }
  }, []);

  useEffect(() => {
    void load();
    void loadChildren();
  }, [load, loadChildren]);

  // Etkinliğe uygun çocuklar: aynı okul, etkinliğin sınıf kısıtlaması varsa sınıf da uygun olmalı
  const eligibleChildren = (act: ActivityDetail): FamilyChild[] => {
    return children.filter((c) => {
      if (c.school_id !== act.school_id) { return false; }
      if (act.classes.length === 0) { return true; }
      const childClassIds = (c.classes ?? []).map((cl) => cl.id);
      return act.classes.some((ac) => childClassIds.includes(ac.id));
    });
  };

  const openEnrollPicker = (act: ActivityDetail) => {
    const eligible = eligibleChildren(act);
    if (eligible.length === 0) {
      Alert.alert('Uygun Çocuk Yok', 'Bu etkinliğe katılabilecek uygun çocuğunuz bulunmuyor.');
      return;
    }
    // Her zaman seçim modalını aç
    const unenrolled = eligible.filter((c) => !(act.enrolled_child_ids ?? []).includes(c.id));
    setPickerChildId(unenrolled[0]?.id ?? eligible[0].id);
    setPickerVisible(true);
  };

  const doEnroll = async (activityId: number, childId: number) => {
    setEnrolling(true);
    try {
      await api.post(`/parent/activities/${activityId}/enroll`, { child_id: childId });
      setPickerVisible(false);
      Alert.alert('Başarılı', 'Etkinliğe katıldınız!');
      void load(true);
    } catch (err) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = (childId: number, childName: string) => {
    if (!activity) { return; }
    Alert.alert(
      'Etkinlikten Ayrıl',
      `${childName} için "${activity.name}" kaydını iptal etmek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: async () => {
            setEnrolling(true);
            try {
              await api.delete(`/parent/activities/${activity.id}/unenroll`, { data: { child_id: childId } });
              Alert.alert('Bilgi', 'Etkinlik kaydı iptal edildi.');
              void load(true);
            } catch (err) {
              Alert.alert('Hata', getApiError(err));
            } finally {
              setEnrolling(false);
            }
          },
        },
      ]
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) { return null; }

  const startFmt = fmtDate(activity.start_date, activity.start_time?.slice(0, 5));
  const endFmt = fmtDate(activity.end_date, activity.end_time?.slice(0, 5));
  const enrolledChildIds = activity.enrolled_child_ids ?? [];
  const isEnrolled = enrolledChildIds.length > 0;
  const showGallery = !activity.is_enrollment_required || isEnrolled;
  const eligible = eligibleChildren(activity);
  const unenrolledEligible = eligible.filter((c) => !enrolledChildIds.includes(c.id));
  const enrolledChildren = children.filter((c) => enrolledChildIds.includes(c.id));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>Etkinlik Detayı</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="flag" size={36} color={AppColors.primary} />
          </View>
          <Text style={styles.heroName}>{activity.name}</Text>
          {activity.school && (
            <Text style={styles.heroSchool}>{activity.school.name}</Text>
          )}

          <View style={styles.heroBadges}>
            {isEnrolled ? (
              <View style={[styles.badge, styles.badgeGreen]}>
                <Ionicons name="checkmark-circle" size={13} color="#fff" />
                <Text style={styles.badgeTextWhite}>
                  {enrolledChildIds.length === 1 ? 'Katıldınız' : `${enrolledChildIds.length} Çocuk Katılıyor`}
                </Text>
              </View>
            ) : activity.is_enrollment_required ? (
              <View style={[styles.badge, styles.badgeAmber]}>
                <Ionicons name="person-add-outline" size={13} color="#D97706" />
                <Text style={styles.badgeTextAmber}>Kayıt Gerekli</Text>
              </View>
            ) : null}
            {activity.is_paid ? (
              <View style={[styles.badge, styles.badgeBlue]}>
                <Ionicons name="card-outline" size={13} color={AppColors.primary} />
                <Text style={styles.badgeTextBlue}>{activity.price} ₺</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeGray]}>
                <Text style={styles.badgeTextGray}>Ücretsiz</Text>
              </View>
            )}
          </View>
        </View>

        {/* Enroll CTA — kayıt gerekli VE ücretsiz etkinlikler için */}
        {eligible.length > 0 && (
          <View style={styles.section}>
            {/* Kayıtlı çocuklar — her biri için ayrıl butonu (yalnızca kayıt gerekli etkinliklerde) */}
            {enrolledChildren.map((child) => (
              <View key={child.id} style={enrollStyles.enrolledRow}>
                <View style={enrollStyles.enrolledAvatar}>
                  <Text style={enrollStyles.enrolledAvatarText}>
                    {child.first_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={enrollStyles.enrolledChildName}>{child.full_name}</Text>
                  <Text style={enrollStyles.enrolledLabel}>Katılıyor</Text>
                </View>
                {activity.cancellation_allowed && (
                  <TouchableOpacity
                    style={enrollStyles.unenrollBtn}
                    onPress={() => handleUnenroll(child.id, child.full_name)}
                    disabled={enrolling}
                  >
                    <Ionicons name="close-circle-outline" size={15} color="#EF4444" />
                    <Text style={enrollStyles.unenrollBtnText}>Ayrıl</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Henüz kayıt olmamış uygun çocuk varsa "Katıl" butonu */}
            {unenrolledEligible.length > 0 && (
              <TouchableOpacity
                style={[styles.ctaBtn, styles.ctaBtnPrimary]}
                onPress={() => openEnrollPicker(activity)}
                disabled={enrolling}
              >
                {enrolling
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="person-add-outline" size={18} color="#fff" />
                    <Text style={styles.ctaBtnPrimaryText}>
                      {isEnrolled ? 'Başka Çocuk Ekle' : 'Etkinliğe Katıl'}
                    </Text></>
                }
              </TouchableOpacity>
            )}

            {activity.cancellation_deadline && isEnrolled && (
              <Text style={styles.cancellationNote}>
                Son iptal tarihi: {fmtDate(activity.cancellation_deadline.slice(0, 10), activity.cancellation_deadline.slice(11, 16))}
              </Text>
            )}
            {activity.enrollments_count != null && (
              <Text style={styles.enrollCount}>{activity.enrollments_count} kişi katılıyor</Text>
            )}
          </View>
        )}

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Etkinlik Bilgileri</Text>

          {activity.description ? (
            <Text style={styles.description}>{activity.description}</Text>
          ) : null}

          <View style={styles.infoGrid}>
            {startFmt && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                <View>
                  <Text style={styles.infoLabel}>Başlangıç</Text>
                  <Text style={styles.infoValue}>{startFmt}</Text>
                </View>
              </View>
            )}
            {endFmt && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                <View>
                  <Text style={styles.infoLabel}>Bitiş</Text>
                  <Text style={styles.infoValue}>{endFmt}</Text>
                </View>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={16} color="#9CA3AF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Açık Olduğu Sınıflar</Text>
                {(activity.classes ?? []).length === 0 ? (
                  <Text style={[styles.infoValue, { color: '#059669' }]}>Her sınıfa açık etkinlik</Text>
                ) : (
                  <View style={styles.classTagsRow}>
                    {(activity.classes ?? []).map((c) => (
                      <View key={c.id} style={styles.classTag}>
                        <Text style={styles.classTagText}>{c.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Materials — her zaman görünür */}
        {activity.materials && activity.materials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Getirilmesi Gerekenler</Text>
            <View style={styles.materialsList}>
              {activity.materials.map((m, i) => (
                <View key={i} style={styles.materialItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={AppColors.primary} />
                  <Text style={styles.materialText}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Locked gallery notice */}
        {!showGallery && activity.is_enrollment_required && (
          <View style={styles.section}>
            <View style={styles.lockedGallery}>
              <Ionicons name="lock-closed-outline" size={28} color="#D1D5DB" />
              <Text style={styles.lockedGalleryTitle}>Galeri Kilitli</Text>
              <Text style={styles.lockedGalleryText}>
                Galeriyi ve katılımcıları görmek için etkinliğe katılın.
              </Text>
            </View>
          </View>
        )}

        {/* Gallery */}
        {showGallery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Galeri</Text>
            {activity.gallery.length === 0 ? (
              <View style={styles.emptyGallery}>
                <Ionicons name="images-outline" size={36} color="#D1D5DB" />
                <Text style={styles.emptyGalleryText}>Henüz galeri öğesi yok.</Text>
              </View>
            ) : (
              <View style={styles.galleryGrid}>
                {activity.gallery.map((item) => (
                  <GalleryTile key={item.id} item={item} onPress={() => setSelectedGallery(item)} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Participants */}
        {showGallery && activity.participants && activity.participants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Katılımcılar ({activity.participants.length})
            </Text>
            <View style={styles.participantsList}>
              {activity.participants.map((p, i) => (
                <View key={i} style={styles.participantRow}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.participantInitial}>
                      {p.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.participantName}>{p.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      {selectedGallery && (
        <GalleryModal item={selectedGallery} onClose={() => setSelectedGallery(null)} />
      )}

      {/* Çocuk Seçim Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={enrollStyles.pickerOverlay}>
          <View style={enrollStyles.pickerSheet}>
            <View style={enrollStyles.pickerHandle} />
            <Text style={enrollStyles.pickerTitle}>Hangi çocuk katılacak?</Text>
            <Text style={enrollStyles.pickerSubtitle}>{activity?.name}</Text>

            <View style={enrollStyles.pickerList}>
              {eligible.map((child) => {
                const alreadyEnrolled = enrolledChildIds.includes(child.id);
                const isSelected = pickerChildId === child.id;
                return (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      enrollStyles.pickerRow,
                      isSelected && !alreadyEnrolled && enrollStyles.pickerRowSelected,
                      alreadyEnrolled && enrollStyles.pickerRowDisabled,
                    ]}
                    onPress={() => { if (!alreadyEnrolled) { setPickerChildId(child.id); } }}
                    activeOpacity={alreadyEnrolled ? 1 : 0.7}
                  >
                    <View style={[enrollStyles.pickerRadio, isSelected && !alreadyEnrolled && enrollStyles.pickerRadioSelected]}>
                      {isSelected && !alreadyEnrolled && <View style={enrollStyles.pickerRadioDot} />}
                    </View>
                    <Text style={[enrollStyles.pickerChildName, alreadyEnrolled && { color: '#9CA3AF' }]}>
                      {child.full_name}
                    </Text>
                    {alreadyEnrolled && (
                      <View style={enrollStyles.enrolledMiniTag}>
                        <Text style={enrollStyles.enrolledMiniTagText}>Kayıtlı</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={enrollStyles.pickerActions}>
              <TouchableOpacity
                style={enrollStyles.pickerCancel}
                onPress={() => setPickerVisible(false)}
                disabled={enrolling}
              >
                <Text style={enrollStyles.pickerCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[enrollStyles.pickerConfirm, (!pickerChildId || enrolling) && { opacity: 0.5 }]}
                onPress={() => { if (pickerChildId && activity) { void doEnroll(activity.id, pickerChildId); } }}
                disabled={!pickerChildId || enrolling}
              >
                {enrolling
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={enrollStyles.pickerConfirmText}>Katıl</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Enroll styles ────────────────────────────────────────────────────────────

const enrollStyles = StyleSheet.create({
  enrolledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  enrolledAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enrolledAvatarText: { fontSize: 15, fontWeight: '700', color: '#059669' },
  enrolledChildName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  enrolledLabel: { fontSize: 12, color: '#059669', fontWeight: '500' },
  unenrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  unenrollBtnText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },

  // Picker modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 4,
  },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', textAlign: 'center' },
  pickerSubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: -8 },
  pickerList: { gap: 8 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  pickerRowSelected: { borderColor: AppColors.primary, backgroundColor: '#EFF6FF' },
  pickerRowDisabled: { opacity: 0.6, backgroundColor: '#F9FAFB' },
  pickerRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerRadioSelected: { borderColor: AppColors.primary },
  pickerRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primary,
  },
  pickerChildName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1F2937' },
  enrolledMiniTag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  enrolledMiniTagText: { fontSize: 11, color: '#059669', fontWeight: '600' },
  pickerActions: { flexDirection: 'row', gap: 10 },
  pickerCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  pickerCancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  pickerConfirm: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
  },
  pickerConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const TILE_SIZE = (SCREEN_W - 32 - 12) / 3;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', flex: 1, textAlign: 'center' },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },

  // Hero
  hero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroName: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  heroSchool: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeGreen: { backgroundColor: AppColors.primary },
  badgeAmber: { backgroundColor: '#FEF3C7' },
  badgeBlue: { backgroundColor: '#EFF6FF' },
  badgeGray: { backgroundColor: '#F3F4F6' },
  badgeTextWhite: { fontSize: 12, fontWeight: '700', color: '#fff' },
  badgeTextAmber: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  badgeTextBlue: { fontSize: 12, fontWeight: '700', color: AppColors.primary },
  badgeTextGray: { fontSize: 12, fontWeight: '600', color: '#6B7280' },

  // Section
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  description: { fontSize: 14, color: '#6B7280', lineHeight: 20 },

  // Info grid
  infoGrid: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#1F2937', fontWeight: '600', marginTop: 1 },

  // Enroll CTA
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  ctaBtnPrimary: { backgroundColor: AppColors.primary },
  ctaBtnDanger: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  ctaBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaBtnDangerText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  enrollCount: { textAlign: 'center', fontSize: 13, color: '#9CA3AF' },

  // Gallery
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  galleryTile: { width: TILE_SIZE, borderRadius: 10, overflow: 'hidden' },
  galleryImage: { width: TILE_SIZE, height: TILE_SIZE },
  galleryThumb: { width: TILE_SIZE, height: TILE_SIZE, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  galleryCaption: { fontSize: 10, color: '#9CA3AF', paddingHorizontal: 2, paddingTop: 2 },
  emptyGallery: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyGalleryText: { fontSize: 13, color: '#9CA3AF' },

  // Materials
  materialsList: { gap: 8 },
  materialItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  materialText: { fontSize: 14, color: '#1F2937', flex: 1 },

  cancellationNote: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 6 },

  // Class tags
  classTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  classTag: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  classTagText: { fontSize: 12, color: '#1D4ED8', fontWeight: '600' },

  // Participants
  participantsList: { gap: 10 },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  participantAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },
  participantInitial: { fontSize: 14, fontWeight: '700', color: AppColors.primary },
  participantName: { fontSize: 14, color: '#1F2937', fontWeight: '500' },

  // Locked gallery / materials
  lockedGallery: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  lockedGalleryTitle: { fontSize: 15, fontWeight: '700', color: '#374151' },
  lockedGalleryText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },

  // Lightbox
  lightboxBg: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  lightboxClose: { position: 'absolute', top: 52, right: 20, zIndex: 10, padding: 8 },
  lightboxImage: { width: SCREEN_W, height: SCREEN_W * 1.2 },
  lightboxDoc: { alignItems: 'center', gap: 12, padding: 32 },
  lightboxDocName: { fontSize: 15, color: '#fff', fontWeight: '600', textAlign: 'center' },
  lightboxDocSize: { fontSize: 12, color: '#9CA3AF' },
  lightboxOpenBtn: { backgroundColor: AppColors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  lightboxOpenText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  lightboxCaption: { position: 'absolute', bottom: 40, left: 16, right: 16 },
  lightboxCaptionText: { color: '#fff', fontSize: 14, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 },
});
