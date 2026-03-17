import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
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

// ─── Types ────────────────────────────────────────────────

interface Country {
  id: number;
  name: string;
  name_tr?: string | null;
  iso2: string;
  phone_code?: string | null;
  flag_emoji?: string | null;
}

interface EmergencyContact {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  phone_country_code: string | null;
  relationship: string;
  identity_number: string | null;
  passport_number: string | null;
  nationality_country_id: number | null;
  nationality?: Country | null;
  sort_order: number;
}

interface ContactForm {
  first_name: string;
  last_name: string;
  phone: string;
  relationship: string;
  identity_number: string;
  passport_number: string;
}

const DEFAULT_PHONE_COUNTRY: Country = {
  id: 0,
  name: 'Türkiye',
  iso2: 'TR',
  phone_code: '90',
  flag_emoji: '🇹🇷',
};

const emptyForm: ContactForm = {
  first_name: '',
  last_name: '',
  phone: '',
  relationship: '',
  identity_number: '',
  passport_number: '',
};

// ─── Ana Ekran ────────────────────────────────────────────

export default function EmergencyContactsScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tüm ülkeler
  const [countries, setCountries] = useState<Country[]>([]);
  const [phoneCountries, setPhoneCountries] = useState<Country[]>([]);

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Telefon ülke kodu — inline picker
  const [phoneCountry, setPhoneCountry] = useState<Country>(DEFAULT_PHONE_COUNTRY);
  const [showPhonePicker, setShowPhonePicker] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState('');

  // Uyruk — inline picker
  const [selectedNationality, setSelectedNationality] = useState<Country | null>(null);
  const [showNationalityPicker, setShowNationalityPicker] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState('');

  // Filtrelenmiş listeler
  const filteredPhoneCountries = phoneCountries.filter(
    (c) =>
      (c.name_tr ?? c.name).toLowerCase().includes(phoneSearch.toLowerCase()) ||
      (c.phone_code ?? '').includes(phoneSearch),
  );

  const filteredNationalityCountries = countries.filter((c) =>
    (c.name_tr ?? c.name).toLowerCase().includes(nationalitySearch.toLowerCase()),
  );

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get<{ data: Country[] }>('/parent/countries');
        const all: Country[] = res.data.data ?? [];
        setCountries(all);
        const phones = all
          .filter((c) => !!c.phone_code)
          .map((c) => ({ ...c, phone_code: String(c.phone_code).replace(/^\+/, '') }));
        setPhoneCountries(phones);
        const tr = phones.find((c) => c.iso2 === 'TR');
        if (tr) { setPhoneCountry(tr); }
      } catch {
        // varsayılan TR kalır
      }
    })();
  }, []);

  const fetchContacts = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await api.get<{ data: EmergencyContact[] }>(
        '/parent/family/emergency-contacts',
      );
      setContacts(response.data.data);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchContacts();
  }, [fetchContacts]);

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchContacts(true);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedNationality(null);
    setShowPhonePicker(false);
    setShowNationalityPicker(false);
    setPhoneSearch('');
    setNationalitySearch('');
    const tr = phoneCountries.find((c) => c.iso2 === 'TR');
    setPhoneCountry(tr ?? DEFAULT_PHONE_COUNTRY);
  };

  const openAdd = () => {
    setEditingId(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (contact: EmergencyContact) => {
    setEditingId(contact.id);
    setForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      phone: contact.phone.replace(/^\+\d+/, ''), // ülke kodunu çıkar
      relationship: contact.relationship,
      identity_number: contact.identity_number ?? '',
      passport_number: contact.passport_number ?? '',
    });

    // Telefon ülkesi
    if (contact.phone_country_code) {
      const normalized = String(contact.phone_country_code).replace(/^\+/, '');
      const found = phoneCountries.find((c) => c.phone_code === normalized);
      setPhoneCountry(found ?? DEFAULT_PHONE_COUNTRY);
    } else {
      const tr = phoneCountries.find((c) => c.iso2 === 'TR');
      setPhoneCountry(tr ?? DEFAULT_PHONE_COUNTRY);
    }

    // Uyruk
    if (contact.nationality) {
      setSelectedNationality(contact.nationality);
    } else if (contact.nationality_country_id) {
      const found = countries.find((c) => c.id === contact.nationality_country_id);
      setSelectedNationality(found ?? null);
    } else {
      setSelectedNationality(null);
    }

    setShowPhonePicker(false);
    setShowNationalityPicker(false);
    setPhoneSearch('');
    setNationalitySearch('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      Alert.alert('Hata', 'Ad ve soyad zorunludur.');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert('Hata', 'Telefon numarası zorunludur.');
      return;
    }
    if (!form.relationship.trim()) {
      Alert.alert('Hata', 'İlişki türü zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const fullPhone = `+${phoneCountry.phone_code}${form.phone.trim()}`;
      const payload: Record<string, unknown> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: fullPhone,
        phone_country_code: phoneCountry.phone_code,
        relationship: form.relationship.trim(),
        nationality_country_id: selectedNationality?.id ?? null,
        identity_number: form.identity_number.trim() || null,
        passport_number: form.passport_number.trim() || null,
      };

      if (editingId) {
        await api.put(`/parent/family/emergency-contacts/${editingId}`, payload);
      } else {
        await api.post('/parent/family/emergency-contacts', payload);
      }

      setShowModal(false);
      void fetchContacts(true);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (contact: EmergencyContact) => {
    Alert.alert(
      'Acil Kişiyi Sil',
      `${contact.first_name} ${contact.last_name} kişisini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/parent/family/emergency-contacts/${contact.id}`);
              void fetchContacts(true);
            } catch (err: unknown) {
              Alert.alert('Hata', getApiError(err));
            }
          },
        },
      ],
    );
  };

  const updateField = (key: keyof ContactForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Acil Kişiler</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Ekle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIconBox}>
              <Text style={styles.cardIcon}>🚨</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.contactName}>{item.first_name} {item.last_name}</Text>
              <Text style={styles.contactRelation}>{item.relationship}</Text>
              <Text style={styles.contactPhone}>📞 {item.phone}</Text>
              {item.nationality && (
                <Text style={styles.contactNationality}>
                  {item.nationality.flag_emoji ?? ''} {item.nationality.name_tr ?? item.nationality.name}
                </Text>
              )}
            </View>
            <View style={styles.rowActions}>
              <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.7} style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} activeOpacity={0.7} style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#208AEF" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚨</Text>
            <Text style={styles.emptyTitle}>Acil kişi eklenmedi</Text>
            <Text style={styles.emptyText}>
              Olası acil durumlarda ulaşılacak kişileri ekleyin.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openAdd} activeOpacity={0.8}>
              <Text style={styles.emptyButtonText}>İlk Kişiyi Ekle</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Form Modal — inline picker'lar modalın içinde */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {/* Başlık */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingId ? 'Kişiyi Düzenle' : 'Acil Kişi Ekle'}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Ad / Soyad */}
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

              {/* Telefon — inline ülke kodu seçici */}
              <View style={styles.field}>
                <Text style={styles.label}>Telefon *</Text>
                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={styles.phoneCodeBtn}
                    onPress={() => {
                      setShowPhonePicker((v) => !v);
                      setShowNationalityPicker(false);
                      setPhoneSearch('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.phoneFlag}>{phoneCountry.flag_emoji ?? '🏳️'}</Text>
                    <Text style={styles.phoneCode}>+{phoneCountry.phone_code}</Text>
                    <Ionicons
                      name={showPhonePicker ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    value={form.phone}
                    onChangeText={(v) => updateField('phone', v.replace(/\D/g, '').slice(0, 12))}
                    placeholder="5xx xxx xx xx"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    onFocus={() => {
                      setShowPhonePicker(false);
                      setShowNationalityPicker(false);
                    }}
                  />
                </View>

                {/* Telefon ülke dropdown */}
                {showPhonePicker && (
                  <View style={styles.dropdown}>
                    <View style={styles.dropdownSearchRow}>
                      <Ionicons name="search-outline" size={14} color="#9CA3AF" />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        value={phoneSearch}
                        onChangeText={setPhoneSearch}
                        placeholder="Ülke veya kod ara..."
                        placeholderTextColor="#9CA3AF"
                        autoCorrect={false}
                      />
                      {phoneSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setPhoneSearch('')}>
                          <Ionicons name="close-circle" size={15} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {filteredPhoneCountries.map((c) => (
                        <TouchableOpacity
                          key={c.iso2}
                          style={[
                            styles.dropdownItem,
                            phoneCountry.iso2 === c.iso2 && styles.dropdownItemActive,
                          ]}
                          onPress={() => {
                            setPhoneCountry(c);
                            setShowPhonePicker(false);
                            setPhoneSearch('');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dropdownFlag}>{c.flag_emoji ?? '🏳️'}</Text>
                          <Text style={styles.dropdownItemText} numberOfLines={1}>
                            {c.name_tr ?? c.name}
                          </Text>
                          <Text style={styles.dropdownItemCode}>+{c.phone_code}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* İlişki Türü */}
              <View style={styles.field}>
                <Text style={styles.label}>İlişki Türü *</Text>
                <TextInput
                  style={styles.input}
                  value={form.relationship}
                  onChangeText={(v) => updateField('relationship', v)}
                  placeholder="Anne, Baba, Büyükanne, Amca..."
                  placeholderTextColor="#9CA3AF"
                  onFocus={() => {
                    setShowPhonePicker(false);
                    setShowNationalityPicker(false);
                  }}
                />
              </View>

              {/* Uyruk — inline seçici */}
              <View style={styles.field}>
                <Text style={styles.label}>Uyruk (İsteğe bağlı)</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => {
                    setShowNationalityPicker((v) => !v);
                    setShowPhonePicker(false);
                    setNationalitySearch('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.pickerBtnText,
                    selectedNationality && styles.pickerBtnTextSelected,
                  ]}>
                    {selectedNationality
                      ? `${selectedNationality.flag_emoji ?? ''} ${selectedNationality.name_tr ?? selectedNationality.name}`
                      : 'Ülke seçin (opsiyonel)'}
                  </Text>
                  <Ionicons
                    name={showNationalityPicker ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>

                {/* Uyruk dropdown */}
                {showNationalityPicker && (
                  <View style={styles.dropdown}>
                    <View style={styles.dropdownSearchRow}>
                      <Ionicons name="search-outline" size={14} color="#9CA3AF" />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        value={nationalitySearch}
                        onChangeText={setNationalitySearch}
                        placeholder="Ülke ara..."
                        placeholderTextColor="#9CA3AF"
                        autoCorrect={false}
                      />
                      {nationalitySearch.length > 0 && (
                        <TouchableOpacity onPress={() => setNationalitySearch('')}>
                          <Ionicons name="close-circle" size={15} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {/* Temizle seçeneği */}
                      {selectedNationality && (
                        <TouchableOpacity
                          style={styles.dropdownItemClear}
                          onPress={() => {
                            setSelectedNationality(null);
                            updateField('identity_number', '');
                            updateField('passport_number', '');
                            setShowNationalityPicker(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle-outline" size={16} color="#9CA3AF" />
                          <Text style={styles.dropdownItemClearText}>Seçimi temizle</Text>
                        </TouchableOpacity>
                      )}
                      {filteredNationalityCountries.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.dropdownItem,
                            selectedNationality?.id === c.id && styles.dropdownItemActive,
                          ]}
                          onPress={() => {
                            setSelectedNationality(c);
                            setShowNationalityPicker(false);
                            setNationalitySearch('');
                            updateField('identity_number', '');
                            updateField('passport_number', '');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dropdownFlag}>{c.flag_emoji ?? '🏳️'}</Text>
                          <Text style={styles.dropdownItemText} numberOfLines={1}>
                            {c.name_tr ?? c.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Kimlik / Pasaport — uyruk seçilince göster, tamamen opsiyonel */}
              {selectedNationality && (
                <View style={styles.idSection}>
                  <Text style={styles.idSectionTitle}>🪪 Kimlik Bilgileri (İsteğe bağlı)</Text>
                  <View style={styles.field}>
                    <Text style={styles.label}>TC Kimlik No</Text>
                    <TextInput
                      style={styles.input}
                      value={form.identity_number}
                      onChangeText={(v) => updateField('identity_number', v.replace(/\D/g, '').slice(0, 11))}
                      placeholder="11 haneli TC kimlik numarası"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      maxLength={11}
                      onFocus={() => {
                        setShowPhonePicker(false);
                        setShowNationalityPicker(false);
                      }}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Pasaport No</Text>
                    <TextInput
                      style={styles.input}
                      value={form.passport_number}
                      onChangeText={(v) => updateField('passport_number', v.toUpperCase())}
                      placeholder="Pasaport numarası"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      onFocus={() => {
                        setShowPhonePicker(false);
                        setShowNationalityPicker(false);
                      }}
                    />
                  </View>
                  <Text style={styles.idHint}>* Her iki alan da boş bırakılabilir</Text>
                </View>
              )}

              {/* Butonlar */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, saving && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Kaydet</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  backText: { color: '#208AEF', fontSize: 15, fontWeight: '500', width: 60 },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  addBtn: { backgroundColor: '#208AEF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: { fontSize: 20 },
  info: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  contactRelation: { fontSize: 12, color: '#208AEF', fontWeight: '500', marginTop: 2 },
  contactPhone: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  contactNationality: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { padding: 6 },
  iconBtnText: { fontSize: 16 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  emptyButton: { backgroundColor: '#208AEF', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  modalContent: {
    padding: 24,
    gap: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1F2937',
  },
  // Telefon
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  phoneCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  phoneFlag: { fontSize: 18 },
  phoneCode: { fontSize: 13, color: '#1F2937', fontWeight: '600' },
  phoneInput: { flex: 1 },
  // Uyruk seçici butonu
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  pickerBtnText: { fontSize: 14, color: '#9CA3AF', flex: 1 },
  pickerBtnTextSelected: { color: '#1F2937' },
  // Dropdown
  dropdown: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  dropdownSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    margin: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  dropdownSearchInput: { flex: 1, fontSize: 14, color: '#1F2937', padding: 0 },
  dropdownList: { maxHeight: 200 },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  dropdownItemActive: { backgroundColor: '#EFF6FF' },
  dropdownItemClear: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    backgroundColor: '#FFF5F5',
  },
  dropdownItemClearText: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  dropdownFlag: { fontSize: 18, width: 26 },
  dropdownItemText: { flex: 1, fontSize: 14, color: '#1F2937', fontWeight: '500' },
  dropdownItemCode: { fontSize: 13, color: '#208AEF', fontWeight: '700' },
  // Kimlik bölümü
  idSection: {
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  idSectionTitle: { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },
  idHint: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' },
  // Butonlar
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
