import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
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
import { AppColors } from '@/constants/theme';
import { getApiError, loginRequest } from '../../lib/auth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'E-posta ve şifre zorunludur.');
      return;
    }

    setLoading(true);
    try {
      const response = await loginRequest(email.trim(), password);
      await signIn(response.data.token, response.data.user);
      router.replace('/(app)');
    } catch (err: unknown) {
      Alert.alert('Giriş Başarısız', getApiError(err));
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
        {/* Green header banner */}
        <View style={styles.heroBanner}>
          <View style={styles.logoBox}>
            <Ionicons name="school" size={36} color={AppColors.primary} />
          </View>
          <Text style={styles.heroTitle}>iStudy</Text>
          <Text style={styles.heroSubtitle}>Eğitimin En Eğlenceli Hali!</Text>
        </View>

        {/* White card form */}
        <View style={styles.cardOuter}>
          <ScrollView
            contentContainerStyle={styles.cardScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.formTitle}>Giriş Yap</Text>
            <Text style={styles.formSubtitle}>Hesabınıza erişin</Text>

            <View style={styles.field}>
              <Text style={styles.label}>E-POSTA</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color={AppColors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ornek@mail.com"
                  placeholderTextColor={AppColors.surfaceContainer}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>ŞİFRE</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={AppColors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Şifrenizi girin"
                  placeholderTextColor={AppColors.surfaceContainer}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={AppColors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
              Şifremi Unuttum
            </Link>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={AppColors.white} />
              ) : (
                <Text style={styles.buttonText}>Giriş Yap</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={styles.outlineButton} activeOpacity={0.85}>
                <Text style={styles.outlineButtonText}>Hesap Oluştur</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/teacher-login')}
              style={styles.teacherLink}
              activeOpacity={0.7}
            >
              <Text style={styles.teacherLinkText}>Öğretmen Girişi →</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.primaryContainer,
  },
  flex: {
    flex: 1,
  },
  heroBanner: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 44,
    backgroundColor: AppColors.primaryContainer,
    gap: 8,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: AppColors.primaryDim,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    borderBottomWidth: 4,
    borderBottomColor: AppColors.primaryDim,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: AppColors.primary,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: AppColors.primaryDim,
    fontWeight: '600',
  },
  cardOuter: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  cardScroll: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: AppColors.onSurface,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: AppColors.onSurfaceVariant,
    marginBottom: 28,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.onSurfaceVariant,
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surfaceContainerLow,
    borderWidth: 2,
    borderColor: AppColors.surfaceContainer,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  inputIcon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: AppColors.onSurface,
    padding: 0,
  },
  forgotLink: {
    color: AppColors.primary,
    fontSize: 13,
    textAlign: 'right',
    fontWeight: '700',
    marginBottom: 24,
  },
  button: {
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: AppColors.primaryDim,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    borderBottomWidth: 4,
    borderBottomColor: AppColors.primaryDim,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: AppColors.surfaceContainer,
  },
  dividerText: {
    color: AppColors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.surfaceContainer,
    shadowColor: AppColors.surfaceContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
    borderBottomWidth: 4,
  },
  outlineButtonText: {
    color: AppColors.secondary,
    fontSize: 16,
    fontWeight: '800',
  },
  teacherLink: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },
  teacherLinkText: {
    color: AppColors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
