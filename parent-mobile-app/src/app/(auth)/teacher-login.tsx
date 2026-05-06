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

import { useAuth } from '../_layout';
import { AppColors } from '@/constants/theme';
import { InputField } from '@/components/ui/InputField';
import { getApiError, saveTeacherAuth, teacherLoginRequest } from '../../lib/auth';

export default function TeacherLoginScreen() {
  const { signInAsTeacher } = useAuth();
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
      const response = await teacherLoginRequest(email.trim(), password);
      await saveTeacherAuth(response.data.token, response.data.user);
      await signInAsTeacher(response.data.token, response.data.user);
      router.replace('/(teacher-app)');
    } catch (err: unknown) {
      Alert.alert('Giriş Başarısız', getApiError(err));
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
          {/* Card shadow wrapper */}
          <View style={styles.cardShadow}>
            <View style={styles.card}>
              {/* Decorative blobs */}
              <View style={styles.blobTopRight} />
              <View style={styles.blobBottomLeft} />

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoBox}>
                  <Ionicons name="person" size={40} color={AppColors.secondary} />
                </View>
                <Text style={styles.title}>Hoş Geldiniz!</Text>
                <Text style={styles.subtitle}>Öğretmen hesabınızla giriş yapın.</Text>
              </View>

              {/* Form */}
              <View style={styles.fields}>
                <InputField
                  label="E-posta Adresi"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ogretmen@ornek.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#94918F"
                  style={{
                      color: '#000',
                      fontWeight: '500'
                  }}
                  inputRowStyle={{
                      paddingVertical: 20,
                      borderRadius: 50,
                  }}
                  icon={<Ionicons name="mail-outline" size={18} color={AppColors.onSurfaceVariant} />}
                />

                <InputField
                  label="Şifre"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  passwordToggle
                  placeholderTextColor="#94918F"
                  style={{
                      color: '#000',
                      fontWeight: '500'
                  }}
                  inputRowStyle={{
                      paddingVertical: 20,
                      borderRadius: 50,
                  }}
                  icon={<Ionicons name="lock-closed-outline" size={18} color={AppColors.onSurfaceVariant} />}
                />
              </View>

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

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/teacher-register')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerText}>
                    Hesabınız yok mu?{' '}
                    <Text style={styles.footerLink}>Kayıt Olun</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(auth)/login')}
                  style={styles.parentLink}
                  activeOpacity={0.7}
                >
                  <Text style={styles.parentLinkText}>← Veli Girişi</Text>
                </TouchableOpacity>
              </View>
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
    shadowColor: AppColors.secondary,
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
    backgroundColor: AppColors.secondaryContainer,
    opacity: 0.6,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -56,
    left: -56,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: AppColors.infoContainer,
    opacity: 0.5,
  },

  header: {
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 32,
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: AppColors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: AppColors.secondary,
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

  fields: {
    gap: 14,
    marginBottom: 24,
  },

  button: {
    backgroundColor: AppColors.secondary,
    borderRadius: 50,
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: AppColors.secondaryDim,
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
    marginTop: 28,
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 14,
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
  },
  footerLink: {
    color: AppColors.secondary,
    fontWeight: '800',
  },
  parentLink: {
    paddingVertical: 6,
  },
  parentLinkText: {
    color: AppColors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
  },
});
