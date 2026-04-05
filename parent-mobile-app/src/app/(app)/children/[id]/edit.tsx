import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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

export default function EditChildScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: '',
    blood_type: '',
    identity_number: '',
    parent_notes: '',
    special_notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchChild();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChild = async () => {
    try {
      const response = await api.get<{
        data: {
          first_name: string;
          last_name: string;
          birth_date: string | null;
          gender: string | null;
          blood_type: string | null;
          identity_number: string | null;
          parent_notes: string | null;
          special_notes: string | null;
        };
      }>(`/parent/children/${id}`);
      const c = response.data.data;
      setForm({
        first_name: c.first_name,
        last_name: c.last_name,
        birth_date: c.birth_date ?? '',
        gender: c.gender ?? '',
        blood_type: c.blood_type ?? '',
        identity_number: c.identity_number ?? '',
        parent_notes: c.parent_notes ?? '',
        special_notes: c.special_notes ?? '',
      });
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      Alert.alert('Hata', 'Ad ve soyad zorunludur.');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/parent/children/${id}`, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        birth_date: form.birth_date.trim() || undefined,
        gender: form.gender || undefined,
        blood_type: form.blood_type.trim() || undefined,
        identity_number: form.identity_number.trim() || undefined,
        parent_notes: form.parent_notes.trim() || undefined,
        special_notes: form.special_notes.trim() || undefined,
      });
      router.back();
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSaving(false);
    }
  };

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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Çocuğu Düzenle</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
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

            <View style={styles.field}>
              <Text style={styles.label}>Doğum Tarihi (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.birth_date}
                onChangeText={(v) => updateField('birth_date', v)}
                placeholder="2020-05-15"
                placeholderTextColor="#9CA3AF"
              />
            </View>

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

            <View style={styles.row}>
              <View style={[styles.field, styles.half]}>
                <Text style={styles.label}>Kan Grubu</Text>
                <TextInput
                  style={styles.input}
                  value={form.blood_type}
                  onChangeText={(v) => updateField('blood_type', v)}
                  placeholder="A+"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                />
              </View>
              <View style={[styles.field, styles.half]}>
                <Text style={styles.label}>TC Kimlik No</Text>
                <TextInput
                  style={styles.input}
                  value={form.identity_number}
                  onChangeText={(v) => updateField('identity_number', v)}
                  placeholder="12345678901"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

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
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  flex: { flex: 1 },
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
  container: { paddingHorizontal: 20, paddingVertical: 16, gap: 20 },
  section: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.onSurface },
  input: {
    backgroundColor: AppColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: AppColors.onSurface,
  },
  textarea: { height: 80, paddingTop: 12 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
    alignItems: 'center',
    backgroundColor: AppColors.surfaceContainerLow,
  },
  genderOptionActive: { backgroundColor: AppColors.primaryContainer, borderColor: AppColors.primary },
  genderText: { fontSize: 13, color: AppColors.onSurfaceVariant, fontWeight: '500' },
  genderTextActive: { color: AppColors.primary, fontWeight: '700' },
  saveButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: AppColors.white, fontSize: 16, fontWeight: '700' },
});
