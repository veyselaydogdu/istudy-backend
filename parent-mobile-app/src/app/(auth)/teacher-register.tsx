import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import {
  getApiError,
  saveTeacherAuth,
  teacherRegisterRequest,
} from '../../lib/auth';

// ─── Types ────────────────────────────────────────────────

interface Country {
  id: number;
  name: string;
  iso2: string;
  phone_code: string;
  flag_emoji: string;
}

// ─── Country Picker Modal ─────────────────────────────────

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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
  separator: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 62 },
  closeBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
});

// ─── Password Strength ────────────────────────────────────

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
          <View key={n} style={[strengthStyles.bar, { backgroundColor: n <= score ? activeColor : '#E5E7EB' }]} />
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
      <Ionicons name={met ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={met ? '#10B981' : '#D1D5DB'} />
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

// ─── Default country ──────────────────────────────────────

const DEFAULT_COUNTRY: Country = {
  id: 0,
  name: 'Türkiye',
  iso2: 'TR',
  phone_code: '90',
  flag_emoji: '🇹🇷',
};

// ─── Main Screen ──────────────────────────────────────────

export default function TeacherRegisterScreen() {
  const { signInAsTeacher } = useAuth();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get<{ data: Country[] }>('/countries/phone-codes');
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

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const handleRegister = async () => {
    if (!name.trim() || !surname.trim()) {
      Alert.alert('Hata', 'Ad ve soyad zorunludur.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Hata', 'E-posta adresi zorunludur.');
      return;
    }
    if (!phone.trim() || phone.length < 7) {
      Alert.alert('Hata', 'Geçerli bir telefon numarası giriniz.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Hata', 'Şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    const fullPhone = `+${selectedCountry.phone_code}${phone.trim()}`;

    setLoading(true);
    try {
      const response = await teacherRegisterRequest({
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        phone: fullPhone,
      });
      await saveTeacherAuth(response.data.token, response.data.user);
      await signInAsTeacher(response.data.token, response.data.user);
      router.replace('/(teacher-app)');
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
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="school" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Öğretmen Kaydı</Text>
            <Text style={styles.subtitle}>Hesabınızı oluşturun</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Ad / Soyad */}
            <View style={styles.row}>
              <View style={[styles.inputWrap, styles.flex]}>
                <Text style={styles.label}>Ad *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Adınız"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputWrap, styles.flex]}>
                <Text style={styles.label}>Soyad *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Soyadınız"
                  placeholderTextColor="#9CA3AF"
                  value={surname}
                  onChangeText={setSurname}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* E-posta */}
            <View style={styles.inputWrap}>
              <Text style={styles.label}>E-posta *</Text>
              <TextInput
                style={styles.input}
                placeholder="ornek@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Telefon */}
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Telefon *</Text>
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
                <View style={styles.phoneInputWrap}>
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    value={phone}
                    onChangeText={handlePhoneChange}
                    placeholder="5xx xxx xx xx"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                  {phone.length > 0 && (
                    <Text style={styles.phoneCount}>{phone.length}/10</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Şifre */}
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Şifre *</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="En az 8 karakter"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Şifre Tekrar */}
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Şifre Tekrar *</Text>
              <TextInput
                style={styles.input}
                placeholder="Şifrenizi tekrar girin"
                placeholderTextColor="#9CA3AF"
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerBtnText}>Hesap Oluştur</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.replace('/(auth)/teacher-login')}
            >
              <Text style={styles.loginLinkText}>
                Zaten hesabınız var mı?{' '}
                <Text style={styles.loginLinkBold}>Giriş Yapın</Text>
              </Text>
            </TouchableOpacity>
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
  safeArea: { flex: 1, backgroundColor: '#F5F8FF' },
  flex: { flex: 1 },
  container: { paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { paddingTop: 8, paddingBottom: 4, alignSelf: 'flex-start' },
  header: { alignItems: 'center', paddingTop: 16, paddingBottom: 28 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#208AEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6B7280' },
  form: { gap: 0 },
  row: { flexDirection: 'row', gap: 12 },
  inputWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1F2937',
  },
  eyeBtn: { paddingHorizontal: 14 },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 6,
    minWidth: 100,
  },
  flagText: { fontSize: 18 },
  codeText: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  phoneInputWrap: { flex: 1, position: 'relative' },
  phoneInput: { paddingRight: 40 },
  phoneCount: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -8 }],
    fontSize: 11,
    color: '#9CA3AF',
  },
  registerBtn: {
    backgroundColor: '#208AEF',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  registerBtnDisabled: { opacity: 0.6 },
  registerBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { fontSize: 14, color: '#6B7280' },
  loginLinkBold: { color: '#208AEF', fontWeight: '700' },
});
