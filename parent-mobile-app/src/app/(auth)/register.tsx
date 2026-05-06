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
import { AppColors } from '@/constants/theme';
import { InputField } from '@/components/ui/InputField';
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
  score: number;
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

const BAR_COLORS = ['#EF4444', '#F59E0B', '#10B981', AppColors.primary];

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
            style={[strengthStyles.bar, { backgroundColor: n <= score ? activeColor : '#E5E7EB' }]}
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
            <Ionicons name="search-outline" size={16} color={AppColors.onSurfaceVariant} />
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
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '80%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: AppColors.surfaceContainer, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '800', color: AppColors.onSurface, paddingHorizontal: 20, marginBottom: 12 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: AppColors.onSurface, padding: 0 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: 12 },
  flag: { fontSize: 22, width: 30 },
  itemName: { flex: 1, fontSize: 14, color: AppColors.onSurface, fontWeight: '500' },
  itemCode: { fontSize: 14, color: AppColors.primary, fontWeight: '700' },
  separator: { height: 1, backgroundColor: AppColors.surfaceContainerLow, marginLeft: 62 },
  closeBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface },
});

// ─── Main screen ──────────────────────────────────────────

const DEFAULT_COUNTRY: Country = {
  id: 0,
  name: 'Türkiye',
  iso2: 'TR',
  phone_code: '90',
  flag_emoji: '🇹🇷',
};

