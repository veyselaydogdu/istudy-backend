import { AppColors } from '@/constants/theme';
import { PrivateImage } from '@/components/ui/PrivateImage';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../../lib/api';
import { getApiError } from '../../../../lib/auth';

// ── Types ───────────────────────────────────────────────────────────────────

type TabType = 'students' | 'attendance' | 'reports';
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
type MoodType = 'happy' | 'neutral' | 'sad';
type AppetiteType = 'good' | 'fair' | 'poor';

interface ClassDetail {
  id: number;
  name: string;
  school_name: string;
  school_id: number;
  student_count: number;
  color: string | null;
}

interface ClassChild {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string | null;
  profile_photo?: string | null;
  allergens: Array<{ id: number; name: string }>;
  medications: Array<{ id: number; name: string }>;
}

interface AttendanceRecord {
  child_id: number;
  status: AttendanceStatus | null;
  is_recorded: boolean;
}

interface DailyReport {
  id: number;
  child_id: number;
  mood: string | null;
  appetite: string | null;
  notes: string | null;
}

// ── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bgColor: string }> = {
  present: { label: 'Geldi', color: AppColors.success, bgColor: AppColors.successContainer },
  absent: { label: 'Gelmedi', color: AppColors.error, bgColor: '#FEE2E2' },
  late: { label: 'Geç', color: AppColors.warning, bgColor: AppColors.warningContainer },
  excused: { label: 'Mazeretli', color: '#7C3AED', bgColor: '#EDE9FE' },
};

const MOOD_OPTIONS: { value: MoodType; emoji: string; label: string }[] = [
  { value: 'happy', emoji: '😀', label: 'İyi' },
  { value: 'neutral', emoji: '😐', label: 'Normal' },
  { value: 'sad', emoji: '😔', label: 'Üzgün' },
];

const APPETITE_OPTIONS: { value: AppetiteType; label: string; color: string }[] = [
  { value: 'good', label: 'İyi', color: AppColors.success },
  { value: 'fair', label: 'Orta', color: AppColors.warning },
  { value: 'poor', label: 'Az', color: AppColors.error },
];

const AVATAR_COLORS = [AppColors.primary, '#8B5CF6', '#EC4899', AppColors.warning, AppColors.success, AppColors.error];

// ── Helpers ─────────────────────────────────────────────────────────────────

function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

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

// ── DatePickerBar ────────────────────────────────────────────────────────────

function DatePickerBar({ date, onChange }: { date: Date; onChange: (d: Date) => void }) {
  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    onChange(d);
  };
  return (
    <View style={styles.datePicker}>
      <TouchableOpacity style={styles.dateArrow} onPress={() => changeDate(-1)}>
        <Ionicons name="chevron-back" size={20} color="#208AEF" />
      </TouchableOpacity>
      <View style={styles.dateCenter}>
        <Ionicons name="calendar-outline" size={16} color="#208AEF" />
        <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
      </View>
      <TouchableOpacity style={styles.dateArrow} onPress={() => changeDate(1)}>
        <Ionicons name="chevron-forward" size={20} color="#208AEF" />
      </TouchableOpacity>
    </View>
  );
}

// ── AttendanceContent ────────────────────────────────────────────────────────

