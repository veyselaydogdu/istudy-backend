import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  nationality: { id: number; name: string; name_tr: string | null; flag_emoji: string | null } | null;
  allergens: Array<{ id: number; name: string }>;
  conditions: Array<{ id: number; name: string }>;
  medications: Array<{ id: number; name: string; dose: string | null; usage_time: string[] | null; usage_days: string[] | null }>;
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

  useEffect(() => {
    void fetchChild();
  }, [fetchChild]);

  const handleDelete = () => {
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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.childName}>{child.full_name}</Text>
          {child.status === 'active' && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Aktif</Text>
            </View>
          )}
        </View>

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
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#208AEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
