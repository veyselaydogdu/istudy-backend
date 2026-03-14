import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../_layout';
import { getApiError, logoutRequest } from '../../lib/auth';

interface InfoRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={17} color="#208AEF" />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logoutRequest();
            } catch (err: unknown) {
              void getApiError(err);
            } finally {
              await signOut();
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const initials = user
    ? `${(user.name ?? '?').charAt(0)}${(user.surname ?? '?').charAt(0)}`.toUpperCase()
    : '??';

  const fullName = user ? `${user.name ?? ''} ${user.surname ?? ''}`.trim() : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile hero card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
          {user?.email_verified_at ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#059669" />
              <Text style={styles.verifiedText}>E-posta Doğrulandı</Text>
            </View>
          ) : (
            <View style={styles.unverifiedBadge}>
              <Ionicons name="warning-outline" size={13} color="#D97706" />
              <Text style={styles.unverifiedText}>E-posta Doğrulanmamış</Text>
            </View>
          )}
        </View>

        {/* Contact info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
          <InfoRow icon="person-outline" label="Ad Soyad" value={fullName} />
          <InfoRow icon="mail-outline" label="E-posta" value={user?.email ?? ''} />
          {user?.phone && (
            <InfoRow icon="call-outline" label="Telefon" value={user.phone} />
          )}
        </View>

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uygulama</Text>
          <InfoRow icon="phone-portrait-outline" label="Uygulama Sürümü" value="1.0.0" />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, loading && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8FF' },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 16 },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#208AEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  email: { fontSize: 14, color: '#9CA3AF' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  verifiedText: { color: '#059669', fontSize: 12, fontWeight: '600' },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  unverifiedText: { color: '#D97706', fontSize: 12, fontWeight: '600' },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#1F2937', fontWeight: '600' },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    marginTop: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutButtonDisabled: { opacity: 0.6 },
  logoutButtonText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
});
