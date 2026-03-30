import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../../lib/api';
import { getApiError } from '../../../../lib/auth';

interface ClassInfo {
  id: number;
  name: string;
  color: string | null;
  age_min: number | null;
  age_max: number | null;
  capacity: number | null;
  student_count: number;
  male_count: number;
  female_count: number;
  teachers: Array<{ id: number; name: string }>;
}

interface PendingEnrollment {
  id: number;
  school_id: number;
  school_name: string | null;
  created_at: string;
}

interface Child {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  blood_type: string | null;
  identity_number: string | null;
  parent_notes: string | null;
  special_notes: string | null;
  languages: string[] | null;
  profile_photo: string | null;
  status: string;
  school_id: number | null;
  school: { id: number; name: string } | null;
  nationality: { id: number; name: string; name_tr: string | null; flag_emoji: string | null } | null;
  allergens: Array<{ id: number; name: string; status?: string }>;
  conditions: Array<{ id: number; name: string; status?: string }>;
  medications: Array<{ id: number; name: string; dose: string | null; usage_time: string[] | null; usage_days: string[] | null }>;
  class_info: ClassInfo | null;
  pending_enrollment: PendingEnrollment | null;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={detailStyles.infoRow}>
      <Text style={detailStyles.infoLabel}>{label}</Text>
      <Text style={detailStyles.infoValue}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    paddingLeft: 12,
  },
});

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchChild = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await api.get<{ data: Child }>(`/parent/children/${id}`);
      setChild(response.data.data);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  // Edit ekranından geri dönünce güncel veriyi çek
  useFocusEffect(
    useCallback(() => {
      void fetchChild();
    }, [fetchChild])
  );

  const sendRemovalRequest = async () => {
    try {
      await api.post(`/parent/children/${id}/removal-request`, {});
      Alert.alert(
        'Talep Gönderildi',
        'Silme talebiniz okul yönetimine iletildi. Okul onayladıktan sonra çocuk kaydı silinecektir.'
      );
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    }
  };

  const handleDelete = () => {
    if (child?.school_id) {
      // Çocuk okula kayıtlı — silme talebi akışı
      Alert.alert(
        'Okul Kaydı Mevcut',
        `${child.full_name} adlı çocuk ${child.school?.name ?? 'bir okula'} kayıtlı.\n\nSilmek için okul yönetimine talep gönderilecektir. Onay sonrasında çocuk kaydı silinecektir.`,
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Talep Gönder',
            onPress: () => void sendRemovalRequest(),
          },
        ]
      );
    } else {
      // Okul kaydı yok — direkt sil
      Alert.alert(
        'Çocuğu Sil',
        `${child?.full_name} adlı çocuğu silmek istediğinize emin misiniz?`,
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: async () => {
              try {
                await api.delete(`/parent/children/${id}`);
                router.back();
              } catch (err: unknown) {
                Alert.alert('Hata', getApiError(err));
              }
            },
          },
        ]
      );
    }
  };

  const handlePickPhoto = () => {
    Alert.alert('Profil Fotoğrafı', 'Fotoğraf kaynağını seçin', [
      {
        text: 'Galeriden Seç',
        onPress: () => void pickFromGallery(),
      },
      {
        text: 'Kameradan Çek',
        onPress: () => void pickFromCamera(),
      },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      await uploadPhoto(result.assets[0]);
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      await uploadPhoto(result.assets[0]);
    }
  };

  const uploadPhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      const filename = asset.uri.split('/').pop() ?? 'photo.jpg';
      const type = asset.mimeType ?? 'image/jpeg';
      formData.append('photo', { uri: asset.uri, name: filename, type } as unknown as Blob);

      const res = await api.post<{ data: { profile_photo: string } }>(
        `/parent/children/${id}/profile-photo`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setChild((prev) =>
        prev ? { ...prev, profile_photo: res.data.data.profile_photo } : prev
      );
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading || !child) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      </SafeAreaView>
    );
  }

  const initials = `${child.first_name.charAt(0)}${child.last_name.charAt(0)}`.toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Çocuk Detayı</Text>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/children/${id}/edit`)}
          activeOpacity={0.7}
        >
          <Text style={styles.editText}>Düzenle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void fetchChild(true);
            }}
            tintColor="#208AEF"
          />
        }
      >
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8} disabled={uploadingPhoto}>
            <View style={styles.avatarContainer}>
              {child.profile_photo ? (
                <Image source={{ uri: child.profile_photo }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              {uploadingPhoto ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                </View>
              ) : (
                <View style={styles.photoEditBadge}>
                  <Text style={styles.photoEditIcon}>📷</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.childName}>{child.full_name}</Text>
          {child.status === 'active' && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Aktif</Text>
            </View>
          )}
          {child.school && (
            <TouchableOpacity
              style={styles.schoolBadge}
              onPress={() => child.school && router.push(`/(app)/schools/${child.school.id}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.schoolBadgeText}>🏫 {child.school.name}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bekleyen Kayıt Talebi */}
        {child.pending_enrollment && (
          <View style={classStyles.pendingCard}>
            <View style={classStyles.pendingIcon}>
              <Text style={classStyles.pendingIconText}>⏳</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={classStyles.pendingTitle}>Kayıt Talebi Beklemede</Text>
              <Text style={classStyles.pendingSchool}>
                {child.pending_enrollment.school_name ?? 'Okul'}
              </Text>
              <Text style={classStyles.pendingDate}>
                {new Date(child.pending_enrollment.created_at).toLocaleDateString('tr-TR')} tarihinde gönderildi
              </Text>
            </View>
          </View>
        )}

        {/* Sınıf Bilgisi */}
        {child.class_info && (
          <View style={styles.card}>
            <View style={classStyles.classHeader}>
              {child.class_info.color ? (
                <View style={[classStyles.classColorDot, { backgroundColor: child.class_info.color }]} />
              ) : null}
              <Text style={styles.cardTitle}>{child.class_info.name}</Text>
            </View>

            <View style={classStyles.statsRow}>
              <View style={classStyles.statBox}>
                <Text style={classStyles.statNumber}>{child.class_info.student_count}</Text>
                <Text style={classStyles.statLabel}>Toplam</Text>
              </View>
              <View style={classStyles.statDivider} />
              <View style={classStyles.statBox}>
                <Text style={[classStyles.statNumber, { color: '#3B82F6' }]}>{child.class_info.male_count}</Text>
                <Text style={classStyles.statLabel}>Erkek</Text>
              </View>
              <View style={classStyles.statDivider} />
              <View style={classStyles.statBox}>
                <Text style={[classStyles.statNumber, { color: '#EC4899' }]}>{child.class_info.female_count}</Text>
                <Text style={classStyles.statLabel}>Kız</Text>
              </View>
              {child.class_info.capacity ? (
                <>
                  <View style={classStyles.statDivider} />
                  <View style={classStyles.statBox}>
                    <Text style={classStyles.statNumber}>{child.class_info.capacity}</Text>
                    <Text style={classStyles.statLabel}>Kapasite</Text>
                  </View>
                </>
              ) : null}
            </View>

            {(child.class_info.age_min !== null || child.class_info.age_max !== null) && (
              <View style={detailStyles.infoRow}>
                <Text style={detailStyles.infoLabel}>Yaş Aralığı</Text>
                <Text style={detailStyles.infoValue}>
                  {child.class_info.age_min ?? '?'} - {child.class_info.age_max ?? '?'} yaş
                </Text>
              </View>
            )}

            {child.class_info.teachers.length > 0 && (
              <View style={classStyles.teachersSection}>
                <Text style={classStyles.teachersLabel}>Öğretmenler</Text>
                <View style={classStyles.teachersList}>
                  {child.class_info.teachers.map((t) => (
                    <View key={t.id} style={classStyles.teacherChip}>
                      <Text style={classStyles.teacherChipText}>👩‍🏫 {t.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>
          <InfoRow label="Doğum Tarihi" value={child.birth_date} />
          <InfoRow
            label="Cinsiyet"
            value={
              child.gender === 'male'
                ? 'Erkek'
                : child.gender === 'female'
                  ? 'Kız'
                  : child.gender === 'other'
                    ? 'Diğer'
                    : null
            }
          />
          <InfoRow label="Kan Grubu" value={child.blood_type} />
          <InfoRow label="TC Kimlik No" value={child.identity_number} />
          <InfoRow
            label="Uyruk"
            value={
              child.nationality
                ? `${child.nationality.flag_emoji ?? ''} ${child.nationality.name_tr ?? child.nationality.name}`
                : null
            }
          />
          {child.languages && child.languages.length > 0 && (
            <View style={detailStyles.infoRow}>
              <Text style={detailStyles.infoLabel}>Bildiği Diller</Text>
              <Text style={detailStyles.infoValue}>
                {child.languages.join(', ')}
              </Text>
            </View>
          )}
        </View>

        {(child.allergens.length > 0 || child.conditions.length > 0 || child.medications.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sağlık Bilgileri</Text>
            {child.allergens.length > 0 && (
              <View style={styles.tagSection}>
                <Text style={styles.tagSectionLabel}>Alerjenler</Text>
                <View style={styles.tags}>
                  {child.allergens.map((a) => (
                    <View key={a.id} style={[styles.tag, styles.tagRed]}>
                      <Text style={styles.tagTextRed}>{a.name}</Text>
                      {a.status === 'pending' && (
                        <Text style={styles.pendingBadge}> (onay bekleniyor)</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
            {child.conditions.length > 0 && (
              <View style={styles.tagSection}>
                <Text style={styles.tagSectionLabel}>Tıbbi Durumlar</Text>
                <View style={styles.tags}>
                  {child.conditions.map((c) => (
                    <View key={c.id} style={[styles.tag, styles.tagOrange]}>
                      <Text style={styles.tagTextOrange}>{c.name}</Text>
                      {c.status === 'pending' && (
                        <Text style={styles.pendingBadge}> (onay bekleniyor)</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
            {child.medications.length > 0 && (
              <View style={styles.tagSection}>
                <Text style={styles.tagSectionLabel}>İlaçlar</Text>
                {child.medications.map((m) => (
                  <View key={m.id} style={styles.medItem}>
                    <Text style={styles.medName}>{m.name}</Text>
                    {m.dose && <Text style={styles.medDetail}>Doz: {m.dose}</Text>}
                    {m.usage_time && m.usage_time.length > 0 && (
                      <Text style={styles.medDetail}>
                        Saatler: {m.usage_time.join(', ')}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {(child.parent_notes || child.special_notes) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notlar</Text>
            {child.parent_notes && (
              <View style={styles.noteSection}>
                <Text style={styles.noteLabel}>Veli Notu</Text>
                <Text style={styles.noteText}>{child.parent_notes}</Text>
              </View>
            )}
            {child.special_notes && (
              <View style={styles.noteSection}>
                <Text style={styles.noteLabel}>Özel Not</Text>
                <Text style={styles.noteText}>{child.special_notes}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.healthButton}
            onPress={() => router.push(`/(app)/children/${id}/health`)}
            activeOpacity={0.8}
          >
            <Text style={styles.healthButtonText}>🏥 Sağlık Bilgilerini Düzenle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteButtonText}>Çocuğu Sil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const classStyles = StyleSheet.create({
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingIconText: { fontSize: 20 },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  pendingSchool: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
    marginBottom: 2,
  },
  pendingDate: {
    fontSize: 12,
    color: '#D97706',
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  classColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  teachersSection: {
    paddingTop: 8,
    gap: 8,
  },
  teachersLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teachersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  teacherChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  teacherChipText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  backText: {
    color: '#208AEF',
    fontSize: 15,
    fontWeight: '500',
    width: 60,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  editText: {
    color: '#208AEF',
    fontSize: 15,
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#208AEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoEditIcon: { fontSize: 14 },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  childName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  schoolBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  schoolBadgeText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  tagSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  tagSectionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBadge: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  tagRed: {
    backgroundColor: '#FEE2E2',
  },
  tagTextRed: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  tagOrange: {
    backgroundColor: '#FEF3C7',
  },
  tagTextOrange: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
  },
  medItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 2,
  },
  medName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  medDetail: {
    fontSize: 12,
    color: '#6B7280',
  },
  noteSection: {
    paddingVertical: 8,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  noteLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actions: {
    gap: 10,
    paddingBottom: 16,
  },
  healthButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  healthButtonText: {
    color: '#208AEF',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '600',
  },
});
