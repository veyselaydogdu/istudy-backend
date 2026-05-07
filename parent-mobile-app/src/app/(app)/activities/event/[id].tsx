import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrivateImage } from '@/components/ui/PrivateImage';
import { AppColors } from '@/constants/theme';
import api from '../../../../lib/api';
import { getApiError } from '../../../../lib/auth';

const { width: SCREEN_W } = Dimensions.get('window');
const HEADER_HEIGHT = 240;
const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

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
  id: string;
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
  is_global: boolean;
  cancellation_allowed: boolean;
  cancellation_deadline: string | null;
  price: string | null;
  currency: string;
  capacity: number | null;
  start_date: string | null;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  address: string | null;
  cover_image_url: string | null;
  enrolled_child_ids: string[];
  enrollments_count: number | null;
  school: { id: number; name: string } | null;
  school_id: number | null;
  tenant?: { id: number; name: string } | null;
  tenant_name?: string | null;
  classes: Array<{ id: number; name: string }>;
  gallery: GalleryItem[];
  materials: string[];
  participants: Participant[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Cover Header ─────────────────────────────────────────────────────────────

function CoverHeader({ item }: { item: ActivityDetail }) {
  const insets = useSafeAreaInsets();
  const startDate = item.start_date ? new Date(item.start_date) : null;
  const schoolLabel = item.is_global
    ? (item.tenant_name ?? item.tenant?.name ?? 'Global')
    : (item.school?.name ?? item.tenant_name ?? null);

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

// ─── Footer Card ──────────────────────────────────────────────────────────────

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
      ) : item.enrollments_count != null ? (
        <View style={styles.footerItem}>
          <Ionicons name="people-outline" size={14} color={AppColors.onSurfaceVariant} />
          <Text style={styles.footerText}>{item.enrollments_count} katılımcı</Text>
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

// ─── Gallery tile ─────────────────────────────────────────────────────────────

const TILE_SIZE = (SCREEN_W - 32 - 12) / 3;

function GalleryTile({ item, onPress }: { item: GalleryItem; onPress: () => void }) {
  const isImage = item.file_type === 'image';
  const isVideo = item.file_type === 'video';

  return (
    <TouchableOpacity style={styles.galleryTile} onPress={onPress} activeOpacity={0.8}>
      {isImage ? (
        <Image source={{ uri: item.url }} style={styles.galleryThumbImg} resizeMode="cover" />
      ) : (
        <View style={[styles.galleryThumb, { backgroundColor: isVideo ? '#EDE9FE' : AppColors.warningContainer }]}>
          <Ionicons name={isVideo ? 'play-circle-outline' : 'document-outline'} size={32} color={isVideo ? '#7C3AED' : AppColors.warning} />
        </View>
      )}
      {item.caption ? <Text style={styles.galleryCaption} numberOfLines={1}>{item.caption}</Text> : null}
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
            <Ionicons name={item.file_type === 'video' ? 'play-circle-outline' : 'document-outline'} size={64} color="#fff" />
            <Text style={styles.lightboxDocName}>{item.original_name}</Text>
            <Text style={styles.lightboxDocSize}>{fmtBytes(item.file_size)}</Text>
            <TouchableOpacity style={styles.lightboxOpenBtn} onPress={() => Linking.openURL(item.url)}>
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
  const [children, setChildren] = useState<FamilyChild[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerChildId, setPickerChildId] = useState<string | null>(null);

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

  const eligibleChildren = (act: ActivityDetail): FamilyChild[] => {
    return children.filter((c) => {
      if (!act.is_global && c.school_id !== act.school_id) { return false; }
      if (act.is_global || act.classes.length === 0) { return true; }
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
    const unenrolled = eligible.filter((c) => !(act.enrolled_child_ids ?? []).includes(c.id));
    setPickerChildId(unenrolled[0]?.id ?? eligible[0].id);
    setPickerVisible(true);
  };

  const doEnroll = async (activityId: number, childId: string) => {
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

  const handleUnenroll = (childId: string, childName: string) => {
    if (!activity) { return; }
    Alert.alert(
      'Etkinlikten Ayrıl',
      `${childName} için "${activity.name}" kaydını iptal etmek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ayrıl', style: 'destructive',
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
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.coverPlaceholder} />
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
  const canSeeGallery = !activity.is_enrollment_required || isEnrolled;
  const eligible = eligibleChildren(activity);
  const unenrolledEligible = eligible.filter((c) => !enrolledChildIds.includes(c.id));
  const enrolledChildren = children.filter((c) => enrolledChildIds.includes(c.id));

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />}
      >
        <CoverHeader item={activity} />

        {activity.description ? (
          <View style={styles.descCard}>
            <Text style={styles.descText}>{activity.description}</Text>
          </View>
        ) : null}

        <FooterCard item={activity} />

        {/* Enrollment */}
        {eligible.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kayıt Durumu</Text>
            {enrolledChildren.map((child) => (
              <View key={child.id} style={enrollStyles.enrolledRow}>
                <View style={enrollStyles.enrolledAvatar}>
                  <Text style={enrollStyles.enrolledAvatarText}>{child.first_name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={enrollStyles.enrolledChildName}>{child.full_name}</Text>
                  <Text style={enrollStyles.enrolledLabel}>Katılıyor</Text>
                </View>
                {activity.cancellation_allowed && (
                  <TouchableOpacity style={enrollStyles.unenrollBtn} onPress={() => handleUnenroll(child.id, child.full_name)} disabled={enrolling}>
                    <Ionicons name="close-circle-outline" size={15} color="#EF4444" />
                    <Text style={enrollStyles.unenrollBtnText}>Ayrıl</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {unenrolledEligible.length > 0 && (
              <TouchableOpacity style={styles.enrollBtn} onPress={() => openEnrollPicker(activity)} disabled={enrolling}>
                {enrolling
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="person-add-outline" size={18} color="#fff" /><Text style={styles.enrollBtnText}>{isEnrolled ? 'Başka Çocuk Ekle' : 'Etkinliğe Katıl'}</Text></>
                }
              </TouchableOpacity>
            )}
            {activity.cancellation_deadline && isEnrolled && (
              <Text style={styles.cancellationNote}>Son iptal tarihi: {fmtDate(activity.cancellation_deadline.slice(0, 10), activity.cancellation_deadline.slice(11, 16))}</Text>
            )}
          </View>
        )}

        {/* Tarih & Sınıflar */}
        {(startFmt || endFmt || activity.classes.length > 0) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Etkinlik Bilgileri</Text>
            {startFmt ? (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                <View>
                  <Text style={styles.infoLabel}>Başlangıç</Text>
                  <Text style={styles.infoValue}>{startFmt}</Text>
                </View>
              </View>
            ) : null}
            {endFmt ? (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                <View>
                  <Text style={styles.infoLabel}>Bitiş</Text>
                  <Text style={styles.infoValue}>{endFmt}</Text>
                </View>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={16} color="#9CA3AF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Açık Olduğu Sınıflar</Text>
                {activity.classes.length === 0 ? (
                  <Text style={[styles.infoValue, { color: AppColors.success }]}>Her sınıfa açık</Text>
                ) : (
                  <View style={styles.classTagsRow}>
                    {activity.classes.map((c) => (
                      <View key={c.id} style={styles.classTag}>
                        <Text style={styles.classTagText}>{c.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : null}

        {/* Malzemeler */}
        {activity.materials && activity.materials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Getirilmesi Gerekenler</Text>
            {activity.materials.map((m, i) => (
              <View key={i} style={styles.materialItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color={AppColors.primary} />
                <Text style={styles.materialText}>{m}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Galeri */}
        {!canSeeGallery && activity.is_enrollment_required ? (
          <View style={styles.section}>
            <View style={styles.lockedGallery}>
              <Ionicons name="lock-closed-outline" size={28} color="#D1D5DB" />
              <Text style={styles.lockedGalleryTitle}>Galeri Kilitli</Text>
              <Text style={styles.lockedGalleryText}>Galeriyi görmek için etkinliğe katılın.</Text>
            </View>
          </View>
        ) : canSeeGallery && activity.gallery.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Galeri</Text>
            <View style={styles.galleryGrid}>
              {activity.gallery.map((item) => (
                <GalleryTile key={item.id} item={item} onPress={() => setSelectedGallery(item)} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Katılımcılar */}
        {canSeeGallery && activity.participants && activity.participants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Katılımcılar ({activity.participants.length})</Text>
            {activity.participants.map((p, i) => (
              <View key={i} style={styles.participantRow}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.participantInitial}>{p.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.participantName}>{p.name}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {selectedGallery && (
        <GalleryModal item={selectedGallery} onClose={() => setSelectedGallery(null)} />
      )}

      {/* Çocuk seçim modal */}
      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
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
                    style={[enrollStyles.pickerRow, isSelected && !alreadyEnrolled && enrollStyles.pickerRowSelected, alreadyEnrolled && enrollStyles.pickerRowDisabled]}
                    onPress={() => { if (!alreadyEnrolled) { setPickerChildId(child.id); } }}
                    activeOpacity={alreadyEnrolled ? 1 : 0.7}
                  >
                    <View style={[enrollStyles.pickerRadio, isSelected && !alreadyEnrolled && enrollStyles.pickerRadioSelected]}>
                      {isSelected && !alreadyEnrolled && <View style={enrollStyles.pickerRadioDot} />}
                    </View>
                    <Text style={[enrollStyles.pickerChildName, alreadyEnrolled && { color: AppColors.onSurfaceVariant }]}>{child.full_name}</Text>
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
              <TouchableOpacity style={enrollStyles.pickerCancel} onPress={() => setPickerVisible(false)} disabled={enrolling}>
                <Text style={enrollStyles.pickerCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[enrollStyles.pickerConfirm, (!pickerChildId || enrolling) && { opacity: 0.5 }]}
                onPress={() => { if (pickerChildId && activity) { void doEnroll(activity.id, pickerChildId); } }}
                disabled={!pickerChildId || enrolling}
              >
                {enrolling ? <ActivityIndicator size="small" color="#fff" /> : <Text style={enrollStyles.pickerConfirmText}>Katıl</Text>}
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
  enrolledRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: AppColors.surfaceContainerLow },
  enrolledAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: AppColors.successContainer, justifyContent: 'center', alignItems: 'center' },
  enrolledAvatarText: { fontSize: 15, fontWeight: '700', color: AppColors.success },
  enrolledChildName: { fontSize: 14, fontWeight: '600', color: AppColors.onSurface },
  enrolledLabel: { fontSize: 12, color: AppColors.success, fontWeight: '500' },
  unenrollBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#FCA5A5' },
  unenrollBtnText: { fontSize: 12, color: AppColors.error, fontWeight: '600' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: AppColors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, gap: 16 },
  pickerHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: AppColors.surfaceContainer, alignSelf: 'center', marginBottom: 4 },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: AppColors.onSurface, textAlign: 'center' },
  pickerSubtitle: { fontSize: 13, color: AppColors.onSurfaceVariant, textAlign: 'center', marginTop: -8 },
  pickerList: { gap: 8 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: AppColors.surfaceContainer, backgroundColor: '#FAFAFA' },
  pickerRowSelected: { borderColor: AppColors.primary, backgroundColor: AppColors.primaryContainer },
  pickerRowDisabled: { opacity: 0.6, backgroundColor: AppColors.surfaceContainerLow },
  pickerRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: AppColors.surfaceContainer, justifyContent: 'center', alignItems: 'center' },
  pickerRadioSelected: { borderColor: AppColors.primary },
  pickerRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: AppColors.primary },
  pickerChildName: { flex: 1, fontSize: 15, fontWeight: '600', color: AppColors.onSurface },
  enrolledMiniTag: { backgroundColor: AppColors.successContainer, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  enrolledMiniTagText: { fontSize: 11, color: AppColors.success, fontWeight: '600' },
  pickerActions: { flexDirection: 'row', gap: 10 },
  pickerCancel: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: AppColors.surfaceContainerLow, alignItems: 'center' },
  pickerCancelText: { fontSize: 15, fontWeight: '600', color: AppColors.onSurfaceVariant },
  pickerConfirm: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: AppColors.primary, alignItems: 'center' },
  pickerConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.surfaceContainerLow },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  backBtn: {
    position: 'absolute', left: 16, zIndex: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  coverContainer: { width: SCREEN_W, height: HEADER_HEIGHT, position: 'relative' },
  coverImage: { width: SCREEN_W, height: HEADER_HEIGHT },
  coverPlaceholder: { backgroundColor: AppColors.primary },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  coverBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16, gap: 12,
  },
  coverLeft: { flex: 1 },
  coverMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  globalBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#7C3AED', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  globalBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  coverSchool: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  coverTitle: { fontSize: 20, fontWeight: '800', color: '#fff', lineHeight: 26 },
  dateBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
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

  section: { backgroundColor: AppColors.white, marginTop: 8, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoLabel: { fontSize: 11, color: AppColors.onSurfaceVariant, fontWeight: '500' },
  infoValue: { fontSize: 14, color: AppColors.onSurface, fontWeight: '600', marginTop: 1 },
  classTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  classTag: { backgroundColor: AppColors.primaryContainer, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#BFDBFE' },
  classTagText: { fontSize: 12, color: '#1D4ED8', fontWeight: '600' },

  enrollBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: AppColors.primary, borderRadius: 12, paddingVertical: 14, marginTop: 4 },
  enrollBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancellationNote: { fontSize: 12, color: AppColors.onSurfaceVariant, textAlign: 'center' },

  materialItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  materialText: { fontSize: 14, color: AppColors.onSurface, flex: 1 },

  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  galleryTile: { width: TILE_SIZE, borderRadius: 10, overflow: 'hidden' },
  galleryThumbImg: { width: TILE_SIZE, height: TILE_SIZE },
  galleryThumb: { width: TILE_SIZE, height: TILE_SIZE, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  galleryCaption: { fontSize: 10, color: AppColors.onSurfaceVariant, paddingHorizontal: 2, paddingTop: 2 },

  lockedGallery: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  lockedGalleryTitle: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface },
  lockedGalleryText: { fontSize: 13, color: AppColors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },

  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  participantAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: AppColors.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  participantInitial: { fontSize: 14, fontWeight: '700', color: AppColors.primary },
  participantName: { fontSize: 14, color: AppColors.onSurface, fontWeight: '500' },

  lightboxBg: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  lightboxClose: { position: 'absolute', top: 52, right: 20, zIndex: 10, padding: 8 },
  lightboxImage: { width: SCREEN_W, height: SCREEN_W * 1.2 },
  lightboxDoc: { alignItems: 'center', gap: 12, padding: 32 },
  lightboxDocName: { fontSize: 15, color: '#fff', fontWeight: '600', textAlign: 'center' },
  lightboxDocSize: { fontSize: 12, color: AppColors.onSurfaceVariant },
  lightboxOpenBtn: { backgroundColor: AppColors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  lightboxOpenText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  lightboxCaption: { position: 'absolute', bottom: 40, left: 16, right: 16 },
  lightboxCaptionText: { color: '#fff', fontSize: 14, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 },
});
