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
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NavMenuItem } from '@/components/ui/NavMenuItem';
import { SectionLabel } from '@/components/ui/SectionLabel';
import api from '../../lib/api';
import { getApiError, logoutRequest } from '../../lib/auth';

interface InvoiceStats {
  pending_count: number;
  overdue_count: number;
  pending_amount: number;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStats | null>(null);
  const [pendingInvitationCount, setPendingInvitationCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const [invoiceRes, invitationsRes] = await Promise.all([
            api.get<{ data: InvoiceStats }>('/parent/invoices/stats'),
            api.get<{ data: { id: number }[] }>('/parent/family/invitations'),
          ]);
          setInvoiceStats(invoiceRes.data.data);
          setPendingInvitationCount(invitationsRes.data.data.length);
        } catch {
          // sessizce geç
        }
      };
      void fetchData();
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

  const fullName = user ? `${user.name ?? ''} ${user.surname ?? ''}`.trim() : '';
  const pendingCount = (invoiceStats?.pending_count ?? 0) + (invoiceStats?.overdue_count ?? 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <Card style={styles.heroCard}>
          <View style={styles.avatarRing}>
            <Avatar name={fullName || '?'} size={76} shape="circle" />
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
          {user?.email_verified_at ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={AppColors.success} />
              <Text style={styles.verifiedText}>E-posta Doğrulandı</Text>
            </View>
          ) : (
            <View style={styles.unverifiedBadge}>
              <Ionicons name="warning-outline" size={13} color={AppColors.warning} />
              <Text style={styles.unverifiedText}>E-posta Doğrulanmamış</Text>
            </View>
          )}
        </Card>

        {/* Bekleyen fatura uyarısı */}
        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.invoiceAlert}
            onPress={() => router.push('/(app)/invoices')}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={20} color={AppColors.warning} />
            <Text style={styles.invoiceAlertText}>
              {pendingCount} adet ödeme bekleyen faturanız var
            </Text>
            <Ionicons name="chevron-forward" size={16} color={AppColors.warning} />
          </TouchableOpacity>
        )}

        {/* Bekleyen aile daveti bildirimi */}
        {pendingInvitationCount > 0 && (
          <TouchableOpacity
            style={styles.invitationAlert}
            onPress={() => router.push('/(app)/family')}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={20} color={AppColors.info} />
            <Text style={styles.invitationAlertText}>
              {pendingInvitationCount === 1
                ? 'Bekleyen 1 aile davetiniz var'
                : `${pendingInvitationCount} adet bekleyen aile davetiniz var`}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={AppColors.info} />
          </TouchableOpacity>
        )}

        {/* Hesap */}
        <View style={styles.section}>
          <SectionLabel style={styles.sectionLabelPad}>Hesap</SectionLabel>
          <Card style={styles.menuCard}>
            <NavMenuItem icon="person-outline" label={fullName || 'İsim Yok'} sublabel={user?.email ?? ''} rightElement={<View />} showDivider />
            {user?.phone ? (
              <NavMenuItem icon="call-outline" label={user.phone} sublabel="Telefon" rightElement={<View />} />
            ) : null}
          </Card>
        </View>

        {/* Çocuklar & Okullar */}
        <View style={styles.section}>
          <SectionLabel style={styles.sectionLabelPad}>Çocuklar &amp; Okullar</SectionLabel>
          <Card style={styles.menuCard}>
            <NavMenuItem
              icon="people-outline"
              label="Çocuklarım"
              sublabel="Çocuk bilgileri ve sağlık kayıtları"
              onPress={() => router.push('/(app)/children')}
              showDivider
            />
            <NavMenuItem
              icon="school-outline"
              label="Okullarım"
              sublabel="Kayıtlı okullar ve detaylar"
              onPress={() => router.push('/(app)/schools')}
              showDivider
            />
            <NavMenuItem
              icon="heart-outline"
              label="Aile Yönetimi"
              sublabel="Üyeler ve acil durum kişileri"
              onPress={() => router.push('/(app)/family')}
            />
          </Card>
        </View>

        {/* Mali İşlemler */}
        <View style={styles.section}>
          <SectionLabel style={styles.sectionLabelPad}>Mali İşlemler</SectionLabel>
          <Card style={styles.menuCard}>
            <NavMenuItem
              icon="receipt-outline"
              label="Faturalarım"
              sublabel="Tüm ödemeleriniz"
              badge={pendingCount > 0 ? pendingCount : undefined}
              onPress={() => router.push('/(app)/invoices')}
            />
          </Card>
        </View>

        {/* Uygulama */}
        <View style={styles.section}>
          <SectionLabel style={styles.sectionLabelPad}>Uygulama</SectionLabel>
          <Card style={styles.menuCard}>
            <NavMenuItem
              icon="phone-portrait-outline"
              label="Uygulama Sürümü"
              sublabel="1.0.0"
              rightElement={<Text style={styles.versionText}>v1.0.0</Text>}
            />
          </Card>
        </View>

        {/* Çıkış */}
        {loading ? (
          <ActivityIndicator color={AppColors.error} style={styles.loader} />
        ) : (
          <Button
            label="Çıkış Yap"
            variant="danger"
            size="lg"
            fullWidth
            icon={<Ionicons name="log-out-outline" size={20} color={AppColors.white} />}
            onPress={handleLogout}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 4 },

  heroCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: { fontSize: 22, fontWeight: '800', color: AppColors.onSurface },
  email: { fontSize: 14, color: AppColors.onSurfaceVariant, fontWeight: '500' },
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
    marginBottom: 12,
  },
  invoiceAlertText: {
    flex: 1,
    fontSize: 13,
    color: AppColors.warning,
    fontWeight: '600',
  },

  invitationAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AppColors.infoContainer,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 12,
  },
  invitationAlertText: {
    flex: 1,
    fontSize: 13,
    color: AppColors.info,
    fontWeight: '600',
  },

  section: { marginBottom: 12 },
  sectionLabelPad: { paddingHorizontal: 4, marginBottom: 8 },
  menuCard: { padding: 0, overflow: 'hidden' },

  versionText: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
    fontWeight: '600',
  },

  loader: { paddingVertical: 16 },
  bottomSpacer: { height: 8 },
});
