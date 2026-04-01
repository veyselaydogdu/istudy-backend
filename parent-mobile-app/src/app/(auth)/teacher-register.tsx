import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

import { useAuth } from '../_layout';
import {
  getApiError,
  saveTeacherAuth,
  teacherRegisterRequest,
} from '../../lib/auth';

export default function TeacherRegisterScreen() {
  const { signInAsTeacher } = useAuth();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !surname.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Hata', 'Ad, soyad, e-posta ve şifre zorunludur.');
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Hata', 'Şifre en az 8 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      const response = await teacherRegisterRequest({
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        phone: phone.trim() || undefined,
        title: title.trim() || undefined,
        specialization: specialization.trim() || undefined,
        experience_years: experienceYears ? Number(experienceYears) : undefined,
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
            <Text style={styles.sectionLabel}>Kişisel Bilgiler</Text>

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

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Telefon</Text>
              <TextInput
                style={styles.input}
                placeholder="+90 5xx xxx xx xx"
                placeholderTextColor="#9CA3AF"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

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

            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Mesleki Bilgiler (Opsiyonel)</Text>

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Unvan</Text>
              <TextInput
                style={styles.input}
                placeholder="Ör: Matematik Öğretmeni"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Uzmanlık Alanı</Text>
              <TextInput
                style={styles.input}
                placeholder="Ör: İlkokul Matematiği"
                placeholderTextColor="#9CA3AF"
                value={specialization}
                onChangeText={setSpecialization}
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Deneyim (Yıl)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                value={experienceYears}
                onChangeText={setExperienceYears}
                keyboardType="number-pad"
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
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
