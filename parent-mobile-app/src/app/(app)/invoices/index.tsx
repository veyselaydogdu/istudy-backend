import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

interface Invoice {
  id: number;
  invoice_no: string;
  module: 'subscription' | 'activity_class' | 'manual' | 'event' | 'activity';
  invoice_type: 'invoice' | 'refund';
  status: 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue' | 'refunded';
  total_amount: number;
  currency: string;
  due_date: string | null;
  paid_at: string | null;
  is_overdue: boolean;
  created_at: string;
  activity_class: { id: number; name: string } | null;
  child: { id: number; full_name: string } | null;
}

interface Stats {
  total: number;
  pending_count: number;
  paid_count: number;
  overdue_count: number;
  pending_amount: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  draft: { label: 'Taslak', color: AppColors.onSurfaceVariant, bg: AppColors.surfaceContainerLow, icon: 'document-outline' },
  pending: { label: 'Bekliyor', color: AppColors.warning, bg: AppColors.warningContainer, icon: 'time-outline' },
  paid: { label: 'Ödendi', color: AppColors.success, bg: AppColors.successContainer, icon: 'checkmark-circle-outline' },
  overdue: { label: 'Gecikmiş', color: AppColors.error, bg: '#FEF2F2', icon: 'alert-circle-outline' },
  cancelled: { label: 'İptal', color: AppColors.onSurfaceVariant, bg: AppColors.surfaceContainerLow, icon: 'close-circle-outline' },
  refunded: { label: 'İade Edildi', color: '#7C3AED', bg: '#F5F3FF', icon: 'return-down-back-outline' },
};

const MODULE_LABELS: Record<string, string> = {
  activity_class: 'Etkinlik Sınıfı',
  subscription: 'Abonelik',
  manual: 'Manuel',
  event: 'Etkinlik',
  activity: 'Faaliyet',
};

