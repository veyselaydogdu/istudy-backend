import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Transaction {
  id: number;
  order_id: string;
  amount: number;
  status: 0 | 1 | 2;
  payment_gateway: string | null;
  bank_name: string | null;
  card_last_four: string | null;
  error_message: string | null;
  created_at: string;
}

interface InvoiceDetail {
  id: number;
  invoice_no: string;
  module: string;
  invoice_type: 'invoice' | 'refund';
  original_invoice_id: number | null;
  refund_reason: string | null;
  status: string;
  total_amount: number;
  currency: string;
  notes: string | null;
  issue_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  is_overdue: boolean;
  created_at: string;
  items: InvoiceItem[];
  transactions: Transaction[];
  activity_class: {
    id: number;
    name: string;
    location?: string | null;
    schedule?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  } | null;
  child: { id: number; full_name: string } | null;
  refund_invoice: { id: number; invoice_number: string; status: string } | null;
  original_invoice: { id: number; invoice_number: string; amount: number; currency: string; status: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  draft: { label: 'Taslak', color: '#9CA3AF', bg: '#F9FAFB', icon: 'document-outline' },
  pending: { label: 'Ödeme Bekleniyor', color: '#D97706', bg: '#FFFBEB', icon: 'time-outline' },
  paid: { label: 'Ödendi', color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle-outline' },
  overdue: { label: 'Gecikmiş', color: '#EF4444', bg: '#FEF2F2', icon: 'alert-circle-outline' },
  cancelled: { label: 'İptal Edildi', color: '#9CA3AF', bg: '#F9FAFB', icon: 'close-circle-outline' },
  refunded: { label: 'İade Edildi', color: '#7C3AED', bg: '#F5F3FF', icon: 'return-down-back-outline' },
};

const MODULE_LABELS: Record<string, string> = {
  activity_class: 'Etkinlik Sınıfı',
  subscription: 'Abonelik',
  manual: 'Manuel',
  event: 'Etkinlik',
  activity: 'Faaliyet',
};

const TX_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: 'Bekliyor', color: '#D97706' },
  1: { label: 'Başarılı', color: '#059669' },
  2: { label: 'Başarısız', color: '#EF4444' },
};

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  );
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await api.get<{ data: InvoiceDetail }>(`/parent/invoices/${id}`);
      setInvoice(res.data.data);
    } catch (err: unknown) {
      void getApiError(err);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchInvoice();
  }, [fetchInvoice]);

  if (loading || !invoice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#208AEF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fatura Detayı</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      </SafeAreaView>
    );
  }

  const isOverdue = invoice.is_overdue || (invoice.status === 'pending' && !!invoice.due_date && new Date(invoice.due_date) < new Date());
  const effectiveStatus = isOverdue && invoice.status === 'pending' ? 'overdue' : invoice.status;
  const cfg = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG.pending;
  const isRefund = invoice.invoice_type === 'refund';

  const formatCurrency = (amount: number, currency: string) =>
    `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#208AEF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fatura Detayı</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={[styles.heroCard, { borderTopColor: cfg.color }]}>
          <View style={[styles.statusIcon, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={32} color={cfg.color} />
          </View>
          <Text style={[styles.heroAmount, isRefund && { color: '#7C3AED' }, isOverdue && { color: '#EF4444' }]}>
            {isRefund ? '−' : ''}{formatCurrency(invoice.total_amount, invoice.currency)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <View style={styles.moduleBadge}>
            <Text style={styles.moduleBadgeText}>{MODULE_LABELS[invoice.module] ?? invoice.module}</Text>
            {isRefund && (
              <Text style={[styles.moduleBadgeText, { color: '#7C3AED' }]}> · İade</Text>
            )}
          </View>
        </View>

        {/* Fatura bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FATURA BİLGİLERİ</Text>
          <DetailRow label="Fatura No" value={invoice.invoice_no} />
          {invoice.issue_date && (
            <DetailRow
              label="Düzenlenme Tarihi"
              value={new Date(invoice.issue_date).toLocaleDateString('tr-TR')}
            />
          )}
          {invoice.due_date && (
            <DetailRow
              label="Son Ödeme Tarihi"
              value={new Date(invoice.due_date).toLocaleDateString('tr-TR')}
              valueColor={isOverdue ? '#EF4444' : undefined}
            />
          )}
          {invoice.paid_at && (
            <DetailRow
              label="Ödeme Tarihi"
              value={new Date(invoice.paid_at).toLocaleDateString('tr-TR')}
              valueColor="#059669"
            />
          )}
          {invoice.child && (
            <DetailRow label="Çocuk" value={invoice.child.full_name} />
          )}
        </View>

        {/* Kalemler */}
        {invoice.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FATURA KALEMLERİ</Text>
            {invoice.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                  <Text style={styles.itemQty}>{item.quantity} adet × {formatCurrency(item.unit_price, invoice.currency)}</Text>
                </View>
                <Text style={styles.itemTotal}>{formatCurrency(item.total_price, invoice.currency)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Toplam</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.total_amount, invoice.currency)}</Text>
            </View>
          </View>
        )}

        {/* Etkinlik sınıfı */}
        {invoice.activity_class && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ETKİNLİK SINIFI</Text>
            <DetailRow label="Sınıf Adı" value={invoice.activity_class.name} />
            {invoice.activity_class.location && (
              <DetailRow label="Konum" value={invoice.activity_class.location} />
            )}
            {invoice.activity_class.schedule && (
              <DetailRow label="Program" value={invoice.activity_class.schedule} />
            )}
            {invoice.activity_class.start_date && (
              <DetailRow
                label="Başlangıç"
                value={new Date(invoice.activity_class.start_date).toLocaleDateString('tr-TR')}
              />
            )}
            {invoice.activity_class.end_date && (
              <DetailRow
                label="Bitiş"
                value={new Date(invoice.activity_class.end_date).toLocaleDateString('tr-TR')}
              />
            )}
          </View>
        )}

        {/* İşlemler (ödeme geçmişi) */}
        {invoice.transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ÖDEME GEÇMİŞİ</Text>
            {invoice.transactions.map((tx) => {
              const txStatus = TX_STATUS[tx.status] ?? TX_STATUS[0];
              return (
                <View key={tx.id} style={styles.txRow}>
                  <View style={styles.txLeft}>
                    <Ionicons
                      name={tx.status === 1 ? 'checkmark-circle' : tx.status === 2 ? 'close-circle' : 'time'}
                      size={18}
                      color={txStatus.color}
                    />
                    <View>
                      <Text style={styles.txAmount}>{formatCurrency(tx.amount, invoice.currency)}</Text>
                      {tx.bank_name && <Text style={styles.txMeta}>{tx.bank_name}{tx.card_last_four ? ` ****${tx.card_last_four}` : ''}</Text>}
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txStatus, { color: txStatus.color }]}>{txStatus.label}</Text>
                    <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString('tr-TR')}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* İade bilgisi */}
        {invoice.refund_reason && (
          <View style={[styles.section, styles.refundSection]}>
            <Text style={styles.sectionTitle}>İADE NEDENİ</Text>
            <Text style={styles.refundReason}>{invoice.refund_reason}</Text>
          </View>
        )}

        {/* İade faturası linki (orijinal faturada) */}
        {!isRefund && invoice.refund_invoice && (
          <View style={[styles.section, styles.refundSection]}>
            <Text style={styles.sectionTitle}>İADE FATURASI</Text>
            <TouchableOpacity
              style={styles.refundLink}
              onPress={() => router.push(`/(app)/invoices/${invoice.refund_invoice!.id}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="return-down-back-outline" size={16} color="#7C3AED" />
              <Text style={styles.refundLinkText}>{invoice.refund_invoice.invoice_number}</Text>
              <Ionicons name="chevron-forward" size={14} color="#7C3AED" />
            </TouchableOpacity>
          </View>
        )}

        {/* Orijinal fatura linki (iade faturasında) */}
        {isRefund && invoice.original_invoice && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ORİJİNAL FATURA</Text>
            <DetailRow label="Fatura No" value={invoice.original_invoice.invoice_number} />
            <DetailRow
              label="Tutar"
              value={formatCurrency(invoice.original_invoice.amount, invoice.original_invoice.currency)}
            />
          </View>
        )}

        {/* Notlar */}
        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTLAR</Text>
            <Text style={styles.notes}>{invoice.notes}</Text>
          </View>
        )}

        {/* Ödeme bekleniyor uyarısı */}
        {(invoice.status === 'pending' || isOverdue) && (
          <View style={[styles.paymentNotice, isOverdue && styles.paymentNoticeOverdue]}>
            <Ionicons
              name={isOverdue ? 'alert-circle' : 'information-circle'}
              size={20}
              color={isOverdue ? '#EF4444' : '#D97706'}
            />
            <Text style={[styles.paymentNoticeText, isOverdue && { color: '#EF4444' }]}>
              {isOverdue
                ? 'Bu faturanın ödeme süresi geçmiş. Lütfen okul ile iletişime geçin.'
                : 'Bu fatura ödeme bekliyor. Ödeme için okul ile iletişime geçin.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  statusIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroAmount: { fontSize: 32, fontWeight: '900', color: '#1F2937' },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  statusBadgeText: { fontSize: 13, fontWeight: '700' },
  moduleBadge: { flexDirection: 'row', alignItems: 'center' },
  moduleBadgeText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  refundSection: { borderWidth: 1, borderColor: '#EDE9FE' },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  detailLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  detailValue: { fontSize: 13, color: '#1F2937', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  itemInfo: { flex: 1 },
  itemDesc: { fontSize: 13, color: '#1F2937', fontWeight: '600' },
  itemQty: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  itemTotal: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  totalValue: { fontSize: 16, fontWeight: '900', color: '#1F2937' },

  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txAmount: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  txMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  txRight: { alignItems: 'flex-end' },
  txStatus: { fontSize: 12, fontWeight: '600' },
  txDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  refundReason: { fontSize: 14, color: '#374151', lineHeight: 20 },
  refundLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    padding: 12,
  },
  refundLinkText: { flex: 1, fontSize: 14, color: '#7C3AED', fontWeight: '600' },

  notes: { fontSize: 13, color: '#6B7280', lineHeight: 20 },

  paymentNotice: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'flex-start',
  },
  paymentNoticeOverdue: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  paymentNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#D97706',
    lineHeight: 20,
    fontWeight: '500',
  },
});
