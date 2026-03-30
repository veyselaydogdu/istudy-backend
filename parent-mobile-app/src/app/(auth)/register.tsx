import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

import { useAuth } from '../_layout';
import api from '../../lib/api';
import { getApiError, registerRequest } from '../../lib/auth';

// ─── Types ────────────────────────────────────────────────

interface Country {
  id: number;
  name: string;
  iso2: string;
  phone_code: string;
  flag_emoji: string;
}

type FormField = 'name' | 'surname' | 'email' | 'phone' | 'password' | 'password_confirmation';

interface FormState {
  name: string;
  surname: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

// ─── Password strength ────────────────────────────────────

interface PasswordStrength {
  score: number; // 0-4
  hasLength: boolean;
  hasUpper: boolean;
  hasSpecial: boolean;
  hasNumber: boolean;
}

function calcStrength(pwd: string): PasswordStrength {
  const hasLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const score = [hasLength, hasUpper, hasSpecial, hasNumber].filter(Boolean).length;
  return { score, hasLength, hasUpper, hasSpecial, hasNumber };
}

const BAR_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#208AEF'];

function PasswordStrengthBar({ password }: { password: string }) {
  const { score, hasLength, hasUpper, hasSpecial, hasNumber } = calcStrength(password);
  if (!password) { return null; }

  const label = ['Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü'][score];
  const activeColor = BAR_COLORS[Math.max(0, score - 1)] ?? '#E5E7EB';

  return (
    <View style={strengthStyles.wrap}>
      <View style={strengthStyles.bars}>
        {[1, 2, 3, 4].map((n) => (
          <View
            key={n}
            style={[
              strengthStyles.bar,
              { backgroundColor: n <= score ? activeColor : '#E5E7EB' },
            ]}
          />
        ))}
      </View>
      <Text style={[strengthStyles.label, { color: activeColor }]}>{label}</Text>
      <View style={strengthStyles.rules}>
        <RuleItem met={hasLength} text="En az 8 karakter" />
        <RuleItem met={hasUpper} text="En az 1 büyük harf" />
        <RuleItem met={hasSpecial} text="En az 1 özel karakter (!@#$...)" />
        <RuleItem met={hasNumber} text="En az 1 rakam" />
      </View>
    </View>
  );
}

function RuleItem({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={strengthStyles.ruleRow}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={13}
        color={met ? '#10B981' : '#D1D5DB'}
      />
      <Text style={[strengthStyles.ruleText, met && strengthStyles.ruleTextMet]}>{text}</Text>
    </View>
  );
}

const strengthStyles = StyleSheet.create({
  wrap: { marginTop: 10, gap: 6 },
  bars: { flexDirection: 'row', gap: 5 },
  bar: { flex: 1, height: 4, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
  rules: { gap: 4, marginTop: 2 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ruleText: { fontSize: 12, color: '#9CA3AF' },
  ruleTextMet: { color: '#10B981' },
});

// ─── Country picker modal ─────────────────────────────────

function CountryPickerModal({
  visible,
  countries,
  onSelect,
  onClose,
}: {
  visible: boolean;
  countries: Country[];
  onSelect: (c: Country) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone_code.includes(search),
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>Ülke Kodu Seç</Text>
          <View style={modalStyles.searchRow}>
            <Ionicons name="search-outline" size={16} color="#9CA3AF" />
            <TextInput
              style={modalStyles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Ülke ara..."
              placeholderTextColor="#C4C9D4"
              autoCorrect={false}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={modalStyles.item}
                onPress={() => { onSelect(item); onClose(); setSearch(''); }}
                activeOpacity={0.7}
              >
                <Text style={modalStyles.flag}>{item.flag_emoji}</Text>
                <Text style={modalStyles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={modalStyles.itemCode}>+{item.phone_code}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={modalStyles.separator} />}
          />
          <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
            <Text style={modalStyles.closeBtnText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '80%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '800', color: '#1F2937', paddingHorizontal: 20, marginBottom: 12 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937', padding: 0 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: 12 },
  flag: { fontSize: 22, width: 30 },
  itemName: { flex: 1, fontSize: 14, color: '#1F2937', fontWeight: '500' },
  itemCode: { fontSize: 14, color: '#208AEF', fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#F9FAFB', marginLeft: 62 },
  closeBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 15, fontWeight: '700', color: '#374151' },
});

// ─── Main screen ──────────────────────────────────────────

const DEFAULT_COUNTRY: Country = {
  id: 0,
  name: 'Türkiye',
  iso2: 'TR',
  phone_code: '90',
  flag_emoji: '🇹🇷',
};

export default function RegisterScreen() {
  const { signIn } = useAuth();

  const [form, setForm] = useState<FormState>({
    name: '',
    surname: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get<{ data: Country[] }>('/parent/auth/countries');
        // phone_code null olan ülkeleri filtrele, "90" formatına normalize et
        const list = res.data.data
          .filter((c) => !!c.phone_code)
          .map((c) => ({
            ...c,
            phone_code: c.phone_code.replace(/^\+/, ''),
          }));
        setCountries(list);
        // Türkiye varsa varsayılan olarak seç
        const tr = list.find((c) => c.iso2 === 'TR');
        if (tr) { setSelectedCountry(tr); }
      } catch {
        // Hata olursa varsayılan ülke (TR) kalır
      } finally {
        setCountriesLoading(false);
      }
    })();
  }, []);

  const updateField = (key: FormField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhoneChange = (value: string) => {
    // Sadece rakam, max 10 hane
    const digits = value.replace(/\D/g, '').slice(0, 10);
    updateField('phone', digits);
  };

  const handleRegister = async () => {
    if (!form.name.trim() || !form.surname.trim()) {
      Alert.alert('Hata', 'Ad ve soyad zorunludur.');
      return;
    }
    if (!form.email.trim()) {
      Alert.alert('Hata', 'E-posta adresi zorunludur.');
      return;
    }

    const strength = calcStrength(form.password);
    if (!strength.hasLength) {
      Alert.alert('Hata', 'Şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (!strength.hasUpper) {
      Alert.alert('Hata', 'Şifre en az 1 büyük harf içermelidir.');
      return;
    }
    if (!strength.hasSpecial) {
      Alert.alert('Hata', 'Şifre en az 1 özel karakter içermelidir (!@#$%...).');
      return;
    }
    if (form.password !== form.password_confirmation) {
      Alert.alert('Hata', 'Şifre tekrarı eşleşmiyor.');
      return;
    }

    const fullPhone = form.phone.trim()
      ? `+${selectedCountry.phone_code}${form.phone.trim()}`
      : undefined;

    setLoading(true);
    try {
      const response = await registerRequest({
        name: form.name.trim(),
        surname: form.surname.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        phone: fullPhone,
      });
      await signIn(response.data.token, response.data.user);
      router.replace('/(app)');
    } catch (err: unknown) {
      Alert.alert('Kayıt Başarısız', getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Blue header */}
        <View style={styles.heroBanner}>
          <View style={styles.logoCircle}>
            <Ionicons name="person-add" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>Hesap Oluştur</Text>
          <Text style={styles.heroSubtitle}>Veli hesabınızı kaydedin</Text>
        </View>

        {/* Form card */}
        <View style={styles.cardOuter}>
          <ScrollView
            contentContainerStyle={styles.cardScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Ad / Soyad */}
            <View style={styles.row}>
              <View style={[styles.field, styles.half]}>
                <Text style={styles.label}>Ad</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={form.name}
                    onChangeText={(v) => updateField('name', v)}
                    placeholder="Adınız"
                    placeholderTextColor="#C4C9D4"
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <View style={[styles.field, styles.half]}>
                <Text style={styles.label}>Soyad</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={form.surname}
                    onChangeText={(v) => updateField('surname', v)}
                    placeholder="Soyadınız"
                    placeholderTextColor="#C4C9D4"
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {/* E-posta */}
            <View style={styles.field}>
              <Text style={styles.label}>E-posta</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={17} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(v) => updateField('email', v)}
                  placeholder="ornek@mail.com"
                  placeholderTextColor="#C4C9D4"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Telefon + Ülke kodu */}
            <View style={styles.field}>
              <Text style={styles.label}>Telefon (İsteğe bağlı)</Text>
              <View style={styles.phoneRow}>
                <TouchableOpacity
                  style={styles.countryBtn}
                  onPress={() => setPickerVisible(true)}
                  activeOpacity={0.7}
                  disabled={countriesLoading}
                >
                  {countriesLoading ? (
                    <ActivityIndicator size="small" color="#208AEF" />
                  ) : (
                    <>
                      <Text style={styles.flagText}>{selectedCountry.flag_emoji}</Text>
                      <Text style={styles.codeText}>+{selectedCountry.phone_code}</Text>
                      <Ionicons name="chevron-down" size={13} color="#9CA3AF" />
                    </>
                  )}
                </TouchableOpacity>
                <View style={[styles.inputRow, styles.phoneInput]}>
                  <TextInput
                    style={styles.input}
                    value={form.phone}
                    onChangeText={handlePhoneChange}
                    placeholder="5xx xxx xx xx"
                    placeholderTextColor="#C4C9D4"
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                  {form.phone.length > 0 && (
                    <Text style={styles.phoneCount}>{form.phone.length}/10</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Şifre */}
            <View style={styles.field}>
              <Text style={styles.label}>Şifre</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={17} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form.password}
                  onChangeText={(v) => updateField('password', v)}
                  placeholder="En az 8 karakter"
                  placeholderTextColor="#C4C9D4"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={17}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              <PasswordStrengthBar password={form.password} />
            </View>

            {/* Şifre tekrar */}
            <View style={styles.field}>
              <Text style={styles.label}>Şifre Tekrar</Text>
              <View style={[
                styles.inputRow,
                form.password_confirmation.length > 0 && {
                  borderColor: form.password === form.password_confirmation ? '#10B981' : '#EF4444',
                },
              ]}>
                <Ionicons name="lock-closed-outline" size={17} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form.password_confirmation}
                  onChangeText={(v) => updateField('password_confirmation', v)}
                  placeholder="Şifrenizi tekrar girin"
                  placeholderTextColor="#C4C9D4"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                {form.password_confirmation.length > 0 && (
                  <Ionicons
                    name={form.password === form.password_confirmation ? 'checkmark-circle' : 'close-circle'}
                    size={17}
                    color={form.password === form.password_confirmation ? '#10B981' : '#EF4444'}
                  />
                )}
              </View>
            </View>

            {/* Kayıt ol butonu */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Kayıt Ol</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Zaten hesabınız var mı?</Text>
              <Link href="/(auth)/login" style={styles.footerLink}>{' '}Giriş Yap</Link>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Country picker modal */}
      <CountryPickerModal
        visible={pickerVisible}
        countries={countries}
        onSelect={setSelectedCountry}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#208AEF' },
  flex: { flex: 1 },
  heroBanner: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
    backgroundColor: '#208AEF',
    gap: 6,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  cardOuter: {
    flex: 1,
    backgroundColor: '#F5F8FF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  cardScroll: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 7 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 9,
  },
  inputIcon: { flexShrink: 0 },
  input: { flex: 1, fontSize: 14, color: '#1F2937', padding: 0 },

  // Phone
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
    minWidth: 88,
  },
  flagText: { fontSize: 18 },
  codeText: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  phoneInput: { flex: 1 },
  phoneCount: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  // Submit
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6B7280', fontSize: 14 },
  footerLink: { color: '#208AEF', fontSize: 14, fontWeight: '700' },
});
