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
import api from '../../../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChildOption {
  id: number;
  full_name: string;
  school_name: string | null;
  class_id: number | null;
  class_name: string | null;
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

// ─── Turkish day names ────────────────────────────────────────────────────────

const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return TR_DAYS[d.getDay()];
}

// ─── Risk badge ───────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  high:   { bg: '#FEE2E2', text: '#DC2626', label: 'Yüksek' },
  medium: { bg: '#FEF3C7', text: '#D97706', label: 'Orta' },
  low:    { bg: '#DCFCE7', text: '#16A34A', label: 'Düşük' },
};

function RiskBadge({ level }: { level: Allergen['risk_level'] }) {
  const cfg = level ? RISK_CONFIG[level] : null;
  if (!cfg) { return null; }
  return (
    <View style={[styles.riskBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.riskBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Accordion day card ───────────────────────────────────────────────────────

function DayCard({ day }: { day: DayMenu }) {
  const [expanded, setExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(animation, {
      toValue,
      duration: 220,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const dayName = getDayName(day.date);
  const dateLabel = formatDate(day.date);
  const mealCount = day.meals.length;

  return (
    <View style={styles.dayCard}>
      <TouchableOpacity style={styles.dayHeader} onPress={toggle} activeOpacity={0.75}>
        <View style={styles.dayHeaderLeft}>
          <View style={styles.dayNameBadge}>
            <Text style={styles.dayNameText}>{dayName.slice(0, 3).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.dayDateText}>{dateLabel}</Text>
            <Text style={styles.daySubText}>
              {mealCount === 0 ? 'Menü girilmemiş' : `${mealCount} öğün`}
            </Text>
          </View>
        </View>
        <Animated.View
          style={{
            transform: [{
              rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
            }],
          }}
        >
          <Ionicons name="chevron-down" size={20} color={mealCount > 0 ? AppColors.primary : '#D1D5DB'} />
        </Animated.View>
      </TouchableOpacity>

      {expanded && mealCount > 0 && (
        <View style={styles.dayBody}>
          {day.meals.map((entry, idx) => (
            <View key={entry.id} style={[styles.mealBlock, idx > 0 && styles.mealBlockBorder]}>
              <View style={styles.mealHeader}>
                <Ionicons name="restaurant-outline" size={15} color={AppColors.primary} />
                <Text style={styles.mealName}>{entry.meal.name}</Text>
                {entry.meal.meal_type ? (
                  <View style={styles.mealTypeBadge}>
                    <Text style={styles.mealTypeText}>{entry.meal.meal_type}</Text>
                  </View>
                ) : null}
              </View>

              {entry.meal.ingredients.length > 0 ? (
                <View style={styles.ingredientList}>
                  {entry.meal.ingredients.map((ing) => (
                    <View key={ing.id} style={styles.ingredientRow}>
                      <View style={styles.ingredientDot} />
                      <Text style={styles.ingredientName}>{ing.name}</Text>
                      {ing.allergens.length > 0 && (
                        <View style={styles.allergenChips}>
                          {ing.allergens.map((a) => (
                            <View key={a.id} style={styles.allergenChip}>
                              <Ionicons name="warning-outline" size={10} color="#D97706" />
                              <Text style={styles.allergenChipText}>{a.name}</Text>
                              <RiskBadge level={a.risk_level} />
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noIngredient}>Besin öğesi bilgisi yok</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {expanded && mealCount === 0 && (
        <View style={styles.emptyDay}>
          <Text style={styles.emptyDayText}>Bu gün için menü planlanmamış.</Text>
        </View>
      )}
    </View>
  );
}

// ─── Child selector ───────────────────────────────────────────────────────────

function ChildSelector({
  children,
  selected,
  onSelect,
}: {
  children: ChildOption[];
  selected: ChildOption | null;
  onSelect: (c: ChildOption) => void;
}) {
  const [open, setOpen] = useState(false);

  if (children.length <= 1) { return null; }

  return (
    <View style={styles.selectorWrap}>
      <TouchableOpacity style={styles.selectorBtn} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <Ionicons name="people-outline" size={17} color={AppColors.primary} />
        <Text style={styles.selectorText} numberOfLines={1}>
          {selected?.full_name ?? 'Çocuk seçin'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#6B7280" />
      </TouchableOpacity>
      {open && (
        <View style={styles.selectorDropdown}>
          {children.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.selectorItem, selected?.id === c.id && styles.selectorItemActive]}
              onPress={() => { onSelect(c); setOpen(false); }}
              activeOpacity={0.75}
            >
              <Text style={[styles.selectorItemText, selected?.id === c.id && styles.selectorItemTextActive]}>
                {c.full_name}
              </Text>
              {c.class_name ? (
                <Text style={styles.selectorItemSub}>{c.class_name}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Month navigator ──────────────────────────────────────────────────────────

function MonthNav({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (y: number, m: number) => void;
}) {
  const prev = () => {
    if (month === 1) { onChange(year - 1, 12); } else { onChange(year, month - 1); }
  };
  const next = () => {
    const now = new Date();
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) { return; }
    if (month === 12) { onChange(year + 1, 1); } else { onChange(year, month + 1); }
  };
  const isCurrentOrFuture = (() => {
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
        style={[styles.monthNavBtn, isCurrentOrFuture && styles.monthNavBtnDisabled]}
        activeOpacity={0.7}
        disabled={isCurrentOrFuture}
      >
        <Ionicons name="chevron-forward" size={20} color={isCurrentOrFuture ? '#D1D5DB' : AppColors.primary} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

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

  // Çocukları yükle (tek seferlik)
  const loadChildren = useCallback(async () => {
    setLoadingChildren(true);
    try {
      const res = await api.get<{ data: ChildOption[] }>('/parent/meal-menus/children');
      const list = res.data.data ?? [];
      setChildOptions(list);
      if (list.length > 0 && !selectedChild) {
        setSelectedChild(list[0]);
      }
      setChildrenLoaded(true);
    } catch {
      setChildrenLoaded(true);
    } finally {
      setLoadingChildren(false);
    }
  }, [selectedChild]);

  // Yemek takvimini yükle
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

  // İlk yükleme
  useFocusEffect(
    useCallback(() => {
      if (!childrenLoaded) {
        void loadChildren();
      }
    }, [childrenLoaded, loadChildren])
  );

  // Çocuk veya ay değişince menüyü yenile
  React.useEffect(() => {
    if (selectedChild) {
      void loadMenu(selectedChild.id, year, month);
    }
  }, [selectedChild, year, month, loadMenu]);

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loadingChildren) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!loadingChildren && childOptions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Yemek Listesi</Text>
        </View>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yemek Listesi</Text>
        {selectedChild && (
          <Text style={styles.headerSub} numberOfLines={1}>
            {selectedChild.class_name
              ? `${selectedChild.class_name} · ${selectedChild.school_name ?? ''}`
              : selectedChild.school_name ?? ''}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Çocuk seçici — birden fazla çocuk varsa gösterilir */}
        <ChildSelector
          children={childOptions}
          selected={selectedChild}
          onSelect={(c) => setSelectedChild(c)}
        />

        {/* Ay navigasyonu */}
        <MonthNav year={year} month={month} onChange={handleMonthChange} />

        {/* Yemek listesi */}
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
              <DayCard key={day.date} day={day} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: AppColors.surface,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A2E' },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },

  // Child selector
  selectorWrap: { position: 'relative', zIndex: 10 },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  selectorText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1F2937' },
  selectorDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 4,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  selectorItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectorItemActive: { backgroundColor: '#EFF6FF' },
  selectorItemText: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  selectorItemTextActive: { color: AppColors.primary },
  selectorItemSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  // Month nav
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  monthNavBtn: { padding: 4 },
  monthNavBtnDisabled: { opacity: 0.35 },
  monthNavLabel: { fontSize: 16, fontWeight: '700', color: '#1F2937' },

  // Day list
  dayList: { gap: 8 },

  // Day card
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayNameBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNameText: { fontSize: 11, fontWeight: '800', color: AppColors.primary },
  dayDateText: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  daySubText: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },

  dayBody: { paddingHorizontal: 16, paddingBottom: 14 },
  emptyDay: { paddingHorizontal: 16, paddingBottom: 14 },
  emptyDayText: { fontSize: 13, color: '#9CA3AF' },

  // Meal block
  mealBlock: { paddingVertical: 10 },
  mealBlockBorder: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  mealHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  mealName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1F2937' },
  mealTypeBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mealTypeText: { fontSize: 11, fontWeight: '600', color: '#16A34A' },

  // Ingredients
  ingredientList: { gap: 6 },
  ingredientRow: { gap: 4 },
  ingredientDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: AppColors.primary,
    marginTop: 8,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  ingredientName: { fontSize: 13, color: '#4B5563', paddingLeft: 12 },
  allergenChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 12, marginTop: 4 },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  allergenChipText: { fontSize: 11, color: '#D97706', fontWeight: '600' },
  riskBadge: { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  riskBadgeText: { fontSize: 9, fontWeight: '700' },

  noIngredient: { fontSize: 12, color: '#9CA3AF', paddingLeft: 12 },

  // Empty states
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  menuLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  menuLoadingText: { fontSize: 14, color: '#9CA3AF' },
  emptyMenu: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyMenuTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptyMenuSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
