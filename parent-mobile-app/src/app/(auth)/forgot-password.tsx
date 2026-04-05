import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InputField } from '@/components/ui/InputField';
import api from '../../lib/api';
import { getApiError } from '../../lib/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'E-posta adresi zorunludur.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/parent/auth/forgot-password', {
        email: email.trim(),
      });
      setSent(true);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <Ionicons name="mail" size={44} color={AppColors.primary} />
          </View>
          <Text style={styles.successTitle}>E-posta Gönderildi</Text>
          <Text style={styles.successText}>
            {email} adresine şifre sıfırlama bağlantısı gönderildi. Lütfen e-postanızı kontrol edin.
          </Text>
          <Button
            label="Giriş Ekranına Dön"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Hero banner */}
        <View style={styles.heroBanner}>
          <View style={styles.logoBox}>
            <Ionicons name="lock-open" size={32} color={AppColors.primary} />
          </View>
          <Text style={styles.heroTitle}>Şifremi Unuttum</Text>
          <Text style={styles.heroSubtitle}>Şifre sıfırlama bağlantısı gönderelim</Text>
        </View>

        {/* Form card */}
        <View style={styles.cardOuter}>
          <View style={styles.cardScroll}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={18} color={AppColors.secondary} />
              <Text style={styles.backText}>Geri</Text>
            </TouchableOpacity>

            <Text style={styles.formTitle}>E-posta Adresiniz</Text>
            <Text style={styles.formSubtitle}>
              Kayıtlı e-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.
            </Text>

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
            </View>

            <Button
              label="Bağlantı Gönder"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleSend}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.primaryContainer },
  flex: { flex: 1 },

  heroBanner: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 44,
    backgroundColor: AppColors.primaryContainer,
    gap: 6,
  },
  logoBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
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
  heroTitle: { fontSize: 26, fontWeight: '900', color: AppColors.primary, letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 13, color: AppColors.primaryDim, fontWeight: '600' },

  cardOuter: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  cardScroll: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  backText: { color: AppColors.secondary, fontSize: 15, fontWeight: '700' },

  formTitle: { fontSize: 22, fontWeight: '900', color: AppColors.onSurface, marginBottom: 6 },
  formSubtitle: { fontSize: 14, color: AppColors.onSurfaceVariant, lineHeight: 20, marginBottom: 24, fontWeight: '500' },
  fields: { marginBottom: 24 },

  // Success
  successContainer: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 24, fontWeight: '900', color: AppColors.onSurface },
  successText: { fontSize: 14, color: AppColors.onSurfaceVariant, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
});