const INPUT_PROPS = {
  placeholderTextColor: '#94918F',
  style: { color: '#000', fontWeight: '500' as const },
  inputRowStyle: { paddingVertical: 20, borderRadius: 50 },
} as const;

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
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get<{ data: Country[] }>('/parent/auth/countries');
        const list = res.data.data
          .filter((c) => !!c.phone_code)
          .map((c) => ({ ...c, phone_code: c.phone_code.replace(/^\+/, '') }));
        setCountries(list);
        const tr = list.find((c) => c.iso2 === 'TR');
        if (tr) { setSelectedCountry(tr); }
      } catch {
        // varsayılan TR kalır
      } finally {
        setCountriesLoading(false);
      }
    })();
  }, []);

  const updateField = (key: FormField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhoneChange = (value: string) => {
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
    if (!form.phone.trim() || form.phone.length < 7) {
      Alert.alert('Hata', 'Geçerli bir telefon numarası giriniz.');
      return;
    }

    const fullPhone = `+${selectedCountry.phone_code}${form.phone.trim()}`;

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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardShadow}>
            <View style={styles.card}>
              {/* Decorative blobs */}
              <View style={styles.blobTopRight} />
              <View style={styles.blobBottomLeft} />

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoBox}>
                  <Ionicons name="person-add" size={40} color={AppColors.primary} />
                </View>
                <Text style={styles.title}>Veli Hesap Oluştur</Text>
              </View>

              {/* Ad / Soyad */}
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.fieldLabel}>AD</Text>
                  <View style={styles.rawInputRow}>
                    <TextInput
                      style={styles.rawInput}
                      value={form.name}
                      onChangeText={(v) => updateField('name', v)}
                      placeholder="Adınız"
                      placeholderTextColor="#94918F"
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                <View style={styles.half}>
                  <Text style={styles.fieldLabel}>SOYAD</Text>
                  <View style={styles.rawInputRow}>
                    <TextInput
                      style={styles.rawInput}
                      value={form.surname}
                      onChangeText={(v) => updateField('surname', v)}
                      placeholder="Soyadınız"
                      placeholderTextColor="#94918F"
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>

              {/* E-posta */}
              <InputField
                label="E-posta Adresi"
                value={form.email}
                onChangeText={(v) => updateField('email', v)}
                placeholder="ornek@mail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                icon={<Ionicons name="mail-outline" size={18} color={AppColors.onSurfaceVariant} />}
                {...INPUT_PROPS}
              />

              {/* Telefon */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>TELEFON</Text>
                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={styles.countryBtn}
                    onPress={() => setPickerVisible(true)}
                    activeOpacity={0.7}
                    disabled={countriesLoading}
                  >
                    {countriesLoading ? (
                      <ActivityIndicator size="small" color={AppColors.primary} />
                    ) : (
                      <>
                        <Text style={styles.flagText}>{selectedCountry.flag_emoji}</Text>
                        <Text style={styles.codeText}>+{selectedCountry.phone_code}</Text>
                        <Ionicons name="chevron-down" size={13} color={AppColors.onSurfaceVariant} />
                      </>
                    )}
                  </TouchableOpacity>
                  <View style={[styles.rawInputRow, styles.phoneInput]}>
                    <TextInput
                      style={styles.rawInput}
                      value={form.phone}
                      onChangeText={handlePhoneChange}
                      placeholder="5xx xxx xx xx"
                      placeholderTextColor="#94918F"
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
              <InputField
                label="Şifre"
                value={form.password}
                onChangeText={(v) => updateField('password', v)}
                placeholder="En az 8 karakter"
                passwordToggle
                autoCapitalize="none"
                icon={<Ionicons name="lock-closed-outline" size={18} color={AppColors.onSurfaceVariant} />}
                {...INPUT_PROPS}
              />
              <PasswordStrengthBar password={form.password} />

              {/* Şifre tekrar */}
              <View style={styles.fieldWrap}>
                <InputField
                  label="Şifre Tekrar"
                  value={form.password_confirmation}
                  onChangeText={(v) => updateField('password_confirmation', v)}
                  placeholder="Şifrenizi tekrar girin"
                  passwordToggle
                  autoCapitalize="none"
                  icon={<Ionicons name="lock-closed-outline" size={18} color={AppColors.onSurfaceVariant} />}
                  inputRowStyle={{
                    paddingVertical: 20,
                    borderRadius: 50,
                    ...(form.password_confirmation.length > 0 && {
                      borderColor: form.password === form.password_confirmation ? '#10B981' : '#EF4444',
                    }),
                  }}
                  placeholderTextColor="#94918F"
                  style={{ color: '#000', fontWeight: '500' }}
                />
              </View>

              {/* Kayıt ol butonu */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={AppColors.white} />
                ) : (
                  <Text style={styles.buttonText}>Kayıt Ol</Text>
                )}
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Zaten hesabınız var mı?{' '}
                  <Link href="/(auth)/login" style={styles.footerLink}>
                    Giriş Yap
                  </Link>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.surfaceContainerLow,
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingVertical: 32,
  },
  cardShadow: {
    borderRadius: 32,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 32,
    padding: 32,
    overflow: 'hidden',
    gap: 14,
  },
  blobTopRight: {
    position: 'absolute',
    top: -48,
    right: -48,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: AppColors.primaryContainer,
    opacity: 0.35,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -56,
    left: -56,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: AppColors.tertiaryContainer,
    opacity: 0.2,
  },

  header: {
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 4,
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: AppColors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: AppColors.primary,
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Shared field label
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginLeft: 2,
    marginBottom: 6,
  },
  fieldWrap: {
    gap: 0,
  },

  // Name / Surname row
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
    gap: 6,
  },

  // Raw input (name, surname, phone) — mirrors InputField appearance
  rawInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.inputBackgroundGrey,
    borderWidth: 2,
    borderColor: AppColors.surfaceContainer,
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 10,
  },
  rawInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
    padding: 0,
  },

  // Phone
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.inputBackgroundGrey,
    borderWidth: 2,
    borderColor: AppColors.surfaceContainer,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 20,
    gap: 6,
  },
  flagText: { fontSize: 18 },
  codeText: { fontSize: 14, fontWeight: '700', color: AppColors.onSurface },
  phoneInput: { flex: 1 },
  phoneCount: { fontSize: 11, color: AppColors.onSurfaceVariant, fontWeight: '500' },

  button: {
    backgroundColor: AppColors.primary,
    borderRadius: 50,
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: AppColors.primaryDim,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: AppColors.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
  },
  footerText: {
    fontSize: 14,
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
  },
  footerLink: {
    color: AppColors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
});
