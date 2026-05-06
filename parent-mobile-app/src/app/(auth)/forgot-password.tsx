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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
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
      await api.post('/parent/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.cardShadow}>
            <View style={styles.card}>
              <View style={styles.blobTopRight} />
              <View style={styles.blobBottomLeft} />

              <View style={styles.header}>
                <View style={[styles.logoBox, { backgroundColor: AppColors.successContainer }]}>
                  <Ionicons name="mail" size={40} color={AppColors.success} />
                </View>
                <Text style={[styles.title, { color: AppColors.success }]}>E-posta Gönderildi</Text>
                <Text style={styles.subtitle}>
                  <Text style={{ fontWeight: '700', color: AppColors.onSurface }}>{email}</Text>
                  {' '}adresine şifre sıfırlama bağlantısı gönderildi. Lütfen e-postanızı kontrol edin.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: AppColors.success, borderBottomColor: AppColors.success }]}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Giriş Ekranına Dön</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
              <View style={styles.blobTopRight} />
              <View style={styles.blobBottomLeft} />

              {/* Back button */}
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={18} color={AppColors.secondary} />
                <Text style={styles.backText}>Geri</Text>
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoBox}>
                  <Ionicons name="lock-open" size={40} color={AppColors.primary} />
                </View>
                <Text style={styles.title}>Şifremi Unuttum</Text>
                <Text style={styles.subtitle}>
                  Kayıtlı e-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.
                </Text>
              </View>

              <View style={styles.fields}>
                <InputField
                  label="E-posta Adresi"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ornek@mail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#94918F"
                  style={{ color: '#000', fontWeight: '500' }}
                  inputRowStyle={{ paddingVertical: 20, borderRadius: 50 }}
                  icon={<Ionicons name="mail-outline" size={18} color={AppColors.onSurfaceVariant} />}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSend}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={AppColors.white} />
                ) : (
                  <Text style={styles.buttonText}>Bağlantı Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
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

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  backText: {
    color: AppColors.secondary,
    fontSize: 15,
    fontWeight: '700',
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 21,
  },

  fields: {
    marginBottom: 24,
  },

  button: {
    backgroundColor: AppColors.primary,
    borderRadius: 50,
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: AppColors.primaryDim,
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
});
