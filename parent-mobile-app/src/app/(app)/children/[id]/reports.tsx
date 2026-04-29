import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../../lib/api';
import { getApiError } from '../../../../lib/auth';

interface ReportDay {
  date: string;
  is_today: boolean;
  attendance_status: string | null;
  has_report: boolean;
  mood: string | null;
  appetite: string | null;
  parent_notes: string | null;
  can_edit: boolean;
}

interface ReportDetail {
  date: string;
  is_today: boolean;
  attendance_status: string | null;
  has_report: boolean;
  mood: string | null;
  appetite: string | null;
  notes: string | null;
  parent_notes: string | null;
  can_edit: boolean;
}

const ATTENDANCE_LABELS: Record<string, { label: string; color: string }> = {
  present: { label: 'Geldi', color: AppColors.success },
  late: { label: 'Geç Geldi', color: AppColors.warning },
  absent: { label: 'Gelmedi', color: AppColors.error },
  excused: { label: 'Mazeretli', color: '#7C3AED' },
};

const MOOD_LABELS: Record<string, string> = {
  happy: '😀 İyi',
  neutral: '😐 Normal',
  sad: '😔 Üzgün',
};

const APPETITE_LABELS: Record<string, string> = {
  good: 'İyi',
  fair: 'Orta',
  poor: 'Az',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function ChildReportsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [days, setDays] = useState<ReportDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedDay, setSelectedDay] = useState<ReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get<{ data: ReportDay[] }>(`/parent/children/${id}/reports`);
        setDays(res.data.data);
      } catch (err: unknown) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const openDetail = async (date: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get<{ data: ReportDetail }>(`/parent/children/${id}/reports/${date}`);
      setSelectedDay(res.data.data);
      setNoteText(res.data.data.parent_notes ?? '');
      setEditMode(false);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedDay) { return; }
    setSaving(true);
    try {
      const res = await api.put<{ data: { parent_notes: string } }>(
        `/parent/children/${id}/reports/${selectedDay.date}`,
        { parent_notes: noteText }
      );
      setSelectedDay((prev) => prev ? { ...prev, parent_notes: res.data.data.parent_notes } : prev);
      setDays((prev) =>
        prev.map((d) =>
          d.date === selectedDay.date ? { ...d, parent_notes: res.data.data.parent_notes } : d
        )
      );
      setEditMode(false);
      Alert.alert('Başarılı', 'Notunuz kaydedildi.');
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const renderDay = ({ item }: { item: ReportDay }) => {
    const att = item.attendance_status ? ATTENDANCE_LABELS[item.attendance_status] : null;
    return (
      <TouchableOpacity
        style={[styles.dayCard, item.is_today && styles.dayCardToday]}
        onPress={() => void openDetail(item.date)}
        activeOpacity={0.75}
      >
        <View style={styles.dayLeft}>
          <Text style={[styles.dayDateText, item.is_today && styles.dayDateTextToday]}>
            {item.is_today ? 'Bugün' : formatDate(item.date)}
          </Text>
          {att && (
            <View style={[styles.attBadge, { backgroundColor: att.color + '22' }]}>
              <Text style={[styles.attBadgeText, { color: att.color }]}>{att.label}</Text>
            </View>
          )}
        </View>
        <View style={styles.dayRight}>
          {item.has_report && (
            <View style={styles.reportBadge}>
              <Text style={styles.reportBadgeText}>Rapor Var</Text>
            </View>
          )}
          {item.parent_notes && (
            <Ionicons name="chatbubble-outline" size={16} color={AppColors.primary} />
          )}
          {item.can_edit && (
            <Ionicons name="create-outline" size={16} color={AppColors.primary} />
          )}
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Günlük Raporlar</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {detailLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      )}

      <FlatList
        data={days}
        keyExtractor={(item) => item.date}
        renderItem={renderDay}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Son 30 günde rapor bulunamadı.</Text>
          </View>
        }
      />

      {/* Detay Modal */}
      <Modal
        visible={!!selectedDay}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setSelectedDay(null); setEditMode(false); }}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {selectedDay && (
            <>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {selectedDay.is_today ? 'Bugün' : formatDate(selectedDay.date)}
                  </Text>
                  {selectedDay.attendance_status && (
                    <Text style={[
                      styles.modalSubtitle,
                      { color: ATTENDANCE_LABELS[selectedDay.attendance_status]?.color ?? '#6B7280' },
                    ]}>
                      {ATTENDANCE_LABELS[selectedDay.attendance_status]?.label}
                    </Text>
                  )}
                  {!selectedDay.attendance_status && (
                    <Text style={styles.modalSubtitleGray}>Yoklama kaydı yok</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => { setSelectedDay(null); setEditMode(false); }}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {selectedDay.has_report ? (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionLabel}>Öğretmen Raporu</Text>
                  {selectedDay.mood && (
                    <View style={styles.reportRow}>
                      <Text style={styles.reportRowLabel}>Ruh Hali</Text>
                      <Text style={styles.reportRowValue}>
                        {MOOD_LABELS[selectedDay.mood] ?? selectedDay.mood}
                      </Text>
                    </View>
                  )}
                  {selectedDay.appetite && (
                    <View style={styles.reportRow}>
                      <Text style={styles.reportRowLabel}>İştah</Text>
                      <Text style={styles.reportRowValue}>
                        {APPETITE_LABELS[selectedDay.appetite] ?? selectedDay.appetite}
                      </Text>
                    </View>
                  )}
                  {selectedDay.notes && (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>{selectedDay.notes}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.modalSection}>
                  <Text style={styles.emptyReportText}>Bu gün için öğretmen raporu girilmemiş.</Text>
                </View>
              )}

              <View style={styles.modalSection}>
                <View style={styles.sectionLabelRow}>
                  <Text style={styles.sectionLabel}>Veli Notu</Text>
                  {selectedDay.can_edit && !editMode && (
                    <TouchableOpacity onPress={() => setEditMode(true)}>
                      <Text style={styles.editLink}>Düzenle</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {editMode ? (
                  <>
                    <TextInput
                      style={styles.noteInput}
                      value={noteText}
                      onChangeText={setNoteText}
                      placeholder="Notunuzu yazın..."
                      placeholderTextColor="#C4C9D4"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      autoFocus
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => { setEditMode(false); setNoteText(selectedDay.parent_notes ?? ''); }}
                      >
                        <Text style={styles.cancelBtnText}>İptal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                        onPress={() => void handleSaveNote()}
                        disabled={saving}
                      >
                        {saving
                          ? <ActivityIndicator color="#FFF" size="small" />
                          : <Text style={styles.saveBtnText}>Kaydet</Text>
                        }
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  selectedDay.parent_notes
                    ? <View style={styles.notesBox}>
                        <Text style={styles.notesText}>{selectedDay.parent_notes}</Text>
                      </View>
                    : <Text style={styles.emptyReportText}>
                        {selectedDay.can_edit
                          ? 'Henüz not eklenmemiş. Düzenle\'ye basarak ekleyebilirsiniz.'
                          : 'Veli notu yok.'}
                      </Text>
                )}

                {!selectedDay.can_edit && selectedDay.is_today && (
                  <View style={styles.warningBox}>
                    <Ionicons name="information-circle-outline" size={16} color={AppColors.warning} />
                    <Text style={styles.warningText}>
                      {!selectedDay.attendance_status
                        ? 'Devamsızlık kaydı girilmediği için not eklenemiyor.'
                        : 'Çocuğunuz bugün okula gelmediği için not eklenemiyor.'}
                    </Text>
                  </View>
                )}
                {!selectedDay.is_today && (
                  <View style={styles.warningBox}>
                    <Ionicons name="lock-closed-outline" size={16} color={AppColors.onSurfaceVariant} />
                    <Text style={styles.warningText}>Geçmiş günlere not eklenemez.</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: AppColors.onSurface },
  errorBox: {
    marginHorizontal: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: { color: AppColors.error, fontSize: 13 },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 10,
  },
  list: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 4 },
  dayCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dayCardToday: {
    borderWidth: 1.5,
    borderColor: AppColors.primary,
  },
  dayLeft: { gap: 5 },
  dayDateText: { fontSize: 14, fontWeight: '600', color: AppColors.onSurface },
  dayDateTextToday: { color: AppColors.primary },
  attBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  attBadgeText: { fontSize: 11, fontWeight: '700' },
  dayRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reportBadge: {
    backgroundColor: AppColors.successContainer,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  reportBadgeText: { fontSize: 11, fontWeight: '600', color: AppColors.success },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: AppColors.onSurfaceVariant },
  // Modal
  modalContainer: { flex: 1, backgroundColor: AppColors.surface, padding: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: AppColors.onSurface },
  modalSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  modalSubtitleGray: { fontSize: 13, color: AppColors.onSurfaceVariant, marginTop: 3 },
  modalSection: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: AppColors.onSurfaceVariant, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  editLink: { fontSize: 13, fontWeight: '700', color: AppColors.primary },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainerLow,
  },
  reportRowLabel: { fontSize: 14, color: AppColors.onSurfaceVariant },
  reportRowValue: { fontSize: 14, fontWeight: '600', color: AppColors.onSurface },
  notesBox: {
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  notesText: { fontSize: 14, color: AppColors.onSurface, lineHeight: 20 },
  emptyReportText: { fontSize: 14, color: AppColors.onSurfaceVariant, fontStyle: 'italic' },
  noteInput: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: AppColors.onSurface,
    minHeight: 100,
  },
  editButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: AppColors.onSurfaceVariant },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: AppColors.white },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  warningText: { fontSize: 12, color: AppColors.onSurfaceVariant, flex: 1, lineHeight: 17 },
});