function AttendanceContent({
  classId,
  children,
  selectedDate,
}: {
  classId: string;
  children: ClassChild[];
  selectedDate: Date;
}) {
  const isToday = formatDate(selectedDate) === formatDate(new Date());
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = formatDate(selectedDate);
      const res = await api.get<{ data: AttendanceRecord[] }>(
        `/teacher/attendance?class_id=${classId}&date=${dateStr}`
      );
      const map: Record<number, AttendanceStatus> = {};
      for (const rec of res.data.data) {
        if (rec.is_recorded && rec.status) {
          map[rec.child_id] = rec.status;
        }
      }
      setAttendance(map);
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [classId, selectedDate]);

  useEffect(() => {
    void fetchAttendance();
  }, [fetchAttendance]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/teacher/attendance', {
        class_id: Number(classId),
        date: formatDate(selectedDate),
        attendances: children.map((c) => ({
          child_id: c.id,
          status: attendance[c.id] ?? 'absent',
        })),
      });
      Alert.alert('Başarılı', 'Yoklama kaydedildi.');
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <View style={styles.errorBox}>
        <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {!isToday && (
        <View style={styles.readonlyBanner}>
          <Ionicons name="lock-closed-outline" size={15} color="#6B7280" />
          <Text style={styles.readonlyBannerText}>Yoklama yalnızca bugün için kaydedilebilir.</Text>
        </View>
      )}
      {children.map((child) => {
        const color = avatarColor(child.first_name);
        const initials = `${child.first_name.charAt(0)}${child.last_name.charAt(0)}`.toUpperCase();
        const currentStatus = attendance[child.id];
        return (
          <View key={child.id} style={[styles.childCard, !isToday && styles.childCardReadonly]}>
            <View style={styles.childCardRow}>
              <View style={[styles.avatar, { backgroundColor: color }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.childCardName}>{child.full_name}</Text>
            </View>
            <View style={styles.statusButtons}>
              {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                const cfg = STATUS_CONFIG[status];
                const isSelected = currentStatus === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusBtn,
                      isSelected && { backgroundColor: cfg.bgColor, borderColor: cfg.color },
                    ]}
                    onPress={() => isToday && setAttendance((prev) => ({ ...prev, [child.id]: status }))}
                    activeOpacity={isToday ? 0.75 : 1}
                  >
                    <Text
                      style={[
                        styles.statusBtnText,
                        isSelected && { color: cfg.color, fontWeight: '700' },
                      ]}
                    >
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
      {isToday && (
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ── ReportsContent ───────────────────────────────────────────────────────────

function ReportsContent({
  classId,
  schoolId,
  children,
  selectedDate,
}: {
  classId: string;
  schoolId: number | null;
  children: ClassChild[];
  selectedDate: Date;
}) {
  const [reports, setReports] = useState<Record<number, DailyReport>>({});
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceStatus | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<ClassChild | null>(null);
  const [modalMood, setModalMood] = useState<MoodType | null>(null);
  const [modalAppetite, setModalAppetite] = useState<AppetiteType | null>(null);
  const [modalNotes, setModalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const isToday = formatDate(selectedDate) === formatDate(new Date());

  const fetchReports = useCallback(async () => {
    if (!schoolId) { return; }
    setLoading(true);
    setError(null);
    try {
      const dateStr = formatDate(selectedDate);
      const [reportsRes, attendanceRes] = await Promise.all([
        api.get<{ data: DailyReport[] }>(
          `/teacher/daily-reports?class_id=${classId}&date=${dateStr}&school_id=${schoolId}`
        ),
        api.get<{ data: AttendanceRecord[] }>(
          `/teacher/attendance?class_id=${classId}&date=${dateStr}`
        ),
      ]);
      const reportMap: Record<number, DailyReport> = {};
      for (const rep of reportsRes.data.data) {
        reportMap[rep.child_id] = rep;
      }
      setReports(reportMap);

      const attMap: Record<number, AttendanceStatus | null> = {};
      for (const rec of attendanceRes.data.data) {
        attMap[rec.child_id] = rec.is_recorded ? rec.status : null;
      }
      setAttendanceMap(attMap);
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [classId, schoolId, selectedDate]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const openModal = (child: ClassChild) => {
    const existing = reports[child.id];
    setSelectedChild(child);
    setModalMood((existing?.mood as MoodType) ?? null);
    setModalAppetite((existing?.appetite as AppetiteType) ?? null);
    setModalNotes(existing?.notes ?? '');
  };

  const handleSave = async () => {
    if (!selectedChild) { return; }
    setSaving(true);
    try {
      await api.post('/teacher/daily-reports', {
        child_id: selectedChild.id,
        class_id: Number(classId),
        school_id: schoolId,
        date: formatDate(selectedDate),
        mood: modalMood,
        appetite: modalAppetite,
        notes: modalNotes || null,
      });
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
      setSelectedChild(null);
      Alert.alert('Başarılı', 'Rapor kaydedildi.');
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <View style={styles.errorBox}>
        <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  return (
    <>
      <FlatList<ClassChild>
        data={children}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={!isToday ? (
          <View style={styles.readonlyBanner}>
            <Ionicons name="lock-closed-outline" size={15} color="#6B7280" />
            <Text style={styles.readonlyBannerText}>Rapor yalnızca bugün için kaydedilebilir.</Text>
          </View>
        ) : null}
        renderItem={({ item }) => {
          const report = reports[item.id];
          const hasReport = !!report;
          const color = avatarColor(item.first_name);
          const initials = `${item.first_name.charAt(0)}${item.last_name.charAt(0)}`.toUpperCase();
          const attStatus = attendanceMap[item.id];
          const canEdit = isToday && (attStatus === 'present' || attStatus === 'late');
          const attLabel = attStatus === null ? 'Yoklama Yok' : attStatus === 'absent' ? 'Gelmedi' : attStatus === 'excused' ? 'Mazeretli' : null;
          return (
            <TouchableOpacity
              style={[styles.childCard, !canEdit && styles.childCardDisabled]}
              onPress={() => canEdit && openModal(item)}
              activeOpacity={canEdit ? 0.75 : 1}
            >
              <View style={styles.childCardRow}>
                <View style={[styles.avatar, { backgroundColor: color }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childCardName}>{item.full_name}</Text>
                  {canEdit && hasReport && report.mood && (
                    <Text style={styles.reportPreview}>
                      {MOOD_OPTIONS.find((m) => m.value === report.mood)?.emoji}{' '}
                      {report.notes ? report.notes.substring(0, 30) + '...' : 'Rapor var'}
                    </Text>
                  )}
                  {!canEdit && attLabel && (
                    <Text style={styles.attDisabledLabel}>{attLabel}</Text>
                  )}
                </View>
                {canEdit && (
                  <View style={[styles.reportBadge, hasReport ? styles.reportBadgeExists : styles.reportBadgeEmpty]}>
                    <Text
                      style={[
                        styles.reportBadgeText,
                        hasReport ? styles.reportBadgeTextExists : styles.reportBadgeTextEmpty,
                      ]}
                    >
                      {hasReport ? 'Var' : 'Yok'}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={canEdit ? '#D1D5DB' : '#E5E7EB'} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Öğrenci bulunamadı</Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedChild}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedChild(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedChild?.full_name} — Rapor</Text>
            <TouchableOpacity onPress={() => setSelectedChild(null)}>
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
            onPress={handleSave}
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
    </>
  );
}

// ── ChildRow ─────────────────────────────────────────────────────────────────

function ChildRow({ child }: { child: ClassChild }) {
  const initials = `${child.first_name.charAt(0)}${child.last_name.charAt(0)}`.toUpperCase();
  const color = avatarColor(child.first_name);

  return (
    <TouchableOpacity
      style={styles.studentRow}
      onPress={() => router.push({ pathname: '/(teacher-app)/children/[childId]', params: { childId: String(child.id) } })}
      activeOpacity={0.75}
    >
      {child.profile_photo ? (
        <PrivateImage uri={child.profile_photo} style={styles.avatarPhoto} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.childInfo}>
        <Text style={styles.childCardName}>{child.full_name}</Text>
        <View style={styles.badgeRow}>
          {child.allergens.length > 0 && (
            <View style={styles.allergenBadge}>
              <Ionicons name="warning-outline" size={11} color="#D97706" />
              <Text style={styles.allergenBadgeText}>Alerjen</Text>
            </View>
          )}
          {child.medications.length > 0 && (
            <View style={styles.medicationBadge}>
              <Ionicons name="medical-outline" size={11} color="#7C3AED" />
              <Text style={styles.medicationBadgeText}>İlaç</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

// ── ClassDetailScreen ────────────────────────────────────────────────────────

export default function ClassDetailScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [children, setChildren] = useState<ClassChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) { setLoading(true); }
      setError(null);
      try {
        const [classRes, childrenRes] = await Promise.all([
          api.get<{ data: ClassDetail }>(`/teacher/classes/${classId}`),
          api.get<{ data: ClassChild[] }>(`/teacher/classes/${classId}/children`),
        ]);
        setClassDetail(classRes.data.data);
        setChildren(childrenRes.data.data);
      } catch (err: unknown) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [classId]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      </SafeAreaView>
    );
  }

  const TAB_LABELS: Record<TabType, string> = {
    students: 'Öğrenciler',
    attendance: 'Devamsızlık',
    reports: 'Raporlar',
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
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{classDetail?.name ?? 'Sınıf'}</Text>
          <Text style={styles.headerSub}>{classDetail?.school_name}</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {TAB_LABELS[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date picker (attendance and reports only) */}
      {activeTab !== 'students' && (
        <DatePickerBar date={selectedDate} onChange={setSelectedDate} />
      )}

      {/* Tab content */}
      {activeTab === 'students' && (
        <FlatList<ClassChild>
          data={children}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ChildRow child={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void fetchData(true); }}
              tintColor="#208AEF"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Öğrenci bulunamadı</Text>
            </View>
          }
        />
      )}

      {activeTab === 'attendance' && (
        <AttendanceContent
          classId={classId ?? ''}
          children={children}
          selectedDate={selectedDate}
        />
      )}

      {activeTab === 'reports' && (
        <ReportsContent
          classId={classId ?? ''}
          schoolId={classDetail?.school_id ?? null}
          children={children}
          selectedDate={selectedDate}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.surface,
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
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.onSurface,
  },
  headerSub: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
    marginTop: 1,
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
    color: AppColors.error,
    fontSize: 13,
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: AppColors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.onSurfaceVariant,
  },
  tabTextActive: {
    color: AppColors.white,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: AppColors.white,
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },
  studentRow: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: AppColors.onSurface,
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
  avatarPhoto: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  avatarText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  childInfo: {
    flex: 1,
    gap: 5,
  },
  childCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  allergenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.warningContainer,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  allergenBadgeText: {
    fontSize: 11,
    color: AppColors.warning,
    fontWeight: '600',
  },
  medicationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EDE9FE',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  medicationBadgeText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
  },
  childCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  childCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
    backgroundColor: AppColors.surfaceContainerLow,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.onSurfaceVariant,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  childCardDisabled: {
    opacity: 0.55,
    backgroundColor: AppColors.surfaceContainerLow,
  },
  childCardReadonly: {
    opacity: 0.7,
  },
  readonlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  readonlyBannerText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  attDisabledLabel: {
    fontSize: 12,
    color: AppColors.error,
    fontWeight: '600',
  },
  reportPreview: {
    fontSize: 12,
    color: AppColors.onSurfaceVariant,
  },
  reportBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  reportBadgeExists: {
    backgroundColor: AppColors.successContainer,
    borderColor: AppColors.success,
  },
  reportBadgeEmpty: {
    backgroundColor: AppColors.surfaceContainerLow,
    borderColor: AppColors.surfaceContainer,
  },
  reportBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reportBadgeTextExists: {
    color: AppColors.success,
  },
  reportBadgeTextEmpty: {
    color: AppColors.onSurfaceVariant,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.onSurfaceVariant,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.surface,
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
    color: AppColors.onSurface,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.onSurface,
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
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
    gap: 4,
  },
  moodBtnActive: {
    backgroundColor: AppColors.primaryContainer,
    borderColor: AppColors.primary,
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.onSurfaceVariant,
  },
  moodLabelActive: {
    color: AppColors.primary,
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
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
  },
  appetiteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.onSurfaceVariant,
  },
  notesInput: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: AppColors.onSurface,
    minHeight: 100,
  },
});
