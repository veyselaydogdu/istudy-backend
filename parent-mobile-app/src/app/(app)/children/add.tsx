import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

interface Country {
  id: number;
  name: string;
  name_tr: string | null;
  iso2: string;
  flag_emoji: string | null;
}

interface BloodType {
  id: number;
  name: string;
}

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return 'Tarih seçin';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return 'Tarih seçin';
  return `${d}.${m}.${y}`;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1999 }, (_, i) => 2000 + i).reverse();

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_TR: Record<string, string> = {
  monday: 'Pzt', tuesday: 'Sal', wednesday: 'Çar',
  thursday: 'Per', friday: 'Cum', saturday: 'Cmt', sunday: 'Paz',
};

// ─── Multi-Select Picker Modal ────────────────────────────

interface MultiSelectPickerModalProps {
  visible: boolean;
  title: string;
  items: Array<{ id: number; name: string }>;
  selectedIds: number[];
  customItems: string[];
  accentColor: string;
  onConfirm: (ids: number[]) => void;
  onCustomAdd: (name: string) => void;
  onCustomRemove: (idx: number) => void;
  onClose: () => void;
}

function MultiSelectPickerModal({
  visible, title, items, selectedIds, customItems,
  accentColor, onConfirm, onCustomAdd, onCustomRemove, onClose,
}: MultiSelectPickerModalProps) {
  const [search, setSearch] = useState('');
  const [tempSelected, setTempSelected] = useState<number[]>([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [addInputValue, setAddInputValue] = useState('');

  // Modal açılınca mevcut seçimleri al
  React.useEffect(() => {
    if (visible) {
      setTempSelected(selectedIds);
      setSearch('');
      setShowAddInput(false);
      setAddInputValue('');
    }
  }, [visible, selectedIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  const toggle = (id: number) => {
    setTempSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={msStyles.overlay}>
        <View style={msStyles.sheet}>
          <View style={msStyles.handle} />

          {/* Başlık */}
          <View style={msStyles.header}>
            <Text style={msStyles.title}>{title}</Text>
            <Text style={[msStyles.countBadge, { backgroundColor: accentColor + '20', color: accentColor }]}>
              {tempSelected.length + customItems.length} seçili
            </Text>
          </View>

          {/* Arama */}
          <View style={msStyles.searchRow}>
            <Ionicons name="search-outline" size={16} color="#9CA3AF" />
            <TextInput
              style={msStyles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Ara..."
              placeholderTextColor="#C4C9D4"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Liste */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            style={msStyles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const selected = tempSelected.includes(item.id);
              return (
                <TouchableOpacity style={msStyles.item} onPress={() => toggle(item.id)} activeOpacity={0.7}>
                  <View style={[msStyles.checkbox, selected && { backgroundColor: accentColor, borderColor: accentColor }]}>
                    {selected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                  </View>
                  <Text style={[msStyles.itemText, selected && { color: accentColor, fontWeight: '600' }]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={msStyles.emptyText}>
                {search.trim() ? 'Sonuç bulunamadı' : (items.length === 0 ? 'Kayıt bulunamadı' : 'Sonuç bulunamadı')}
              </Text>
            }
            ListFooterComponent={
              <View>
                {/* Özel eklenenler */}
                {customItems.map((name, idx) => (
                  <View key={`c-${idx}`} style={msStyles.customItem}>
                    <View style={[msStyles.checkbox, { backgroundColor: accentColor, borderColor: accentColor }]}>
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                    </View>
                    <Text style={[msStyles.itemText, { color: accentColor, fontWeight: '600', flex: 1 }]}>
                      {name}
                      <Text style={{ fontSize: 10, color: '#9CA3AF' }}> (onay bekleniyor)</Text>
                    </Text>
                    <TouchableOpacity onPress={() => onCustomRemove(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Özel ekle butonu / input */}
                {showAddInput ? (
                  <View style={msStyles.addInputRow}>
                    <TextInput
                      style={msStyles.addInput}
                      value={addInputValue}
                      onChangeText={setAddInputValue}
                      placeholder="Adı girin..."
                      placeholderTextColor="#9CA3AF"
                      autoFocus
                    />
                    <TouchableOpacity
                      style={[msStyles.addConfirmBtn, { backgroundColor: accentColor }]}
                      onPress={() => {
                        const name = addInputValue.trim();
                        if (name) { onCustomAdd(name); }
                        setAddInputValue('');
                        setShowAddInput(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={msStyles.addConfirmBtnText}>Ekle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setShowAddInput(false); setAddInputValue(''); }}>
                      <Ionicons name="close" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={msStyles.addCustomBtn} onPress={() => setShowAddInput(true)} activeOpacity={0.7}>
                    <Ionicons name="add-circle-outline" size={16} color="#D97706" />
                    <Text style={msStyles.addCustomBtnText}>Listede yok, özel ekle</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />

          {/* Onayla */}
          <View style={msStyles.footer}>
            <TouchableOpacity style={msStyles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={msStyles.cancelBtnText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[msStyles.confirmBtn, { backgroundColor: accentColor }]}
              onPress={() => { onConfirm(tempSelected); onClose(); }}
              activeOpacity={0.8}
            >
              <Text style={msStyles.confirmBtnText}>Onayla ({tempSelected.length + customItems.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const msStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '80%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  title: { fontSize: 17, fontWeight: '800', color: '#1F2937' },
  countBadge: { fontSize: 12, fontWeight: '700', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6',
    borderRadius: 12, marginHorizontal: 20, paddingHorizontal: 12, paddingVertical: 10,
    gap: 8, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937', padding: 0 },
  list: { flexGrow: 0 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: 12 },
  customItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 11, gap: 12, backgroundColor: '#FFFBEB' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
  },
  itemText: { flex: 1, fontSize: 14, color: '#374151' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 24 },
  addCustomBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  addCustomBtnText: { fontSize: 13, color: '#D97706', fontWeight: '600' },
  addInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  addInput: {
    flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#1F2937',
  },
  addConfirmBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  addConfirmBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cancelBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  confirmBtn: { flex: 2, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

export default function AddChildScreen() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: '',
    blood_type: '',
    identity_number: '',
    passport_number: '',
    parent_notes: '',
    special_notes: '',
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [bloodTypes, setBloodTypes] = useState<BloodType[]>([]);
  const [bloodTypesLoading, setBloodTypesLoading] = useState(false);

  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Country picker
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Blood type picker
  const [showBloodTypePicker, setShowBloodTypePicker] = useState(false);

  // Date picker modal
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(2018);
  const [pickerMonth, setPickerMonth] = useState(1);
  const [pickerDay, setPickerDay] = useState(1);

  const [loading, setLoading] = useState(false);

  // Health data
  const [allergens, setAllergens] = useState<Array<{id: number; name: string}>>([]);
  const [conditions, setConditions] = useState<Array<{id: number; name: string}>>([]);
  const [medications, setMedications] = useState<Array<{id: number; name: string}>>([]);
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<number[]>([]);
  const [selectedConditionIds, setSelectedConditionIds] = useState<number[]>([]);
  const [customAllergenNames, setCustomAllergenNames] = useState<string[]>([]);
  const [customConditionNames, setCustomConditionNames] = useState<string[]>([]);
  const [selectedMedications, setSelectedMedications] = useState<Array<{
    medication_id: number | null;
    custom_name: string;
    dose: string;
    usage_time: string[];
    usage_days: string[];
  }>>([]);
  const [showMedAddModal, setShowMedAddModal] = useState(false);
  const [medAddForm, setMedAddForm] = useState({ medication_id: null as number | null, custom_name: '', dose: '', usage_time: [] as string[], usage_days: [] as string[] });
  const [healthLoading, setHealthLoading] = useState(false);

  // Multi-select picker modals
  const [showAllergenPicker, setShowAllergenPicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  useEffect(() => {
    void fetchCountries();
    void fetchBloodTypes();
    void fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    setHealthLoading(true);
    try {
      const [allergenRes, conditionRes, medRes] = await Promise.all([
        api.get<{ data: Array<{id: number; name: string}> }>('/parent/allergens'),
        api.get<{ data: Array<{id: number; name: string}> }>('/parent/conditions'),
        api.get<{ data: Array<{id: number; name: string}> }>('/parent/medications'),
      ]);
      setAllergens(allergenRes.data.data);
      setConditions(conditionRes.data.data);
      setMedications(medRes.data.data);
    } catch {
      // sessizce geç
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await api.get<{ data: Country[] }>('/parent/countries');
      setCountries(response.data.data);
    } catch {
      // Ülkeler yüklenemezse sessizce geç
    }
  };

  const fetchBloodTypes = async () => {
    setBloodTypesLoading(true);
    try {
      const response = await api.get<{ data: BloodType[] }>('/parent/blood-types');
      setBloodTypes(response.data.data);
    } catch {
      // Kan grupları yüklenemezse sessizce geç
    } finally {
      setBloodTypesLoading(false);
    }
  };

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const commonLanguages = ['Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'Arapça'];

  const selectedCountry = countries.find((c) => c.id === selectedCountryId);
  const filteredCountries = countries.filter((c) =>
    (c.name_tr ?? c.name).toLowerCase().includes(countrySearch.toLowerCase())
  );

  const openDatePicker = () => {
    if (form.birth_date) {
      const parts = form.birth_date.split('-');
      if (parts.length === 3) {
        setPickerYear(parseInt(parts[0], 10));
        setPickerMonth(parseInt(parts[1], 10));
        setPickerDay(parseInt(parts[2], 10));
      }
    } else {
      setPickerYear(2018);
      setPickerMonth(1);
      setPickerDay(1);
    }
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    const maxDay = getDaysInMonth(pickerYear, pickerMonth);
    const safeDay = Math.min(pickerDay, maxDay);
    const mm = String(pickerMonth).padStart(2, '0');
    const dd = String(safeDay).padStart(2, '0');
    updateField('birth_date', `${pickerYear}-${mm}-${dd}`);
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      Alert.alert('Hata', 'Ad ve soyad zorunludur.');
      return;
    }
    if (!form.birth_date.trim()) {
      Alert.alert('Hata', 'Doğum tarihi zorunludur.');
      return;
    }
    if (selectedCountryId !== null && !form.identity_number.trim() && !form.passport_number.trim()) {
      Alert.alert('Hata', 'Uyruk seçildiyse TC kimlik numarası veya pasaport numarasından en az birini girmelisiniz.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ data: { id: number } }>('/parent/children', {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        birth_date: form.birth_date.trim(),
        gender: form.gender || undefined,
        blood_type: form.blood_type.trim() || undefined,
        identity_number: form.identity_number.trim() || undefined,
        passport_number: form.passport_number.trim() || undefined,
        nationality_country_id: selectedCountryId ?? undefined,
        languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
        parent_notes: form.parent_notes.trim() || undefined,
        special_notes: form.special_notes.trim() || undefined,
        allergen_ids: selectedAllergenIds.length > 0 ? selectedAllergenIds : undefined,
        condition_ids: selectedConditionIds.length > 0 ? selectedConditionIds : undefined,
        medications: selectedMedications.length > 0 ? selectedMedications : undefined,
      });

      const childId = res.data?.data?.id;
      if (childId) {
        // Özel alerjenler — suggest olarak gönder
        await Promise.allSettled(
          customAllergenNames.map((name) =>
            api.post(`/parent/children/${childId}/suggest-allergen`, { name })
          )
        );
        // Özel tıbbi durumlar — suggest olarak gönder
        await Promise.allSettled(
          customConditionNames.map((name) =>
            api.post(`/parent/children/${childId}/suggest-condition`, { name })
          )
        );
      }

      router.back();
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const maxDay = getDaysInMonth(pickerYear, pickerMonth);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Çocuk Ekle</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* TEMEL BİLGİLER */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>

            <View style={styles.row}>
              <View style={[styles.field, styles.half]}>
                <Text style={styles.label}>Ad *</Text>
                <TextInput
                  style={styles.input}
                  value={form.first_name}
                  onChangeText={(v) => updateField('first_name', v)}
                  placeholder="Ad"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.field, styles.half]}>
                <Text style={styles.label}>Soyad *</Text>
                <TextInput
                  style={styles.input}
                  value={form.last_name}
                  onChangeText={(v) => updateField('last_name', v)}
                  placeholder="Soyad"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* DOĞUM TARİHİ */}
            <View style={styles.field}>
              <Text style={styles.label}>Doğum Tarihi *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={openDatePicker}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerButtonText,
                    !form.birth_date && styles.placeholderText,
                  ]}
                >
                  {formatDateDisplay(form.birth_date)}
                </Text>
                <Text style={styles.pickerArrow}>📅</Text>
              </TouchableOpacity>
            </View>

            {/* CİNSİYET */}
            <View style={styles.field}>
              <Text style={styles.label}>Cinsiyet</Text>
              <View style={styles.genderRow}>
                {['male', 'female', 'other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderOption,
                      form.gender === g && styles.genderOptionActive,
                    ]}
                    onPress={() => updateField('gender', form.gender === g ? '' : g)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        form.gender === g && styles.genderTextActive,
                      ]}
                    >
                      {g === 'male' ? 'Erkek' : g === 'female' ? 'Kız' : 'Diğer'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* KAN GRUBU */}
            <View style={styles.field}>
              <Text style={styles.label}>Kan Grubu</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowBloodTypePicker(true)}
                activeOpacity={0.7}
              >
                {bloodTypesLoading ? (
                  <ActivityIndicator size="small" color="#208AEF" />
                ) : (
                  <Text
                    style={[
                      styles.pickerButtonText,
                      !form.blood_type && styles.placeholderText,
                    ]}
                  >
                    {form.blood_type || 'Kan grubu seçin'}
                  </Text>
                )}
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* UYRUK & DİLLER */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uyruk & Diller</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Uyruk</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCountryPicker(!showCountryPicker)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerButtonText,
                    !selectedCountry && styles.placeholderText,
                  ]}
                >
                  {selectedCountry
                    ? `${selectedCountry.flag_emoji ?? ''} ${selectedCountry.name_tr ?? selectedCountry.name}`
                    : 'Ülke seçin'}
                </Text>
                <Text style={styles.pickerArrow}>
                  {showCountryPicker ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {showCountryPicker && (
                <View style={styles.dropdown}>
                  <TextInput
                    style={styles.searchInput}
                    value={countrySearch}
                    onChangeText={setCountrySearch}
                    placeholder="Ülke ara..."
                    placeholderTextColor="#9CA3AF"
                  />
                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedCountryId(null);
                        setShowCountryPicker(false);
                        setCountrySearch('');
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Seçimi temizle</Text>
                    </TouchableOpacity>
                    {filteredCountries.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.dropdownItem,
                          selectedCountryId === c.id && styles.dropdownItemActive,
                        ]}
                        onPress={() => {
                          setSelectedCountryId(c.id);
                          setShowCountryPicker(false);
                          setCountrySearch('');
                          updateField('identity_number', '');
                          updateField('passport_number', '');
                        }}
                      >
                        <Text style={styles.dropdownItemText}>
                          {c.flag_emoji ?? ''} {c.name_tr ?? c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* KİMLİK ALANI — uyruk seçildikten sonra her ikisi de göster */}
            {selectedCountryId !== null && (
              <View style={{ gap: 10 }}>
                <Text style={styles.label}>Kimlik Bilgileri (en az biri zorunlu)</Text>
                <View style={styles.field}>
                  <Text style={[styles.label, { fontSize: 12, color: '#6B7280' }]}>TC Kimlik No</Text>
                  <TextInput
                    style={styles.input}
                    value={form.identity_number}
                    onChangeText={(v) => updateField('identity_number', v.replace(/\D/g, '').slice(0, 11))}
                    placeholder="11 haneli TC kimlik numarası"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    maxLength={11}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={[styles.label, { fontSize: 12, color: '#6B7280' }]}>Pasaport No</Text>
                  <TextInput
                    style={styles.input}
                    value={form.passport_number}
                    onChangeText={(v) => updateField('passport_number', v.toUpperCase())}
                    placeholder="Pasaport numarası"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: -4 }}>
                  * TC kimlik numarası veya pasaport numarasından en az birini girin
                </Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Bildiği Diller</Text>
              <View style={styles.languageRow}>
                {commonLanguages.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.langChip,
                      selectedLanguages.includes(lang) && styles.langChipActive,
                    ]}
                    onPress={() => toggleLanguage(lang)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.langChipText,
                        selectedLanguages.includes(lang) && styles.langChipTextActive,
                      ]}
                    >
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* SAĞLIK BİLGİLERİ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sağlık Bilgileri</Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: -8 }}>
              İsteğe bağlı — kayıt sonrası Sağlık Bilgileri ekranından da düzenleyebilirsiniz
            </Text>

            {healthLoading ? (
              <ActivityIndicator color="#208AEF" />
            ) : (
              <>
                {/* ALERJENLER */}
                <View style={styles.field}>
                  <Text style={styles.label}>🚨 Alerjenler</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowAllergenPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerButtonText, (selectedAllergenIds.length + customAllergenNames.length) === 0 && styles.placeholderText]}>
                      {(selectedAllergenIds.length + customAllergenNames.length) > 0
                        ? `${selectedAllergenIds.length + customAllergenNames.length} alerjen seçildi`
                        : 'Alerjen seçin...'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                  {(selectedAllergenIds.length + customAllergenNames.length) > 0 && (
                    <View style={styles.chipGrid}>
                      {selectedAllergenIds.map((id) => {
                        const item = allergens.find((a) => a.id === id);
                        return item ? (
                          <View key={id} style={[styles.healthChip, styles.healthChipActiveRed]}>
                            <Text style={[styles.healthChipText, styles.healthChipTextRed]}>{item.name}</Text>
                          </View>
                        ) : null;
                      })}
                      {customAllergenNames.map((name, idx) => (
                        <View key={`ca-${idx}`} style={[styles.healthChip, styles.healthChipActiveRed]}>
                          <Text style={[styles.healthChipText, styles.healthChipTextRed]}>{name} ⏳</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* HASTALIKLAR */}
                <View style={styles.field}>
                  <Text style={styles.label}>🏥 Tıbbi Durumlar</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowConditionPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerButtonText, (selectedConditionIds.length + customConditionNames.length) === 0 && styles.placeholderText]}>
                      {(selectedConditionIds.length + customConditionNames.length) > 0
                        ? `${selectedConditionIds.length + customConditionNames.length} tıbbi durum seçildi`
                        : 'Tıbbi durum seçin...'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                  {(selectedConditionIds.length + customConditionNames.length) > 0 && (
                    <View style={styles.chipGrid}>
                      {selectedConditionIds.map((id) => {
                        const item = conditions.find((c) => c.id === id);
                        return item ? (
                          <View key={id} style={[styles.healthChip, styles.healthChipActiveOrange]}>
                            <Text style={[styles.healthChipText, styles.healthChipTextOrange]}>{item.name}</Text>
                          </View>
                        ) : null;
                      })}
                      {customConditionNames.map((name, idx) => (
                        <View key={`cc-${idx}`} style={[styles.healthChip, styles.healthChipActiveOrange]}>
                          <Text style={[styles.healthChipText, styles.healthChipTextOrange]}>{name} ⏳</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* İLAÇLAR */}
                <View style={styles.field}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.label}>💊 İlaçlar</Text>
                    <TouchableOpacity
                      style={styles.addMedBtn}
                      onPress={() => {
                        setMedAddForm({ medication_id: null, custom_name: '', dose: '', usage_time: [], usage_days: [] });
                        setShowMedAddModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.addMedBtnText}>+ Ekle</Text>
                    </TouchableOpacity>
                  </View>
                  {selectedMedications.length === 0 ? (
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Henüz ilaç eklenmedi.</Text>
                  ) : (
                    selectedMedications.map((med, idx) => (
                      <View key={idx} style={styles.medItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.medName}>
                            {med.medication_id
                              ? (medications.find((m) => m.id === med.medication_id)?.name ?? 'İlaç')
                              : med.custom_name}
                          </Text>
                          {med.dose ? <Text style={styles.medDetail}>Doz: {med.dose}</Text> : null}
                        </View>
                        <TouchableOpacity
                          onPress={() => setSelectedMedications((prev) => prev.filter((_, i) => i !== idx))}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 16, color: '#EF4444', paddingLeft: 12 }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
          </View>

          {/* NOTLAR */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notlar</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Veli Notu</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.parent_notes}
                onChangeText={(v) => updateField('parent_notes', v)}
                placeholder="Özel durumlar, dikkat edilmesi gerekenler..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Özel Notlar</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.special_notes}
                onChangeText={(v) => updateField('special_notes', v)}
                placeholder="Okul için özel notlar..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Çocuğu Kaydet</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CUSTOM DATE PICKER MODAL */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateModalContent}>
            <Text style={styles.dateModalTitle}>Doğum Tarihi Seç</Text>

            <View style={styles.datePickerRow}>
              {/* YIL */}
              <View style={styles.dateColumn}>
                <Text style={styles.dateColumnLabel}>Yıl</Text>
                <ScrollView
                  style={styles.dateScrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {YEARS.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.dateScrollItem,
                        pickerYear === y && styles.dateScrollItemActive,
                      ]}
                      onPress={() => setPickerYear(y)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dateScrollItemText,
                          pickerYear === y && styles.dateScrollItemTextActive,
                        ]}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* AY */}
              <View style={styles.dateColumn}>
                <Text style={styles.dateColumnLabel}>Ay</Text>
                <ScrollView
                  style={styles.dateScrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {MONTHS.map((m, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dateScrollItem,
                        pickerMonth === idx + 1 && styles.dateScrollItemActive,
                      ]}
                      onPress={() => setPickerMonth(idx + 1)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dateScrollItemText,
                          pickerMonth === idx + 1 && styles.dateScrollItemTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* GÜN */}
              <View style={styles.dateColumn}>
                <Text style={styles.dateColumnLabel}>Gün</Text>
                <ScrollView
                  style={styles.dateScrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.dateScrollItem,
                        pickerDay === d && styles.dateScrollItemActive,
                      ]}
                      onPress={() => setPickerDay(d)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dateScrollItemText,
                          pickerDay === d && styles.dateScrollItemTextActive,
                        ]}
                      >
                        {String(d).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.datePreview}>
              <Text style={styles.datePreviewText}>
                Seçilen: {String(pickerDay).padStart(2, '0')}.{String(pickerMonth).padStart(2, '0')}.{pickerYear}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDatePicker(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={confirmDate}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>Tamam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* KAN GRUBU MODAL */}
      <Modal
        visible={showBloodTypePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBloodTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bloodTypeModalContent}>
            <Text style={styles.dateModalTitle}>Kan Grubu Seç</Text>

            {bloodTypesLoading ? (
              <ActivityIndicator size="large" color="#208AEF" style={{ marginVertical: 24 }} />
            ) : bloodTypes.length === 0 ? (
              <Text style={styles.emptyHint}>Kan grupları yüklenemedi.</Text>
            ) : (
              <View style={styles.bloodTypeGrid}>
                {bloodTypes.map((bt) => (
                  <TouchableOpacity
                    key={bt.id}
                    style={[
                      styles.bloodTypeOption,
                      form.blood_type === bt.name && styles.bloodTypeOptionActive,
                    ]}
                    onPress={() => {
                      updateField('blood_type', form.blood_type === bt.name ? '' : bt.name);
                      setShowBloodTypePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.bloodTypeOptionText,
                        form.blood_type === bt.name && styles.bloodTypeOptionTextActive,
                      ]}
                    >
                      {bt.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelBtnFull}
              onPress={() => setShowBloodTypePicker(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ALERJEN ÇOKLU SEÇİM */}
      <MultiSelectPickerModal
        visible={showAllergenPicker}
        title="Alerjen Seç"
        items={allergens}
        selectedIds={selectedAllergenIds}
        customItems={customAllergenNames}
        accentColor="#DC2626"
        onConfirm={setSelectedAllergenIds}
        onCustomAdd={(name) => setCustomAllergenNames((prev) => [...prev, name])}
        onCustomRemove={(idx) => setCustomAllergenNames((prev) => prev.filter((_, i) => i !== idx))}
        onClose={() => setShowAllergenPicker(false)}
      />

      {/* TIBBİ DURUM ÇOKLU SEÇİM */}
      <MultiSelectPickerModal
        visible={showConditionPicker}
        title="Tıbbi Durum Seç"
        items={conditions}
        selectedIds={selectedConditionIds}
        customItems={customConditionNames}
        accentColor="#D97706"
        onConfirm={setSelectedConditionIds}
        onCustomAdd={(name) => setCustomConditionNames((prev) => [...prev, name])}
        onCustomRemove={(idx) => setCustomConditionNames((prev) => prev.filter((_, i) => i !== idx))}
        onClose={() => setShowConditionPicker(false)}
      />

      {/* İLAÇ EKLEME MODAL */}
      <Modal
        visible={showMedAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMedAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.dateModalContent}>
              <Text style={styles.dateModalTitle}>İlaç Ekle</Text>

              {/* Listeden Seç */}
              <View style={styles.field}>
                <Text style={[styles.label, { fontSize: 12 }]}>Listeden Seç</Text>
                <ScrollView style={{ maxHeight: 120, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10 }} nestedScrollEnabled>
                  {medications.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
                        medAddForm.medication_id === m.id && { backgroundColor: '#EFF6FF' },
                      ]}
                      onPress={() => setMedAddForm((prev) => ({
                        ...prev,
                        medication_id: prev.medication_id === m.id ? null : m.id,
                        custom_name: '',
                      }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[{ fontSize: 14, color: '#374151' }, medAddForm.medication_id === m.id && { color: '#208AEF', fontWeight: '600' }]}>
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Özel İlaç Adı */}
              <View style={styles.field}>
                <Text style={[styles.label, { fontSize: 12 }]}>veya Özel İlaç Adı</Text>
                <TextInput
                  style={styles.input}
                  value={medAddForm.custom_name}
                  onChangeText={(v) => setMedAddForm((prev) => ({ ...prev, custom_name: v, medication_id: v ? null : prev.medication_id }))}
                  placeholder="Özel ilaç adı..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Doz */}
              <View style={styles.field}>
                <Text style={[styles.label, { fontSize: 12 }]}>Doz (örn: 5ml, 1 tablet)</Text>
                <TextInput
                  style={styles.input}
                  value={medAddForm.dose}
                  onChangeText={(v) => setMedAddForm((prev) => ({ ...prev, dose: v }))}
                  placeholder="5ml"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Günler */}
              <View style={styles.field}>
                <Text style={[styles.label, { fontSize: 12 }]}>Kullanım Günleri</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {DAYS.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
                        medAddForm.usage_days.includes(d) && { backgroundColor: '#208AEF', borderColor: '#208AEF' },
                      ]}
                      onPress={() => setMedAddForm((prev) => ({
                        ...prev,
                        usage_days: prev.usage_days.includes(d)
                          ? prev.usage_days.filter((x) => x !== d)
                          : [...prev.usage_days, d],
                      }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[{ fontSize: 12, color: '#6B7280', fontWeight: '500' }, medAddForm.usage_days.includes(d) && { color: '#FFFFFF', fontWeight: '700' }]}>
                        {DAY_TR[d]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowMedAddModal(false)} activeOpacity={0.7}>
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => {
                    if (!medAddForm.medication_id && !medAddForm.custom_name.trim()) {
                      Alert.alert('Hata', 'İlaç seçin veya özel ilaç adı girin.');
                      return;
                    }
                    setSelectedMedications((prev) => [...prev, { ...medAddForm }]);
                    setShowMedAddModal(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmBtnText}>Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  flex: {
    flex: 1,
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
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  textarea: {
    height: 80,
    paddingTop: 12,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  genderOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#208AEF',
  },
  genderText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  genderTextActive: {
    color: '#208AEF',
    fontWeight: '700',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    maxHeight: 220,
    overflow: 'hidden',
  },
  searchInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  dropdownList: {
    maxHeight: 170,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  langChipActive: {
    backgroundColor: '#208AEF',
    borderColor: '#208AEF',
  },
  langChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  langChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#208AEF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Date picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dateModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  dateModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dateColumnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateScrollView: {
    height: 180,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
  },
  dateScrollItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dateScrollItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dateScrollItemText: {
    fontSize: 14,
    color: '#374151',
  },
  dateScrollItemTextActive: {
    color: '#208AEF',
    fontWeight: '700',
  },
  datePreview: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
  },
  datePreviewText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#208AEF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnFull: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Blood type modal
  bloodTypeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bloodTypeOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    minWidth: 70,
    alignItems: 'center',
  },
  bloodTypeOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#208AEF',
  },
  bloodTypeOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  bloodTypeOptionTextActive: {
    color: '#208AEF',
  },
  emptyHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  healthChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  healthChipActiveRed: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  healthChipActiveOrange: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
  healthChipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  healthChipTextRed: { color: '#DC2626', fontWeight: '700' },
  healthChipTextOrange: { color: '#D97706', fontWeight: '700' },
  addMedBtn: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addMedBtnText: { color: '#208AEF', fontSize: 13, fontWeight: '600' },
  healthSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addSuggestBtn: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  addSuggestBtnText: { color: '#D97706', fontSize: 12, fontWeight: '700' },
  healthEmptyHint: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginTop: 2 },
  customModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    marginHorizontal: 24,
    gap: 4,
  },
  medItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  medName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  medDetail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