function StatusBadge({ status, isOverdue }: { status: string; isOverdue: boolean }) {
  const effectiveStatus = isOverdue && status === 'pending' ? 'overdue' : status;
  const cfg = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG.pending;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={12} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<{ data: Stats }>('/parent/invoices/stats');
      setStats(res.data.data);
    } catch {
      // sessizce geç
    }
  }, []);

  const fetchInvoices = useCallback(async (currentPage = 1, isRefresh = false) => {
    try {
      const res = await api.get<{
        data: Invoice[];
        meta: { current_page: number; last_page: number };
      }>('/parent/invoices', { params: { page: currentPage, per_page: 15 } });

      const newInvoices = res.data.data ?? [];
      const meta = res.data.meta;

      if (isRefresh || currentPage === 1) {
        setInvoices(newInvoices);
      } else {
        setInvoices((prev) => [...prev, ...newInvoices]);
      }
      setPage(meta.current_page);
      setLastPage(meta.last_page);
    } catch (err: unknown) {
      void getApiError(err);
    }
  }, []);

  const loadAll = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    await Promise.all([fetchStats(), fetchInvoices(1, isRefresh)]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchStats, fetchInvoices]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadAll(true);
  };

  const handleLoadMore = async () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    await fetchInvoices(page + 1);
    setLoadingMore(false);
  };

  const formatCurrency = (amount: number, currency: string) =>
    `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency}`;

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const isRefund = item.invoice_type === 'refund';
    const isOverdue = item.is_overdue || (item.status === 'pending' && !!item.due_date && new Date(item.due_date) < new Date());
    return (
      <TouchableOpacity
        style={[styles.card, isRefund && styles.cardRefund, isOverdue && styles.cardOverdue]}
        onPress={() => router.push(`/(app)/invoices/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconBox, isRefund && styles.iconBoxRefund, isOverdue && styles.iconBoxOverdue]}>
              <Ionicons
                name={isRefund ? 'return-down-back' : isOverdue ? 'alert-circle' : 'receipt-outline'}
                size={20}
                color={isRefund ? '#7C3AED' : isOverdue ? AppColors.error : AppColors.primary}
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.invoiceNo}>{item.invoice_no}</Text>
              {item.module !== 'subscription' && (
                <Text style={styles.moduleLabel}>{MODULE_LABELS[item.module] ?? item.module}</Text>
              )}
              {item.activity_class && (
                <Text style={styles.activityName} numberOfLines={1}>
                  {item.activity_class.name}
                </Text>
              )}
              {item.child && (
                <Text style={styles.childName}>{item.child.full_name}</Text>
              )}
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.amount, isRefund && styles.amountRefund, isOverdue && styles.amountOverdue]}>
              {isRefund ? '−' : ''}{formatCurrency(item.total_amount, item.currency)}
            </Text>
            <StatusBadge status={item.status} isOverdue={isOverdue} />
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('tr-TR')}
          </Text>
          {item.due_date && item.status === 'pending' && (
            <Text style={[styles.dueText, isOverdue && styles.dueDateOverdue]}>
              Son ödeme: {new Date(item.due_date).toLocaleDateString('tr-TR')}
            </Text>
          )}
          {item.paid_at && (
            <Text style={styles.paidText}>
              Ödendi: {new Date(item.paid_at).toLocaleDateString('tr-TR')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={AppColors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Faturalarım</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={AppColors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Faturalarım</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderInvoice}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={AppColors.primary} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          stats ? (
            <View style={styles.statsRow}>
              <StatCard
                value={stats.pending_count}
                label="Bekleyen"
                accentColor={AppColors.warning}
                icon={<Ionicons name="time" size={24} color={AppColors.warning} />}
              />
              <StatCard
                value={stats.overdue_count}
                label="Gecikmiş"
                accentColor={AppColors.error}
                icon={<Ionicons name="alert-circle" size={24} color={AppColors.error} />}
              />
              <StatCard
                value={stats.paid_count}
                label="Ödendi"
                accentColor={AppColors.success}
                icon={<Ionicons name="checkmark-circle" size={24} color={AppColors.success} />}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Fatura yok</Text>
            <Text style={styles.emptyText}>
              Ödeme gerektiren bir hizmete kayıt olduğunuzda faturalarınız burada görünür.
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={AppColors.primary} style={{ paddingVertical: 16 }} /> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainer,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: AppColors.primary },
  list: { padding: 16, gap: 10 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },

  card: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 14,
    borderBottomWidth: 3,
    borderBottomColor: AppColors.surfaceContainer,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRefund: { borderLeftWidth: 3, borderLeftColor: '#7C3AED' },
  cardOverdue: { borderLeftWidth: 3, borderLeftColor: AppColors.error },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flexDirection: 'row', gap: 10, flex: 1 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxRefund: { backgroundColor: '#F5F3FF' },
  iconBoxOverdue: { backgroundColor: '#FEE2E2' },
  cardInfo: { flex: 1 },
  invoiceNo: { fontSize: 13, fontWeight: '700', color: AppColors.onSurface },
  moduleLabel: { fontSize: 10, color: AppColors.primary, marginTop: 1, fontWeight: '600', textTransform: 'uppercase' },
  activityName: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 2, fontWeight: '500' },
  childName: { fontSize: 11, color: AppColors.onSurfaceVariant, marginTop: 1 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 15, fontWeight: '800', color: AppColors.onSurface },
  amountRefund: { color: '#7C3AED' },
  amountOverdue: { color: AppColors.error },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainerLow,
  },
  dateText: { fontSize: 11, color: AppColors.onSurfaceVariant },
  dueText: { fontSize: 11, color: AppColors.warning, fontWeight: '500' },
  dueDateOverdue: { color: AppColors.error },
  paidText: { fontSize: 11, color: AppColors.success, fontWeight: '500' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: AppColors.onSurfaceVariant },
  emptyText: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
