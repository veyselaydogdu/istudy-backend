import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

interface ClassDetail {
  id: number;
  name: string;
  school_id: number;
}

interface ReportChild {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface DailyReport {
  id: number;
  child_id: number;
  mood: string | null;
  appetite: string | null;
  notes: string | null;
}

type MoodType = 'happy' | 'neutral' | 'sad';
type AppetiteType = 'good' | 'fair' | 'poor';

const MOOD_OPTIONS: { value: MoodType; emoji: string; label: string }[] = [
  { value: 'happy', emoji: '😀', label: 'İyi' },
  { value: 'neutral', emoji: '😐', label: 'Normal' },
  { value: 'sad', emoji: '😔', label: 'Üzgün' },
];

const APPETITE_OPTIONS: { value: AppetiteType; label: string; color: string }[] = [
  { value: 'good', label: 'İyi', color: '#10B981' },
  { value: 'fair', label: 'Orta', color: '#F59E0B' },
  { value: 'poor', label: 'Az', color: '#EF4444' },
];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const AVATAR_COLORS = ['#208AEF', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];

function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function ReportsScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [children, setChildren] = useState<ReportChild[]>([]);
  const [reports, setReports] = useState<Record<number, DailyReport>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ReportChild | null>(null);
  const [modalMood, setModalMood] = useState<MoodType | null>(null);
  const [modalAppetite, setModalAppetite] = useState<AppetiteType | null>(null);
  const [modalNotes, setModalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(
    async (date: Date) => {
      setLoading(true);
      setError(null);
      try {
        const dateStr = formatDate(date);
        const classRes = await api.get<{ data: ClassDetail }>(`/teacher/classes/${classId}`);
        setClassDetail(classRes.data.data);

        const [childrenRes, reportsRes] = await Promise.all([
          api.get<{ data: ReportChild[] }>(`/teacher/classes/${classId}/children`),
          api.get<{ data: DailyReport[] }>(
            `/teacher/daily-reports?class_id=${classId}&date=${dateStr}&school_id=${classRes.data.data.school_id}`
          ),
        ]);

        setChildren(childrenRes.data.data);

        const reportMap: Record<number, DailyReport> = {};
        for (const rep of reportsRes.data.data) {
          reportMap[rep.child_id] = rep;
        }
        setReports(reportMap);
      } catch (err: unknown) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    },
    [classId]
  );

  useEffect(() => {
    void fetchData(selectedDate);
  }, [fetchData, selectedDate]);

  const changeDate = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);
    setSelectedDate(newDate);
  };

  const openModal = (child: ReportChild) => {
    const existing = reports[child.id];
    setSelectedChild(child);
    setModalMood((existing?.mood as MoodType) ?? null);
    setModalAppetite((existing?.appetite as AppetiteType) ?? null);
    setModalNotes(existing?.notes ?? '');
    setModalVisible(true);
  };

  const handleSaveReport = async () => {
    if (!selectedChild) { return; }
    setSaving(true);
    try {
      await api.post('/teacher/daily-reports', {
        child_id: selectedChild.id,
        class_id: Number(classId),
        school_id: classDetail?.school_id,
        date: formatDate(selectedDate),
        mood: modalMood,
        appetite: modalAppetite,
        notes: modalNotes || null,
      });

      // Update local reports
      setReports((prev) => ({
        ...prev,
        [selectedChild.id]: {
          id: prev[selectedChild.id]?.id ?? 0,
          child_id: selectedChild.id,
          mood: modalMood,
          appetite: modalAppetite,
          notes: modalNotes || null,
        },
      }));

      setModalVisible(false);
      Alert.alert('Başarılı', 'Rapor kaydedildi.');
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
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

      {/* Date picker */}
      <View style={styles.datePicker}>
        <TouchableOpacity style={styles.dateArrow} onPress={() => changeDate(-1)}>
          <Ionicons name="chevron-back" size={20} color="#208AEF" />
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Ionicons name="calendar-outline" size={16} color="#208AEF" />
          <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
        </View>
        <TouchableOpacity style={styles.dateArrow} onPress={() => changeDate(1)}>
          <Ionicons name="chevron-forward" size={20} color="#208AEF" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      ) : (
        <FlatList
          data={children}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const report = reports[item.id];
            const hasReport = !!report;
            const initials = `${item.first_name.charAt(0)}${item.last_name.charAt(0)}`.toUpperCase();
            const color = avatarColor(item.first_name);

            return (
              <TouchableOpacity
                style={styles.childCard}
                onPress={() => openModal(item)}
                activeOpacity={0.75}
              >
                <View style={[styles.avatar, { backgroundColor: color }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{item.full_name}</Text>
                  {hasReport && report.mood && (
                    <Text style={styles.reportPreview}>
                      {MOOD_OPTIONS.find((m) => m.value === report.mood)?.emoji}{' '}
                      {report.notes ? report.notes.substring(0, 30) + '...' : 'Rapor var'}
                    </Text>
                  )}
                </View>
                <View style={[styles.reportBadge, hasReport ? styles.reportBadgeExists : styles.reportBadgeEmpty]}>
                  <Text style={[styles.reportBadgeText, hasReport ? styles.reportBadgeTextExists : styles.reportBadgeTextEmpty]}>
                    {hasReport ? 'Var' : 'Yok'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Öğrenci bulunamadı</Text>
            </View>
          }
        />
      )}

      {/* Report Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedChild?.full_name} — Rapor
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Ruh Hali</Text>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.moodBtn, modalMood === opt.value && styles.moodBtnActive]}
                  onPress={() => setModalMood(opt.value)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.moodLabel, modalMood === opt.value && styles.moodLabelActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>İştah</Text>
            <View style={styles.appetiteRow}>
              {APPETITE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.appetiteBtn,
                    modalAppetite === opt.value && {
                      backgroundColor: opt.color + '22',
                      borderColor: opt.color,
                    },
                  ]}
                  onPress={() => setModalAppetite(opt.value)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.appetiteBtnText,
                      modalAppetite === opt.value && { color: opt.color, fontWeight: '700' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Notlar</Text>
            <TextInput
              style={styles.notesInput}
              value={modalNotes}
              onChangeText={setModalNotes}
              placeholder="Günle ilgili notlar..."
              placeholderTextColor="#C4C9D4"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveReport}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Kaydet</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dateArrow: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 11,
  },
  dateCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  childInfo: {
    flex: 1,
    gap: 3,
  },
  childName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  reportPreview: {
    fontSize: 12,
    color: '#6B7280',
  },
  reportBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  reportBadgeExists: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  reportBadgeEmpty: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  reportBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reportBadgeTextExists: {
    color: '#059669',
  },
  reportBadgeTextEmpty: {
    color: '#9CA3AF',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F8FF',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  moodBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#208AEF',
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  moodLabelActive: {
    color: '#208AEF',
  },
  appetiteRow: {
    flexDirection: 'row',
    gap: 10,
  },
  appetiteBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  appetiteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 100,
  },
  saveButton: {
    backgroundColor: '#208AEF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
