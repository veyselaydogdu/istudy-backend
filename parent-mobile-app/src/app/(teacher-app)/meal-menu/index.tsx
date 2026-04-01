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

interface MealItem {
  id: number;
  name: string;
  meal_type: string;
  ingredients: string | null;
  allergen_warnings: Array<{
    child_name: string;
    allergen_name: string;
  }>;
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
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClassPicker, setShowClassPicker] = useState(false);

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
        const response = await api.get<{ data: MealItem[] }>(
          `/teacher/meal-menus?class_id=${cls.id}&date=${dateStr}`
        );
        setMeals(response.data.data);
      } catch (err: unknown) {
        setError(getApiError(err));
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

  // All allergen warnings across all meals
  const allWarnings = meals.flatMap((m) => m.allergen_warnings);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerSub}>Öğretmen</Text>
        <Text style={styles.headerTitle}>Yemek Listesi</Text>
      </View>

      {/* Class picker */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.classPicker}
          onPress={() => setShowClassPicker((v) => !v)}
          activeOpacity={0.75}
        >
          <Ionicons name="book-outline" size={16} color="#208AEF" />
          <Text style={styles.classPickerText}>
            {selectedClass ? selectedClass.name : 'Sınıf seçin'}
          </Text>
          <Ionicons name={showClassPicker ? 'chevron-up' : 'chevron-down'} size={16} color="#6B7280" />
        </TouchableOpacity>

        {showClassPicker && (
          <View style={styles.classDropdown}>
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                style={[
                  styles.classOption,
                  selectedClass?.id === cls.id && styles.classOptionActive,
                ]}
                onPress={() => {
                  setSelectedClass(cls);
                  setShowClassPicker(false);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.classOptionText,
                    selectedClass?.id === cls.id && styles.classOptionTextActive,
                  ]}
                >
                  {cls.name}
                </Text>
                <Text style={styles.classOptionSchool}>{cls.school_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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

      {/* Allergen warnings banner */}
      {allWarnings.length > 0 && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={18} color="#FFFFFF" />
          <View style={styles.warningContent}>
            {allWarnings.map((w, i) => (
              <Text key={i} style={styles.warningText}>
                {w.child_name}: {w.allergen_name} içeriyor
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
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealName}>{item.name}</Text>
                <View style={styles.mealTypeBadge}>
                  <Text style={styles.mealTypeText}>{item.meal_type}</Text>
                </View>
              </View>
              {item.ingredients && (
                <Text style={styles.mealIngredients}>{item.ingredients}</Text>
              )}
              {item.allergen_warnings.length > 0 && (
                <View style={styles.mealWarningRow}>
                  <Ionicons name="warning-outline" size={14} color="#D97706" />
                  <Text style={styles.mealWarningText}>
                    {item.allergen_warnings.length} öğrenci için alerjen uyarısı
                  </Text>
                </View>
              )}
            </View>
          )}
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
    backgroundColor: '#F5F8FF',
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
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 12,
    zIndex: 10,
  },
  classPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  classPickerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  classDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  classOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  classOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  classOptionTextActive: {
    color: '#208AEF',
  },
  classOptionSchool: {
    fontSize: 12,
    color: '#9CA3AF',
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    backgroundColor: '#EF4444',
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
    color: '#FFFFFF',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: '#1E3A5F',
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
    color: '#1F2937',
    flex: 1,
  },
  mealTypeBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mealTypeText: {
    fontSize: 11,
    color: '#208AEF',
    fontWeight: '600',
  },
  mealIngredients: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  mealWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mealWarningText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
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
    color: '#9CA3AF',
  },
});
