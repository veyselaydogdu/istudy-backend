import { router } from 'expo-router';
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
import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

type Child = {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
};

type SchoolPreview = {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  logo: string | null;
};

export default function JoinSchoolScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState('');
  const [school, setSchool] = useState<SchoolPreview | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (step === 2) {
      loadEnrollableChildren();
    }
  }, [step]);

  const loadEnrollableChildren = async () => {
    setChildrenLoading(true);
    try {
      const res = await api.get('/parent/children/enrollable');
      setChildren(res.data?.data ?? []);
    } catch {
      // ignore — empty list shown
    } finally {
      setChildrenLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!code.trim()) {
      Alert.alert('Hata', 'Davet kodu veya token giriniz.');
      return;
    }

    setSearchLoading(true);
    try {
      const isToken = code.includes('-') && code.length > 20;

      // UUID-like token → use invite info endpoint, else use search
      if (isToken) {
        const res = await api.get(`/invite/${code.trim()}`);
        setSchool(res.data?.data ?? null);
      } else {
        const res = await api.post('/schools/search', {
          registration_code: code.trim().toUpperCase(),
        });
        setSchool(res.data?.data ?? null);
      }

      setStep(2);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedChildId) {
      Alert.alert('Hata', 'Lütfen bir çocuk seçiniz.');
      return;
    }

    setSubmitLoading(true);
    try {
      const isToken = code.includes('-') && code.length > 20;
      await api.post('/parent/schools/join', {
        ...(isToken
          ? { invite_token: code.trim() }
          : { registration_code: code.trim().toUpperCase() }),
        child_id: selectedChildId,
      });
      Alert.alert(
        'Başarılı',
        'Okul kayıt talebiniz gönderildi. Okul yöneticisinin onaylaması bekleniyor.',
        [{ text: 'Tamam', onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => (step === 2 ? setStep(1) : router.back())}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Okula Katıl</Text>
          <View style={{ width: 60 }} />
        </View>

        {step === 1 ? (
          <View style={styles.container}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>🏫</Text>
            </View>

            <Text style={styles.title}>Okul Davet Kodu</Text>
            <Text style={styles.subtitle}>
              Okulunuzdan aldığınız davet kodunu veya davet linkindeki token'ı
              girin.
            </Text>

            <View style={styles.inputBox}>
              <Text style={styles.label}>Davet Kodu / Token</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="OKUL123 veya uuid-token"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, searchLoading && styles.buttonDisabled]}
              onPress={handleSearch}
              disabled={searchLoading}
              activeOpacity={0.8}
            >
              {searchLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Okulu Bul</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* School info */}
            <View style={styles.schoolCard}>
              <Text style={styles.schoolCardLabel}>Okul</Text>
              <Text style={styles.schoolName}>{school?.name}</Text>
              {school?.address ? (
                <Text style={styles.schoolAddress}>{school.address}</Text>
              ) : null}
            </View>

            {/* Child selection */}
            <Text style={styles.sectionTitle}>Hangi çocuğunuzu kaydetmek istiyorsunuz?</Text>

            {childrenLoading ? (
              <ActivityIndicator color={AppColors.primary} style={{ marginTop: 20 }} />
            ) : children.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  Kayıt edilebilecek çocuk bulunamadı.{'\n'}
                  Tüm çocuklarınız zaten bir okula kayıtlı veya bekleyen talebi var.
                </Text>
              </View>
            ) : (
              <View style={styles.childList}>
                {children.map((child) => {
                  const isSelected = selectedChildId === child.id;
                  return (
                    <TouchableOpacity
                      key={child.id}
                      style={[styles.childItem, isSelected && styles.childItemSelected]}
                      onPress={() => setSelectedChildId(child.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.childAvatar, isSelected && styles.childAvatarSelected]}>
                        <Text style={styles.childAvatarText}>
                          {child.first_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.childInfo}>
                        <Text style={[styles.childName, isSelected && styles.childNameSelected]}>
                          {child.full_name}
                        </Text>
                        {child.birth_date ? (
                          <Text style={styles.childDetail}>
                            {new Date(child.birth_date).toLocaleDateString('tr-TR')}
                          </Text>
                        ) : null}
                      </View>
                      {isSelected && (
                        <View style={styles.checkMark}>
                          <Text style={styles.checkMarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonMarginTop,
                (submitLoading || !selectedChildId || children.length === 0) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitLoading || !selectedChildId || children.length === 0}
              activeOpacity={0.8}
            >
              {submitLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Talep Gönder</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  flex: { flex: 1 },
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
    gap: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: '700', color: AppColors.onSurface, textAlign: 'center' },
  subtitle: { fontSize: 14, color: AppColors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  inputBox: { width: '100%', gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: AppColors.onSurface },
  input: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: AppColors.onSurface,
    textAlign: 'center',
    letterSpacing: 1,
    width: '100%',
  },
  button: {
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  buttonMarginTop: { marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: AppColors.white, fontSize: 16, fontWeight: '700' },
  schoolCard: {
    backgroundColor: AppColors.primaryContainer,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  schoolCardLabel: { fontSize: 12, color: AppColors.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  schoolName: { fontSize: 18, fontWeight: '700', color: AppColors.onSurface },
  schoolAddress: { fontSize: 13, color: AppColors.onSurfaceVariant },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: AppColors.onSurface, marginTop: 4 },
  emptyBox: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: AppColors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  childList: { gap: 10 },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  childItemSelected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primaryContainer,
  },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarSelected: { backgroundColor: AppColors.primary },
  childAvatarText: { fontSize: 18, fontWeight: '700', color: AppColors.white },
  childInfo: { flex: 1 },
  childName: { fontSize: 15, fontWeight: '600', color: AppColors.onSurface },
  childNameSelected: { color: AppColors.primary },
  childDetail: { fontSize: 13, color: AppColors.onSurfaceVariant, marginTop: 2 },
  checkMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkText: { color: AppColors.white, fontSize: 15, fontWeight: '700' },
});
