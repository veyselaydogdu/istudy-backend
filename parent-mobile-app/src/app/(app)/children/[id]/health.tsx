import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import api from '../../../../lib/api';
import { getApiError } from '../../../../lib/auth';

interface HealthItem {
  id: number;
  name: string;
  status?: string;
}

interface Medication {
  id: number;
  name: string;
}

interface ChildMedication {
  id: number;
  name: string;
  dose: string | null;
  usage_time: string[] | null;
  usage_days: string[] | null;
  status?: string;
}

type SuggestModalType = 'allergen' | 'condition' | 'medication' | null;

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_TR: Record<string, string> = {
  monday: 'Pzt',
  tuesday: 'Sal',
  wednesday: 'Çar',
  thursday: 'Per',
  friday: 'Cum',
  saturday: 'Cmt',
  sunday: 'Paz',
};

function PendingBadge() {
  return (
    <View style={styles.pendingBadge}>
      <Text style={styles.pendingBadgeText}>Onay Bekleniyor</Text>
    </View>
  );
}

export default function HealthScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [allergens, setAllergens] = useState<HealthItem[]>([]);
  const [conditions, setConditions] = useState<HealthItem[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);

  const [childAllergenIds, setChildAllergenIds] = useState<number[]>([]);
  const [childConditionIds, setChildConditionIds] = useState<number[]>([]);
  const [childPendingAllergens, setChildPendingAllergens] = useState<HealthItem[]>([]);
  const [childPendingConditions, setChildPendingConditions] = useState<HealthItem[]>([]);
  const [childMedications, setChildMedications] = useState<ChildMedication[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // İlaç ekleme modal (listten seçme)
  const [showMedModal, setShowMedModal] = useState(false);
  const [medForm, setMedForm] = useState({
    medication_id: null as number | null,
    dose: '',
    usage_time: '',
    usage_days: '',
  });

  // Öneri (suggest) modal
  const [suggestModalType, setSuggestModalType] = useState<SuggestModalType>(null);
  const [suggestName, setSuggestName] = useState('');
  const [suggestDose, setSuggestDose] = useState('');
  const [suggestUsageTime, setSuggestUsageTime] = useState('');
  const [suggestUsageDays, setSuggestUsageDays] = useState<string[]>([]);
  const [suggestSaving, setSuggestSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allergenRes, conditionRes, medRes, childRes] = await Promise.all([
        api.get<{ data: HealthItem[] }>('/parent/allergens'),
        api.get<{ data: HealthItem[] }>('/parent/conditions'),
        api.get<{ data: Medication[] }>('/parent/medications'),
        api.get<{
          data: {
            allergens: HealthItem[];
            conditions: HealthItem[];
            medications: ChildMedication[];
          };
        }>(`/parent/children/${id}`),
      ]);

      setAllergens(allergenRes.data.data);
      setConditions(conditionRes.data.data);
      setMedications(medRes.data.data);

      const childAllergens = childRes.data.data.allergens ?? [];
      const childConditions = childRes.data.data.conditions ?? [];

      setChildAllergenIds(
        childAllergens.filter((a) => !a.status || a.status === 'approved').map((a) => a.id)
      );
      setChildPendingAllergens(
        childAllergens.filter((a) => a.status === 'pending')
      );

      setChildConditionIds(
        childConditions.filter((c) => !c.status || c.status === 'approved').map((c) => c.id)
      );
      setChildPendingConditions(
        childConditions.filter((c) => c.status === 'pending')
      );

      setChildMedications(childRes.data.data.medications ?? []);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const toggleAllergen = (itemId: number) => {
    setChildAllergenIds((prev) =>
      prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]
    );
  };

  const toggleCondition = (itemId: number) => {
    setChildConditionIds((prev) =>
      prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]
    );
  };

  const handleSaveAllergens = async () => {
    setSaving(true);
    try {
      await api.post(`/parent/children/${id}/allergens`, {
        allergen_ids: childAllergenIds,
      });
      Alert.alert('Başarılı', 'Alerjenler güncellendi.');
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConditions = async () => {
    setSaving(true);
    try {
      await api.post(`/parent/children/${id}/conditions`, {
        condition_ids: childConditionIds,
      });
      Alert.alert('Başarılı', 'Tıbbi durumlar güncellendi.');
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddMedication = async () => {
    if (!medForm.medication_id) {
      Alert.alert('Hata', 'Listeden bir ilaç seçin.');
      return;
    }

    const usageTimes = medForm.usage_time
      ? medForm.usage_time.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    const usageDays = medForm.usage_days
      ? medForm.usage_days.split(',').map((d) => d.trim()).filter(Boolean)
      : [];

    const currentMeds = childMedications
      .filter((m) => !m.status || m.status === 'approved')
      .map((m) => ({
        medication_id: m.id,
        dose: m.dose ?? undefined,
        usage_time: m.usage_time ?? [],
        usage_days: m.usage_days ?? [],
      }));

    const newMed = {
      medication_id: medForm.medication_id,
      dose: medForm.dose.trim() || undefined,
      usage_time: usageTimes,
      usage_days: usageDays,
    };

    setSaving(true);
    try {
      await api.post(`/parent/children/${id}/medications`, {
        medications: [...currentMeds, newMed],
      });
      setShowMedModal(false);
      setMedForm({ medication_id: null, dose: '', usage_time: '', usage_days: '' });
      void fetchData();
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMedication = async (medId: number) => {
    const remaining = childMedications
      .filter((m) => m.id !== medId && (!m.status || m.status === 'approved'))
      .map((m) => ({
        medication_id: m.id,
        dose: m.dose ?? undefined,
        usage_time: m.usage_time ?? [],
        usage_days: m.usage_days ?? [],
      }));

    setSaving(true);
    try {
      await api.post(`/parent/children/${id}/medications`, {
        medications: remaining,
      });
      void fetchData();
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const openSuggestModal = (type: SuggestModalType) => {
    setSuggestModalType(type);
    setSuggestName('');
    setSuggestDose('');
    setSuggestUsageTime('');
    setSuggestUsageDays([]);
  };

  const closeSuggestModal = () => {
    setSuggestModalType(null);
    setSuggestName('');
    setSuggestDose('');
    setSuggestUsageTime('');
    setSuggestUsageDays([]);
  };

  const toggleSuggestDay = (day: string) => {
    setSuggestUsageDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSuggest = async () => {
    if (!suggestName.trim()) {
      Alert.alert('Hata', 'Lütfen bir ad girin.');
      return;
    }

    setSuggestSaving(true);
    try {
      if (suggestModalType === 'allergen') {
        await api.post(`/parent/children/${id}/suggest-allergen`, {
          name: suggestName.trim(),
        });
        Alert.alert('Gönderildi', 'Alerjen öneriniz onay için gönderildi.');
      } else if (suggestModalType === 'condition') {
        await api.post(`/parent/children/${id}/suggest-condition`, {
          name: suggestName.trim(),
        });
        Alert.alert('Gönderildi', 'Tıbbi durum öneriniz onay için gönderildi.');
      } else if (suggestModalType === 'medication') {
        await api.post(`/parent/children/${id}/suggest-medication`, {
          name: suggestName.trim(),
          dose: suggestDose.trim() || undefined,
          usage_time: suggestUsageTime
            ? suggestUsageTime.split(',').map((t) => t.trim()).filter(Boolean)
            : [],
          usage_days: suggestUsageDays,
        });
        Alert.alert('Gönderildi', 'İlaç öneriniz onay için gönderildi.');
      }
      closeSuggestModal();
      void fetchData();
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSuggestSaving(false);
    }
  };

  const approvedMedications = childMedications.filter(
    (m) => !m.status || m.status === 'approved'
  );
  const pendingMedications = childMedications.filter((m) => m.status === 'pending');

  const suggestModalTitle =
    suggestModalType === 'allergen'
      ? 'Özel Alerjen Ekle'
      : suggestModalType === 'condition'
        ? 'Özel Tıbbi Durum Ekle'
        : 'Özel İlaç Ekle';

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
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Sağlık Bilgileri</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* ALERJENLER */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Alerjenler</Text>
            <TouchableOpacity
              style={styles.addSuggestBtn}
              onPress={() => openSuggestModal('allergen')}
              activeOpacity={0.7}
            >
              <Text style={styles.addSuggestBtnText}>+ Özel Ekle</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chipGrid}>
            {allergens.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.chip,
                  childAllergenIds.includes(item.id) && styles.chipActiveRed,
                ]}
                onPress={() => toggleAllergen(item.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    childAllergenIds.includes(item.id) && styles.chipTextActiveRed,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {childPendingAllergens.length > 0 && (
            <View style={styles.pendingSection}>
              <Text style={styles.pendingSectionTitle}>Onay Bekleyenler</Text>
              <View style={styles.pendingList}>
                {childPendingAllergens.map((item) => (
                  <View key={item.id} style={styles.pendingItem}>
                    <Text style={styles.pendingItemName}>{item.name}</Text>
                    <PendingBadge />
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveAllergens}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Alerjenları Kaydet</Text>
          </TouchableOpacity>
        </View>

        {/* TIBBİ DURUMLAR */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Tıbbi Durumlar</Text>
            <TouchableOpacity
              style={styles.addSuggestBtn}
              onPress={() => openSuggestModal('condition')}
              activeOpacity={0.7}
            >
              <Text style={styles.addSuggestBtnText}>+ Özel Ekle</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chipGrid}>
            {conditions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.chip,
                  childConditionIds.includes(item.id) && styles.chipActiveOrange,
                ]}
                onPress={() => toggleCondition(item.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    childConditionIds.includes(item.id) && styles.chipTextActiveOrange,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {childPendingConditions.length > 0 && (
            <View style={styles.pendingSection}>
              <Text style={styles.pendingSectionTitle}>Onay Bekleyenler</Text>
              <View style={styles.pendingList}>
                {childPendingConditions.map((item) => (
                  <View key={item.id} style={styles.pendingItem}>
                    <Text style={styles.pendingItemName}>{item.name}</Text>
                    <PendingBadge />
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveConditions}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Durumları Kaydet</Text>
          </TouchableOpacity>
        </View>

        {/* İLAÇLAR */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>İlaçlar</Text>
            <View style={styles.medBtnGroup}>
              <TouchableOpacity
                style={styles.addSuggestBtn}
                onPress={() => openSuggestModal('medication')}
                activeOpacity={0.7}
              >
                <Text style={styles.addSuggestBtnText}>+ Özel Ekle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addMedBtn}
                onPress={() => setShowMedModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.addMedBtnText}>+ Listeden Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>

          {approvedMedications.length === 0 && pendingMedications.length === 0 ? (
            <Text style={styles.emptyText}>Henüz ilaç eklenmedi.</Text>
          ) : null}

          {approvedMedications.map((med) => (
            <View key={med.id} style={styles.medItem}>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                {med.dose && (
                  <Text style={styles.medDetail}>Doz: {med.dose}</Text>
                )}
                {med.usage_time && med.usage_time.length > 0 && (
                  <Text style={styles.medDetail}>
                    Saatler: {med.usage_time.join(', ')}
                  </Text>
                )}
                {med.usage_days && med.usage_days.length > 0 && (
                  <Text style={styles.medDetail}>
                    Günler: {med.usage_days.map((d) => DAY_TR[d] ?? d).join(', ')}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveMedication(med.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {pendingMedications.length > 0 && (
            <View style={styles.pendingSection}>
              <Text style={styles.pendingSectionTitle}>Onay Bekleyenler</Text>
              {pendingMedications.map((med) => (
                <View key={med.id} style={styles.medItemPending}>
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>{med.name}</Text>
                    {med.dose && (
                      <Text style={styles.medDetail}>Doz: {med.dose}</Text>
                    )}
                  </View>
                  <PendingBadge />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* LİSTEDEN İLAÇ EKLEME MODALI */}
      <Modal
        visible={showMedModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Listeden İlaç Ekle</Text>

            <View style={styles.field}>
              <Text style={styles.label}>İlaç Seç</Text>
              <ScrollView style={styles.medList} nestedScrollEnabled>
                {medications.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.medOption,
                      medForm.medication_id === m.id && styles.medOptionActive,
                    ]}
                    onPress={() =>
                      setMedForm((prev) => ({
                        ...prev,
                        medication_id: prev.medication_id === m.id ? null : m.id,
                      }))
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.medOptionText,
                        medForm.medication_id === m.id && styles.medOptionTextActive,
                      ]}
                    >
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Doz (örn: 5ml, 1 tablet)</Text>
              <TextInput
                style={styles.input}
                value={medForm.dose}
                onChangeText={(v) => setMedForm((prev) => ({ ...prev, dose: v }))}
                placeholder="5ml"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Kullanım Saatleri (virgülle ayırın)</Text>
              <TextInput
                style={styles.input}
                value={medForm.usage_time}
                onChangeText={(v) => setMedForm((prev) => ({ ...prev, usage_time: v }))}
                placeholder="08:00, 20:00"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Kullanım Günleri</Text>
              <View style={styles.daysRow}>
                {DAYS.map((d) => {
                  const selected = medForm.usage_days.includes(d);
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dayChip, selected && styles.dayChipActive]}
                      onPress={() => {
                        const current = medForm.usage_days
                          ? medForm.usage_days.split(',').map((x) => x.trim()).filter(Boolean)
                          : [];
                        const updated = current.includes(d)
                          ? current.filter((x) => x !== d)
                          : [...current, d];
                        setMedForm((prev) => ({ ...prev, usage_days: updated.join(',') }));
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dayChipText, selected && styles.dayChipTextActive]}>
                        {DAY_TR[d]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowMedModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, saving && styles.saveBtnDisabled]}
                onPress={handleAddMedication}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Ekle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ÖNERI (SUGGEST) MODALI */}
      <Modal
        visible={suggestModalType !== null}
        transparent
        animationType="slide"
        onRequestClose={closeSuggestModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{suggestModalTitle}</Text>
            <Text style={styles.suggestHint}>
              Öneriniz okul yöneticisi tarafından onaylandıktan sonra aktif olacaktır.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>
                {suggestModalType === 'medication' ? 'İlaç Adı' : 'Ad'} *
              </Text>
              <TextInput
                style={styles.input}
                value={suggestName}
                onChangeText={setSuggestName}
                placeholder={
                  suggestModalType === 'allergen'
                    ? 'Alerjen adı...'
                    : suggestModalType === 'condition'
                      ? 'Tıbbi durum adı...'
                      : 'İlaç adı...'
                }
                placeholderTextColor="#9CA3AF"
                autoCapitalize="sentences"
              />
            </View>

            {suggestModalType === 'medication' && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Doz (isteğe bağlı)</Text>
                  <TextInput
                    style={styles.input}
                    value={suggestDose}
                    onChangeText={setSuggestDose}
                    placeholder="5ml, 1 tablet..."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Kullanım Saatleri (virgülle ayırın)</Text>
                  <TextInput
                    style={styles.input}
                    value={suggestUsageTime}
                    onChangeText={setSuggestUsageTime}
                    placeholder="08:00, 20:00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Kullanım Günleri</Text>
                  <View style={styles.daysRow}>
                    {DAYS.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.dayChip,
                          suggestUsageDays.includes(d) && styles.dayChipActive,
                        ]}
                        onPress={() => toggleSuggestDay(d)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            suggestUsageDays.includes(d) && styles.dayChipTextActive,
                          ]}
                        >
                          {DAY_TR[d]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={closeSuggestModal}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, suggestSaving && styles.saveBtnDisabled]}
                onPress={handleSuggest}
                disabled={suggestSaving}
                activeOpacity={0.8}
              >
                {suggestSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
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
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainerLow,
  },
  backText: { color: AppColors.primary, fontSize: 15, fontWeight: '500', width: 60 },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: AppColors.onSurface },
  container: { paddingHorizontal: 20, paddingVertical: 16, gap: 16, paddingBottom: 32 },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: AppColors.onSurface },
  medBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  addSuggestBtn: {
    backgroundColor: AppColors.warningContainer,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: AppColors.warningContainer,
  },
  addSuggestBtnText: { color: AppColors.errorContainer, fontSize: 12, fontWeight: '600' },
  addMedBtn: {
    backgroundColor: AppColors.primaryContainer,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addMedBtnText: { color: AppColors.primary, fontSize: 12, fontWeight: '600' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
    backgroundColor: AppColors.surfaceContainerLow,
  },
  chipActiveRed: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  chipActiveOrange: { backgroundColor: AppColors.warningContainer, borderColor: AppColors.tertiaryContainer },
  chipText: { fontSize: 13, color: AppColors.onSurfaceVariant, fontWeight: '500' },
  chipTextActiveRed: { color: AppColors.error, fontWeight: '700' },
  chipTextActiveOrange: { color: AppColors.warning, fontWeight: '700' },
  pendingSection: {
    backgroundColor: AppColors.warningContainer,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
  },
  pendingSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pendingList: { gap: 4 },
  pendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  pendingItemName: { fontSize: 13, color: AppColors.onSurface, flex: 1 },
  pendingBadge: {
    backgroundColor: AppColors.warningContainer,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: AppColors.tertiaryContainer,
  },
  pendingBadgeText: { fontSize: 11, color: AppColors.warning, fontWeight: '700' },
  saveBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: AppColors.white, fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 13, color: AppColors.onSurfaceVariant, textAlign: 'center', paddingVertical: 8 },
  medItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainerLow,
  },
  medItemPending: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  medInfo: { flex: 1 },
  medName: { fontSize: 14, fontWeight: '600', color: AppColors.onSurface },
  medDetail: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 2 },
  removeBtn: { fontSize: 16, color: AppColors.error, paddingLeft: 12 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: AppColors.onSurface },
  suggestHint: { fontSize: 13, color: AppColors.onSurfaceVariant, lineHeight: 18 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.onSurface },
  input: {
    backgroundColor: AppColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: AppColors.onSurface,
  },
  medList: { maxHeight: 130, borderWidth: 1, borderColor: AppColors.surfaceContainer, borderRadius: 10 },
  medOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainerLow,
  },
  medOptionActive: { backgroundColor: AppColors.primaryContainer },
  medOptionText: { fontSize: 14, color: AppColors.onSurface },
  medOptionTextActive: { color: AppColors.primary, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
    backgroundColor: AppColors.surfaceContainerLow,
  },
  dayChipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  dayChipText: { fontSize: 12, color: AppColors.onSurfaceVariant, fontWeight: '500' },
  dayChipTextActive: { color: AppColors.white, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, paddingTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { color: AppColors.onSurfaceVariant, fontSize: 15, fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
});
