import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

export default function JoinSchoolScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      Alert.alert('Hata', 'Davet kodu veya token giriniz.');
      return;
    }

    setLoading(true);
    try {
      // Kodu UUID gibi görünüyorsa invite_token, değilse registration_code
      const isToken = code.includes('-') && code.length > 20;
      await api.post('/parent/schools/join', {
        ...(isToken
          ? { invite_token: code.trim() }
          : { registration_code: code.trim().toUpperCase() }),
      });
      Alert.alert(
        'Başarılı',
        'Okul kayıt talebiniz gönderildi. Okul yöneticisinin onaylaması bekleniyor.',
        [{ text: 'Tamam', onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
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
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Okula Katıl</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.container}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>🏫</Text>
          </View>

          <Text style={styles.title}>Okul Davet Kodu</Text>
          <Text style={styles.subtitle}>
            Okulunuzdan aldığınız davet kodunu veya davet linkindeki token'ı
            girin. Talebiniz okul yöneticisi tarafından onaylanacaktır.
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
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleJoin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Talep Gönder</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8FF' },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backText: { color: '#208AEF', fontSize: 15, fontWeight: '500', width: 60 },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
    gap: 20,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  inputBox: { width: '100%', gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 1,
    width: '100%',
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
