import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { AppHeader } from '@/components/ui/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import api from '../../../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChildOption {
  id: number;
  full_name: string;
  school_name: string | null;
  class_id: number | null;
  class_name: string | null;
  class_color?: string | null;
  profile_photo?: string | null;
}

interface Allergen {
  id: number;
  name: string;
  risk_level: 'low' | 'medium' | 'high' | null;
}

interface Ingredient {
  id: number;
  name: string;
  allergens: Allergen[];
}

interface MealEntry {
  id: number;
  meal_id: number;
  schedule_type: string;
  meal: {
    id: number;
    name: string;
    meal_type: string | null;
    ingredients: Ingredient[];
  };
}

interface DayMenu {
  date: string;
  meals: MealEntry[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

function getDayName(dateStr: string): string {
  return TR_DAYS[new Date(dateStr + 'T00:00:00').getDay()];
}

function getDayNumber(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDate();
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

const MEAL_TYPE_CONFIG: Record<string, { icon: string; bg: string; color: string }> = {
  'Kahvaltı':    { icon: 'sunny-outline',       bg: '#FFF7ED', color: '#D97706' },
  'Öğle Yemeği': { icon: 'restaurant-outline',  bg: AppColors.primaryContainer, color: AppColors.primary },
  'Akşam Yemeği':{ icon: 'moon-outline',         bg: '#EDE9FE', color: '#7C3AED' },
  'Ara Öğün':    { icon: 'cafe-outline',         bg: '#DCFCE7', color: AppColors.success },
};

function getMealTypeConfig(type: string | null) {
  if (type && MEAL_TYPE_CONFIG[type]) { return MEAL_TYPE_CONFIG[type]; }
  return { icon: 'fast-food-outline', bg: AppColors.surfaceContainer, color: AppColors.onSurfaceVariant };
}

// ─── DayCard ─────────────────────────────────────────────────────────────────

function DayCard({ day, childName }: { day: DayMenu; childName: string }) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const today = isToday(day.date);

  const toggle = () => {
    Animated.timing(anim, {
      toValue: expanded ? 0 : 1,
      duration: 220,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const dayNumber = getDayNumber(day.date);
  const dayName = getDayName(day.date);
  const mealCount = day.meals.length;

  const allAllergens = day.meals.flatMap((e) =>
    e.meal.ingredients.flatMap((i) => i.allergens)
  );
  const hasAllergens = allAllergens.length > 0;

  return (
    <View style={[styles.dayCard, today && expanded && styles.dayCardActive]}>
      <TouchableOpacity style={styles.dayHeader} onPress={toggle} activeOpacity={0.75}>
        <View style={styles.dayHeaderLeft}>
          <View style={[styles.dateBox, today && styles.dateBoxToday]}>
            <Text style={[styles.dateNumber, today && styles.dateNumberToday]}>{dayNumber}</Text>
          </View>
          <View>
            <Text style={[styles.dayName, today && styles.dayNameToday]}>{dayName}</Text>
            <Text style={[styles.daySubText, today && styles.daySubToday]}>
              {today ? 'Bugünün Menüsü' : mealCount === 0 ? 'Menü girilmemiş' : `${mealCount} öğün`}
            </Text>
          </View>
        </View>
        <View style={[styles.chevronBox, today && styles.chevronBoxToday]}>
          <Animated.View
            style={{
              transform: [{
                rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
              }],
            }}
          >
            <Ionicons
              name="chevron-down"
              size={18}
              color={today ? AppColors.primary : AppColors.onSurfaceVariant}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.dayBody}>
          {hasAllergens && (
            <View style={styles.allergenWarning}>
              <Ionicons name="warning" size={18} color={AppColors.error} />
              <View style={styles.allergenWarningText}>
                <Text style={styles.allergenWarningTitle}>{childName} — Alerjen Uyarısı</Text>
                <Text style={styles.allergenWarningBody}>
                  {[...new Set(allAllergens.map((a) => a.name))].join(', ')}
                </Text>
              </View>
            </View>
          )}

          {mealCount === 0 ? (
            <Text style={styles.emptyDayText}>Bu gün için menü planlanmamış.</Text>
          ) : (
            <View style={styles.mealList}>
              {day.meals.map((entry) => {
                const cfg = getMealTypeConfig(entry.meal.meal_type);
                return (
                  <View key={entry.id} style={styles.mealItem}>
                    <View style={[styles.mealIcon, { backgroundColor: AppColors.primary }]}>
                      <Ionicons name={cfg.icon as any} size={22} color={'white'} />
                    </View>
                    <View style={styles.mealContent}>
                      <Text style={styles.mealTypeName}>
                        {entry.meal.meal_type ?? entry.meal.name}
                      </Text>
                      {entry.meal.ingredients.length > 0 ? (
                        <Text style={styles.mealIngredients} numberOfLines={3}>
                          {entry.meal.ingredients.map((i) => i.name).join(', ')}
                        </Text>
                      ) : (
                        <Text style={styles.mealIngredients}>Besin bilgisi yok</Text>
                      )}
                      {entry.meal.ingredients.some((i) => i.allergens.length > 0) && (
                        <View style={styles.allergenChips}>
                          {entry.meal.ingredients
                            .flatMap((i) => i.allergens)
                            .map((a) => (
                              <View key={a.id} style={styles.allergenChip}>
                                <Ionicons name="warning-outline" size={10} color="#D97706" />
                                <Text style={styles.allergenChipText}>{a.name}</Text>
                              </View>
                            ))}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Child Pills ─────────────────────────────────────────────────────────────

function ChildPills({
  children,
  selected,
  onSelect,
}: {
  children: ChildOption[];
  selected: ChildOption | null;
  onSelect: (c: ChildOption) => void;
}) {
  if (children.length <= 1) { return null; }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillsRow}
    >
      {children.map((c) => {
        const active = selected?.id === c.id;
        return (
          <TouchableOpacity
            key={c.id}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onSelect(c)}
            activeOpacity={0.7}
          >
            <Avatar
              name={c.full_name}
              size={32}
              shape="circle"
              color={c.class_color ?? undefined}
              uri={c.profile_photo ?? undefined}
            />
            <View style={styles.pillLabels}>
              {c.class_name ? (
                <Text style={[styles.pillSub, active && styles.pillSubActive]}>
                  {c.class_name}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Month Navigator ─────────────────────────────────────────────────────────

function MonthNav({
  year, month, onChange,
}: {
  year: number; month: number; onChange: (y: number, m: number) => void;
}) {
  const prev = () => {
    if (month === 1) { onChange(year - 1, 12); } else { onChange(year, month - 1); }
  };
  const next = () => {
    const now = new Date();
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) { return; }
    if (month === 12) { onChange(year + 1, 1); } else { onChange(year, month + 1); }
  };
  const atMax = (() => {
    const now = new Date();
    return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
  })();

  return (
    <View style={styles.monthNav}>
      <TouchableOpacity onPress={prev} style={styles.monthNavBtn} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={20} color={AppColors.primary} />
      </TouchableOpacity>
      <Text style={styles.monthNavLabel}>{TR_MONTHS[month - 1]} {year}</Text>
      <TouchableOpacity
        onPress={next}
        style={[styles.monthNavBtn, atMax && styles.monthNavBtnDisabled]}
        activeOpacity={0.7}
        disabled={atMax}
      >
        <Ionicons name="chevron-forward" size={20} color={atMax ? AppColors.surfaceContainer : AppColors.primary} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MealMenuScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [childOptions, setChildOptions] = useState<ChildOption[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildOption | null>(null);
  const [childrenLoaded, setChildrenLoaded] = useState(false);
  const [menuData, setMenuData] = useState<DayMenu[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);

  const loadChildren = useCallback(async () => {
    setLoadingChildren(true);
    try {
      const res = await api.get<{ data: ChildOption[] }>('/parent/meal-menus/children');
      const list = res.data.data ?? [];
      setChildOptions(list);
      if (list.length > 0 && !selectedChild) { setSelectedChild(list[0]); }
      setChildrenLoaded(true);
    } catch {
      setChildrenLoaded(true);
    } finally {
      setLoadingChildren(false);
    }
  }, [selectedChild]);

  const loadMenu = useCallback(async (childId: number, y: number, m: number) => {
    setLoadingMenu(true);
    try {
      const res = await api.get<{ data: DayMenu[] }>('/parent/meal-menus', {
        params: { child_id: childId, year: y, month: m },
      });
      setMenuData(res.data.data ?? []);
    } catch {
      setMenuData([]);
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!childrenLoaded) { void loadChildren(); }
    }, [childrenLoaded, loadChildren])
  );

  React.useEffect(() => {
    if (selectedChild) { void loadMenu(selectedChild.id, year, month); }
  }, [selectedChild, year, month, loadMenu]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loadingChildren) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <AppHeader title="Yemek Menüsü" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (childOptions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <AppHeader title="Yemek Menüsü" />
        <View style={styles.centered}>
          <Ionicons name="restaurant-outline" size={52} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Okula Kayıtlı Çocuk Yok</Text>
          <Text style={styles.emptySubtitle}>
            Yemek takvimini görüntülemek için çocuğunuzun bir okula kayıtlı olması gerekiyor.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const childSubtitle = selectedChild
    ? selectedChild.class_name
      ? `${selectedChild.class_name} · ${selectedChild.school_name ?? ''}`
      : selectedChild.school_name ?? ''
    : undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <AppHeader title="Yemek Menüsü" subtitle={childSubtitle} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ChildPills
          children={childOptions}
          selected={selectedChild}
          onSelect={(c) => setSelectedChild(c)}
        />

        <MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />

        {loadingMenu ? (
          <View style={styles.menuLoading}>
            <ActivityIndicator size="small" color={AppColors.primary} />
            <Text style={styles.menuLoadingText}>Menü yükleniyor...</Text>
          </View>
        ) : menuData.length === 0 ? (
          <View style={styles.emptyMenu}>
            <Ionicons name="calendar-outline" size={44} color="#D1D5DB" />
            <Text style={styles.emptyMenuTitle}>Bu ay için menü yok</Text>
            <Text style={styles.emptyMenuSub}>
              {TR_MONTHS[month - 1]} {year} ayı için yemek listesi henüz girilmemiş.
            </Text>
          </View>
        ) : (
          <View style={styles.dayList}>
            {menuData.map((day) => (
              <DayCard key={day.date} day={day} childName={selectedChild?.full_name ?? ''} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surfaceContainerLow },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },

  // Child pills
  pillsRow: { paddingHorizontal: 4, gap: 10, paddingBottom: 4, marginTop: 10, flexGrow: 1, justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: AppColors.surfaceContainer,
  },
  pillActive: { backgroundColor: AppColors.primary },
  pillLabels: { marginLeft: 8, alignItems: 'center', justifyContent: 'center', minHeight: 32 },
  pillText: { fontSize: 13, fontWeight: '700', color: AppColors.onSurfaceVariant },
  pillTextActive: { color: AppColors.white },
  pillSub: { fontSize: 14, fontWeight: '700', color: AppColors.onSurfaceVariant, marginTop: 1, opacity: 0.75 },
  pillSubActive: { color: AppColors.white, opacity: 0.85 },

  // Month nav
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavBtnDisabled: { opacity: 0.35 },
  monthNavLabel: { fontSize: 18, fontWeight: '800', color: AppColors.onSurface },

  // Day list
  dayList: { gap: 10 },

  // Day card
  dayCard: {
    backgroundColor: AppColors.white,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    padding: 7
  },
  dayCardActive: {
    borderWidth: 1.5,
    borderColor: AppColors.primaryContainer,
    shadowColor: AppColors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  // Date box
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: AppColors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBoxToday: {
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dateNumber: { fontSize: 20, fontWeight: '900', color: AppColors.primary },
  dateNumberToday: { color: AppColors.white },

  dayName: { fontSize: 16, fontWeight: '700', color: AppColors.onSurface },
  dayNameToday: { color: AppColors.primary },
  daySubText: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 2 },
  daySubToday: { color: `${AppColors.primary}99` },

  chevronBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AppColors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronBoxToday: { backgroundColor: `${AppColors.primary}18` },

  // Day body
  dayBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },

  // Allergen warning
  allergenWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 12,
  },
  allergenWarningText: { flex: 1 },
  allergenWarningTitle: { fontSize: 13, fontWeight: '700', color: AppColors.error },
  allergenWarningBody: { fontSize: 12, color: `${AppColors.error}CC`, marginTop: 2 },

  // Meal list
  mealList: { gap: 10 },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: AppColors.mealCartDetailBackground,
    borderRadius: 18,
    padding: 14,
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  mealContent: { flex: 1 },
  mealTypeName: { fontSize: 14, fontWeight: '800', color: AppColors.onSurface },
  mealIngredients: { fontSize: 13, color: AppColors.onSurfaceVariant, marginTop: 3, lineHeight: 18 },
  allergenChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.warningContainer,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  allergenChipText: { fontSize: 11, color: AppColors.warning, fontWeight: '600' },

  emptyDayText: { fontSize: 13, color: AppColors.onSurfaceVariant, paddingBottom: 4 },

  // Empty states
  emptyTitle: { fontSize: 17, fontWeight: '700', color: AppColors.onSurface, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: AppColors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  menuLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  menuLoadingText: { fontSize: 14, color: AppColors.onSurfaceVariant },
  emptyMenu: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyMenuTitle: { fontSize: 16, fontWeight: '700', color: AppColors.onSurface },
  emptyMenuSub: { fontSize: 13, color: AppColors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
});
