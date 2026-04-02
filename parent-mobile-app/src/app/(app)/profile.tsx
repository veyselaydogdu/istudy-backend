import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
import { AppColors } from '@/constants/theme';
import api from '../../lib/api';
import { getApiError, logoutRequest } from '../../lib/auth';

interface InvoiceStats {
  pending_count: number;
  overdue_count: number;
  pending_amount: number;
}

interface InfoRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={17} color={AppColors.primary} />
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
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchInvoiceStats = async () => {
        try {
          const res = await api.get<{ data: InvoiceStats }>('/parent/invoices/stats');
          setInvoiceStats(res.data.data);
        } catch {
          // sessizce geç
        }
      };
      void fetchInvoiceStats();
    }, [])
  );

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

  const pendingCount = (invoiceStats?.pending_count ?? 0) + (invoiceStats?.overdue_count ?? 0);

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

        {/* Bekleyen fatura uyarısı */}
        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.invoiceAlert}
            onPress={() => router.push('/(app)/invoices')}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={20} color="#D97706" />
            <Text style={styles.invoiceAlertText}>
              {pendingCount} adet ödeme bekleyen faturanız var
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#D97706" />
          </TouchableOpacity>
        )}

        {/* Contact info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
          <InfoRow icon="person-outline" label="Ad Soyad" value={fullName} />
          <InfoRow icon="mail-outline" label="E-posta" value={user?.email ?? ''} />
          {user?.phone && (
            <InfoRow icon="call-outline" label="Telefon" value={user.phone} />
          )}
        </View>

        {/* Çocuklarım & Okullarım */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bilgilerim</Text>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => router.push('/(app)/children')}
            activeOpacity={0.8}
          >
            <View style={styles.infoIconWrap}>
              <Ionicons name="people-outline" size={17} color={AppColors.primary} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoValue}>Çocuklarım</Text>
              <Text style={styles.infoLabel}>Çocuk bilgileri ve sağlık kayıtları</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.navDivider} />
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => router.push('/(app)/schools')}
            activeOpacity={0.8}
          >
            <View style={styles.infoIconWrap}>
              <Ionicons name="school-outline" size={17} color={AppColors.primary} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoValue}>Okullarım</Text>
              <Text style={styles.infoLabel}>Kayıtlı okullar ve detaylar</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Family */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => router.push('/(app)/family')}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionTitle}>Aile</Text>
          <View style={styles.navRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="heart-outline" size={17} color={AppColors.primary} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoValue}>Aile Yönetimi</Text>
              <Text style={styles.infoLabel}>Üyeler ve acil durum kişileri</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        {/* Faturalarım */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => router.push('/(app)/invoices')}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionTitle}>Ödeme</Text>
          <View style={styles.navRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="receipt-outline" size={17} color={AppColors.primary} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoValue}>Faturalarım</Text>
              <Text style={styles.infoLabel}>Tüm ödemeleriniz</Text>
            </View>
            {pendingCount > 0 ? (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            )}
          </View>
        </TouchableOpacity>

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
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 16 },

  heroCard: {
    backgroundColor: AppColors.white,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: AppColors.primaryDim,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderBottomWidth: 4,
    borderBottomColor: AppColors.surfaceContainer,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: AppColors.white, fontSize: 30, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: AppColors.onSurface },
  email: { fontSize: 14, color: AppColors.onSurfaceVariant },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.successContainer,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  verifiedText: { color: AppColors.success, fontSize: 12, fontWeight: '600' },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.warningContainer,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  unverifiedText: { color: AppColors.warning, fontSize: 12, fontWeight: '600' },

  invoiceAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AppColors.warningContainer,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.tertiaryContainer,
  },
  invoiceAlertText: {
    flex: 1,
    fontSize: 13,
    color: AppColors.warning,
    fontWeight: '600',
  },

  section: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 16,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderBottomWidth: 3,
    borderBottomColor: AppColors.surfaceContainer,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.onSurfaceVariant,
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
    borderBottomColor: AppColors.surfaceContainerLow,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: AppColors.onSurfaceVariant, fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 14, color: AppColors.onSurface, fontWeight: '600' },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  navDivider: {
    height: 1,
    backgroundColor: AppColors.surfaceContainer,
    marginVertical: 4,
  },

  pendingBadge: {
    backgroundColor: AppColors.warning,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  pendingBadgeText: { color: AppColors.white, fontSize: 12, fontWeight: '700' },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#fecaca',
    marginTop: 4,
    shadowColor: AppColors.error,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
    borderBottomWidth: 4,
  },
  logoutButtonDisabled: { opacity: 0.6 },
  logoutButtonText: { color: AppColors.error, fontSize: 16, fontWeight: '700' },
});
