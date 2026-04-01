import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

import api from '../../../../lib/api';
import { getApiError } from '../../../../lib/auth';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface AttendanceChild {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface AttendanceRecord {
  child_id: number;
  status: AttendanceStatus;
}

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  present: { label: 'Geldi', color: '#059669', bgColor: '#D1FAE5', icon: 'checkmark-circle' },
  absent: { label: 'Gelmedi', color: '#DC2626', bgColor: '#FEE2E2', icon: 'close-circle' },
  late: { label: 'Geç', color: '#D97706', bgColor: '#FEF3C7', icon: 'time' },
  excused: { label: 'Mazeretli', color: '#7C3AED', bgColor: '#EDE9FE', icon: 'shield-checkmark' },
};

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

export default function AttendanceScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [children, setChildren] = useState<AttendanceChild[]>([]);
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (date: Date) => {
      setLoading(true);
      setError(null);
      try {
        const dateStr = formatDate(date);
        const [childrenRes, attendanceRes] = await Promise.all([
          api.get<{ data: AttendanceChild[] }>(`/teacher/classes/${classId}/children`),
          api.get<{ data: AttendanceRecord[] }>(
            `/teacher/attendance?class_id=${classId}&date=${dateStr}`
          ),
        ]);

        setChildren(childrenRes.data.data);

        const attendanceMap: Record<number, AttendanceStatus> = {};
        for (const rec of attendanceRes.data.data) {
          attendanceMap[rec.child_id] = rec.status;
        }
        setAttendance(attendanceMap);
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

  const setStatus = (childId: number, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [childId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const attendances: AttendanceRecord[] = children.map((child) => ({
        child_id: child.id,
        status: attendance[child.id] ?? 'absent',
      }));

      await api.post('/teacher/attendance', {
        class_id: Number(classId),
        date: formatDate(selectedDate),
        attendances,
      });

      Alert.alert('Başarılı', 'Yoklama kaydedildi.');
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
        <Text style={styles.headerTitle}>Yoklama</Text>
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
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {children.map((child) => {
            const initials = `${child.first_name.charAt(0)}${child.last_name.charAt(0)}`.toUpperCase();
            const color = avatarColor(child.first_name);
            const currentStatus = attendance[child.id];

            return (
              <View key={child.id} style={styles.childCard}>
                <View style={styles.childRow}>
                  <View style={[styles.avatar, { backgroundColor: color }]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <Text style={styles.childName}>{child.full_name}</Text>
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
                        onPress={() => setStatus(child.id, status)}
                        activeOpacity={0.75}
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
        </ScrollView>
      )}
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  childName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
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
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#208AEF',
    borderRadius: 14,
    paddingVertical: 16,
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
