import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../_layout';
import api from '../../lib/api';
import { getApiError } from '../../lib/auth';

interface TeacherClass {
  id: number;
  name: string;
  school_name: string;
  student_count: number;
  color: string | null;
}

function getTodayString(): string {
  return new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function TeacherHomeScreen() {
  const { teacherUser } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await api.get<{ data: TeacherClass[] }>('/teacher/classes');
        setClasses(response.data.data);
      } catch (err: unknown) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fullName = teacherUser
    ? `${teacherUser.name} ${teacherUser.surname}`
    : 'Öğretmen';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hoş Geldiniz,</Text>
            <Text style={styles.userName}>{fullName}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {teacherUser?.name?.charAt(0).toUpperCase() ?? 'Ö'}
            </Text>
          </View>
        </View>

        {/* Date */}
        <View style={styles.dateCard}>
          <Ionicons name="calendar-outline" size={16} color="#208AEF" />
          <Text style={styles.dateText}>{getTodayString()}</Text>
        </View>

        {/* Quick action cards */}
        <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
        <View style={styles.cardsRow}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#EFF6FF' }]}
            onPress={() => router.push('/(teacher-app)/classes')}
            activeOpacity={0.75}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: '#208AEF' }]}>
              <Ionicons name="book" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.quickCardTitle}>Sınıflarım</Text>
            <Text style={styles.quickCardSub}>Sınıflarınızı görüntüleyin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#F0FDF4' }]}
            onPress={() => router.push('/(teacher-app)/daily')}
            activeOpacity={0.75}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: '#10B981' }]}>
              <Ionicons name="clipboard" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.quickCardTitle}>Günlük Raporlar</Text>
            <Text style={styles.quickCardSub}>Günlük durum takibi</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardsRow}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#FFFBEB' }]}
            onPress={() => router.push('/(teacher-app)/meal-menu')}
            activeOpacity={0.75}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="restaurant" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.quickCardTitle}>Yemek Listesi</Text>
            <Text style={styles.quickCardSub}>Günün menüsü</Text>
          </TouchableOpacity>

          <View style={styles.quickCardPlaceholder} />
        </View>

        {/* Classes summary */}
        <Text style={styles.sectionTitle}>Bugünün Yoklaması</Text>
        <View style={styles.attendanceSummary}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#208AEF" />
              <Text style={styles.loadingText}>Sınıflar yükleniyor...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : classes.length === 0 ? (
            <Text style={styles.emptyText}>Atanmış sınıf bulunamadı.</Text>
          ) : (
            classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                style={styles.classRow}
                onPress={() => router.push(`/(teacher-app)/classes/${cls.id}/attendance`)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.classColorDot,
                    { backgroundColor: cls.color ?? '#208AEF' },
                  ]}
                />
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classSchool}>{cls.school_name}</Text>
                </View>
                <View style={styles.classCountBadge}>
                  <Text style={styles.classCountText}>{cls.student_count} öğrenci</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#208AEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 24,
  },
  dateText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickCardPlaceholder: {
    flex: 1,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  quickCardSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  attendanceSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 4,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 12,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  classColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  classSchool: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  classCountBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  classCountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});
