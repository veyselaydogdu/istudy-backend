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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../_layout';
import { AppColors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { getApiError, loginRequest } from '../../lib/auth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        {/* Hero banner — primary-container background */}
        <View style={styles.heroBanner}>
          <View style={styles.logoBox}>
            <Ionicons name="school" size={40} color={AppColors.primary} />
          </View>
          <Text style={styles.heroTitle}>iStudy</Text>
          <Text style={styles.heroSubtitle}>Eğitimin En Eğlenceli Hali!</Text>
          {/* Badge pill */}
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>YENİ!</Text>
          </View>
        </View>

        {/* White card form area */}
        <View style={styles.cardOuter}>
          <ScrollView
            contentContainerStyle={styles.cardScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.formTitle}>Giriş Yap</Text>
            <Text style={styles.formSubtitle}>Hesabınıza erişin</Text>

            <View style={styles.fields}>
              <InputField
                label="E-posta"
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@mail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                icon={<Ionicons name="mail-outline" size={18} color={AppColors.onSurfaceVariant} />}
              />

              <InputField
                label="Şifre"
                value={password}
                onChangeText={setPassword}
                placeholder="Şifrenizi girin"
                passwordToggle
                icon={<Ionicons name="lock-closed-outline" size={18} color={AppColors.onSurfaceVariant} />}
              />
            </View>

            <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
              Şifremi Unuttum
            </Link>

            <Button
              label="Giriş Yap"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleLogin}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/(auth)/register" asChild>
              <TouchableOpacity activeOpacity={0.85} style={styles.outlineButton}>
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
  flex: { flex: 1 },

  heroBanner: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 44,
    backgroundColor: AppColors.primaryContainer,
    gap: 6,
    position: 'relative',
  },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderBottomWidth: 4,
    borderBottomColor: AppColors.primaryDim,
    shadowColor: AppColors.primaryDim,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: AppColors.primary,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: AppColors.primaryDim,
    fontWeight: '700',
  },
  newBadge: {
    position: 'absolute',
    top: 24,
    right: 80,
    backgroundColor: AppColors.tertiaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    transform: [{ rotate: '-12deg' }],
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: AppColors.tertiary,
    letterSpacing: 0.5,
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
    fontSize: 26,
    fontWeight: '900',
    color: AppColors.onSurface,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: AppColors.onSurfaceVariant,
    marginBottom: 28,
    fontWeight: '500',
  },
  fields: {
    gap: 14,
    marginBottom: 16,
  },
  forgotLink: {
    color: AppColors.primary,
    fontSize: 13,
    textAlign: 'right',
    fontWeight: '700',
    marginBottom: 24,
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
    borderRadius: 1,
  },
  dividerText: {
    color: AppColors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '700',
  },
  outlineButton: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.surfaceContainer,
    borderBottomWidth: 5,
    borderBottomColor: AppColors.surfaceContainer,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  outlineButtonText: {
    color: AppColors.primary,
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
    fontWeight: '700',
  },
});
