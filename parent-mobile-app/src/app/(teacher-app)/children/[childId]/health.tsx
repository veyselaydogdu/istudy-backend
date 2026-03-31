import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../../lib/api';
import { getApiError } from '../../../../lib/auth';

interface Allergen {
  id: number;
  name: string;
  status: string | null;
}

interface Condition {
  id: number;
  name: string;
  notes: string | null;
}

interface Medication {
  id: number;
  name: string;
  dose: string | null;
  days: string[];
  times: string[];
  notes: string | null;
}

interface ChildHealth {
  id: number;
  full_name: string;
  allergens: Allergen[];
  conditions: Condition[];
  medications: Medication[];
  health_notes: string | null;
}

export default function ChildHealthScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [health, setHealth] = useState<ChildHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await api.get<{ data: ChildHealth }>(`/teacher/children/${childId}`);
        setHealth(response.data.data);
      } catch (err: unknown) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [childId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !health) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sağlık Bilgileri</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Bilgi bulunamadı.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Sağlık Bilgileri</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.childName}>{health.full_name}</Text>

        {/* Allergens */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={18} color="#D97706" />
            <Text style={styles.sectionTitle}>Alerjenler</Text>
          </View>
          {health.allergens.length === 0 ? (
            <Text style={styles.emptyText}>Kayıtlı alerjen yok.</Text>
          ) : (
            <View style={styles.chipWrap}>
              {health.allergens.map((a) => (
                <View key={a.id} style={styles.allergenChip}>
                  <Text style={styles.allergenChipText}>{a.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Conditions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pulse-outline" size={18} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Hastalıklar / Rahatsızlıklar</Text>
          </View>
          {health.conditions.length === 0 ? (
            <Text style={styles.emptyText}>Kayıtlı hastalık yok.</Text>
          ) : (
            <View style={styles.chipWrap}>
              {health.conditions.map((c) => (
                <View key={c.id} style={styles.conditionChip}>
                  <Text style={styles.conditionChipText}>{c.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Medications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical-outline" size={18} color="#7C3AED" />
            <Text style={styles.sectionTitle}>İlaçlar</Text>
          </View>
          {health.medications.length === 0 ? (
            <Text style={styles.emptyText}>Kayıtlı ilaç yok.</Text>
          ) : (
            health.medications.map((med) => (
              <View key={med.id} style={styles.medCard}>
                <Text style={styles.medName}>{med.name}</Text>
                {med.dose && (
                  <Text style={styles.medDetail}>Doz: {med.dose}</Text>
                )}
                {med.days.length > 0 && (
                  <Text style={styles.medDetail}>Günler: {med.days.join(', ')}</Text>
                )}
                {med.times.length > 0 && (
                  <Text style={styles.medDetail}>Saatler: {med.times.join(', ')}</Text>
                )}
                {med.notes && (
                  <Text style={styles.medNotes}>{med.notes}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Health notes */}
        {health.health_notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color="#6B7280" />
              <Text style={styles.sectionTitle}>Notlar</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{health.health_notes}</Text>
            </View>
          </View>
        )}
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
    backgroundColor: '#FFFFFF',
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
    color: '#1F2937',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  childName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenChip: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  allergenChipText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  conditionChip: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  conditionChipText: {
    fontSize: 13,
    color: '#D97706',
    fontWeight: '600',
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 4,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  medName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  medDetail: {
    fontSize: 13,
    color: '#6B7280',
  },
  medNotes: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
});
