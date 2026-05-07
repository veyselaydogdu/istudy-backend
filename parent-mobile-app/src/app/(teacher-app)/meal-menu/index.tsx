import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

interface TeacherClass {
  id: number;
  name: string;
  school_name: string;
  school_id: number;
}

interface MealIngredient {
  name: string;
  allergens: Array<{ name: string; risk_level: string | null }>;
}

interface MealItem {
  id: number;
  name: string;
  meal_type: string;
  ingredients: MealIngredient[];
}

interface MealAlert {
  child_id: number;
  child_name: string;
  allergens: string[];
  warned_meals: string[];
}

interface MealMenuResponse {
  date: string;
  meals: MealItem[];
  alerts: MealAlert[];
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

export default function TeacherMealMenuScreen() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [alerts, setAlerts] = useState<MealAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await api.get<{ data: TeacherClass[] }>('/teacher/classes');
        setClasses(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedClass(response.data.data[0]);
        }
      } catch (err: unknown) {
        setError(getApiError(err));
      } finally {
        setClassesLoading(false);
      }
    })();
  }, []);

  const fetchMeals = useCallback(
    async (cls: TeacherClass | null, date: Date) => {
      if (!cls) { return; }
      setLoading(true);
      setError(null);
      try {
        const dateStr = formatDate(date);
        const response = await api.get<{ data: MealMenuResponse }>(
          `/teacher/meal-menus?class_id=${cls.id}&date=${dateStr}`
        );
        setMeals(response.data.data.meals);
        setAlerts(response.data.data.alerts);
      } catch (err: unknown) {
        setError(getApiError(err));
        setMeals([]);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchMeals(selectedClass, selectedDate);
  }, [selectedClass, selectedDate, fetchMeals]);

  const changeDate = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);
    setSelectedDate(newDate);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerSub}>Öğretmen</Text>
        <Text style={styles.headerTitle}>Yemek Listesi</Text>
      </View>

      {/* Class picker — yatay pill row */}
      {classes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classPills}
        >
          {classes.map((cls) => {
            const active = selectedClass?.id === cls.id;
            return (
              <TouchableOpacity
                key={cls.id}
                style={[styles.classPill, active && styles.classPillActive]}
                onPress={() => setSelectedClass(cls)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="book-outline"
                  size={14}
                  color={active ? AppColors.white : AppColors.primary}
                />
                <Text style={[styles.classPillText, active && styles.classPillTextActive]} numberOfLines={1}>
                  {cls.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

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

      {/* Allergen alerts banner */}
      {alerts.length > 0 && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={18} color="#FFFFFF" />
          <View style={styles.warningContent}>
            {alerts.map((a, i) => (
              <Text key={i} style={styles.warningText}>
                {a.child_name}: {a.warned_meals.join(', ')} içeriyor
              </Text>
            ))}
          </View>
        </View>
      )}

      {classesLoading || loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      ) : !selectedClass ? (
        <View style={styles.center}>
          <Ionicons name="book-outline" size={40} color="#D1D5DB" />
          <Text style={styles.placeholderText}>Yemek listesini görmek için sınıf seçin</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={40} color="#D1D5DB" />
          <Text style={styles.placeholderText}>Yemek listesi yüklenemedi</Text>
        </View>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const mealAlerts = alerts.filter((a) => a.warned_meals.includes(item.name));
            return (
              <View style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealName}>{item.name}</Text>
                  <View style={styles.mealTypeBadge}>
                    <Text style={styles.mealTypeText}>{item.meal_type}</Text>
                  </View>
                </View>
                {item.ingredients.length > 0 && (
                  <Text style={styles.mealIngredients}>
                    {item.ingredients.map((i) => i.name).join(', ')}
                  </Text>
                )}
                {mealAlerts.length > 0 && (
                  <View style={styles.mealWarningRow}>
                    <Ionicons name="warning-outline" size={14} color="#D97706" />
                    <Text style={styles.mealWarningText}>
                      {mealAlerts.length} öğrenci için alerjen uyarısı
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="restaurant-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Bu tarihte menü bulunamadı</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.surface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerSub: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: AppColors.onSurface,
  },
  classPills: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  classPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: AppColors.surfaceContainer,
  },
  classPillActive: {
    backgroundColor: AppColors.primary,
  },
  classPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.onSurfaceVariant,
    maxWidth: 120,
  },
  classPillTextActive: {
    color: AppColors.white,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    backgroundColor: AppColors.error,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  warningContent: {
    flex: 1,
    gap: 3,
  },
  warningText: {
    fontSize: 13,
    color: AppColors.white,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  mealCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.onSurface,
    flex: 1,
  },
  mealTypeBadge: {
    backgroundColor: AppColors.primaryContainer,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mealTypeText: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: '600',
  },
  mealIngredients: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
    lineHeight: 20,
  },
  mealWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mealWarningText: {
    fontSize: 12,
    color: AppColors.warning,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 14,
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 40,
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
});
