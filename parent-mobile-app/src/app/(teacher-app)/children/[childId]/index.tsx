import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../../lib/api';
import { getApiError } from '../../../../lib/auth';

interface ChildDetail {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string | null;
  blood_type: string | null;
  gender: string | null;
  school_name: string | null;
  class_name: string | null;
  allergens: Array<{ id: number; name: string }>;
  medications: Array<{ id: number; name: string; dose: string | null }>;
  family_profile: {
    owner: {
      id: number;
      name: string;
      surname: string;
      phone: string | null;
    } | null;
  } | null;
  emergency_contacts?: Array<{
    id: number;
    name: string;
    phone: string;
    relationship: string;
  }>;
}

interface TodayMedication {
  id: number;
  name: string;
  dose: string | null;
  times: string[];
  given: boolean;
}

function getAge(birthDate: string | null): string {
  if (!birthDate) { return ''; }
  const diff = Date.now() - new Date(birthDate).getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return `${age} yaş`;
}

export default function TeacherChildDetailScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [child, setChild] = useState<ChildDetail | null>(null);
  const [todayMeds, setTodayMeds] = useState<TodayMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [childRes, medsRes] = await Promise.all([
          api.get<{ data: ChildDetail }>(`/teacher/children/${childId}`),
          api.get<{ data: TodayMedication[] }>(`/teacher/children/${childId}/today-medications`),
        ]);
        setChild(childRes.data.data);
        setTodayMeds(medsRes.data.data);
      } catch (err: unknown) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [childId]);

  const handleMarkGiven = async (med: TodayMedication) => {
    try {
      await api.post('/teacher/medications/mark-given', {
        child_id: Number(childId),
        medication_id: med.id,
        dose: med.dose,
        given_at: new Date().toISOString(),
      });
      setTodayMeds((prev) =>
        prev.map((m) => (m.id === med.id ? { ...m, given: true } : m))
      );
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !child) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Öğrenci bulunamadı.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = `${child.first_name.charAt(0)}${child.last_name.charAt(0)}`.toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Öğrenci Detayı</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.childName}>{child.full_name}</Text>
          {child.birth_date && (
            <Text style={styles.childMeta}>{getAge(child.birth_date)}</Text>
          )}
          <View style={styles.profileMeta}>
            {child.blood_type && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>{child.blood_type}</Text>
              </View>
            )}
            {child.school_name && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>{child.school_name}</Text>
              </View>
            )}
            {child.class_name && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>{child.class_name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/(teacher-app)/children/${childId}/health`)}
            activeOpacity={0.75}
          >
            <Ionicons name="heart-outline" size={20} color="#EF4444" />
            <Text style={styles.actionBtnText}>Sağlık Bilgileri</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/(teacher-app)/children/${childId}/pickup`)}
            activeOpacity={0.75}
          >
            <Ionicons name="car-outline" size={20} color="#208AEF" />
            <Text style={styles.actionBtnText}>Teslim</Text>
          </TouchableOpacity>
        </View>

        {/* Family info */}
        {child.family_profile?.owner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Veli Bilgisi</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  {child.family_profile.owner.name} {child.family_profile.owner.surname}
                </Text>
              </View>
              {child.family_profile.owner.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{child.family_profile.owner.phone}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Emergency contacts */}
        {(child.emergency_contacts?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acil Durum Kişileri</Text>
            {child.emergency_contacts.map((ec) => (
              <View key={ec.id} style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{ec.name}</Text>
                  <View style={styles.relationBadge}>
                    <Text style={styles.relationBadgeText}>{ec.relationship}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{ec.phone}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Today medications */}
        {todayMeds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bugünün İlaçları</Text>
            {todayMeds.map((med) => (
              <View key={med.id} style={styles.medCard}>
                <View style={styles.medInfo}>
                  <Text style={styles.medName}>{med.name}</Text>
                  {med.dose && (
                    <Text style={styles.medDose}>Doz: {med.dose}</Text>
                  )}
                  {med.times.length > 0 && (
                    <Text style={styles.medTimes}>{med.times.join(', ')}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.givenBtn, med.given && styles.givenBtnDone]}
                  onPress={() => !med.given && handleMarkGiven(med)}
                  activeOpacity={med.given ? 1 : 0.75}
                >
                  <Ionicons
                    name={med.given ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={med.given ? AppColors.success : AppColors.onSurfaceVariant}
                  />
                  <Text style={[styles.givenBtnText, med.given && styles.givenBtnTextDone]}>
                    {med.given ? 'Verildi' : 'Ver'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.surface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.onSurface,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  errorText: {
    fontSize: 14,
    color: AppColors.error,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: AppColors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  childName: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.onSurface,
  },
  childMeta: {
    fontSize: 14,
    color: AppColors.onSurfaceVariant,
  },
  profileMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  metaBadge: {
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaBadgeText: {
    fontSize: 12,
    color: AppColors.onSurface,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.white,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.onSurface,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 8,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.onSurface,
    flex: 1,
  },
  relationBadge: {
    backgroundColor: AppColors.primaryContainer,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  relationBadgeText: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: '600',
  },
  medCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  medInfo: {
    flex: 1,
    gap: 3,
  },
  medName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  medDose: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
  },
  medTimes: {
    fontSize: 12,
    color: AppColors.onSurfaceVariant,
  },
  givenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  givenBtnDone: {
    backgroundColor: AppColors.successContainer,
  },
  givenBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.onSurfaceVariant,
  },
  givenBtnTextDone: {
    color: AppColors.success,
  },
});
