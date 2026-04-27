import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../lib/api';
import { getApiError } from '../../lib/auth';

// ─── Tipler ─────────────────────────────────────────────────────────────────

interface TenantApproval {
  tenant_id: number;
  tenant_name: string;
  membership_status: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

// ─── Onay Durumu BottomSheet ──────────────────────────────────────────────────

function ApprovalBottomSheet({
  visible,
  title,
  approvals,
  loading,
  onClose,
}: {
  visible: boolean;
  title: string;
  approvals: TenantApproval[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={bsStyles.overlay}>
        <TouchableOpacity style={bsStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={bsStyles.sheet}>
          <View style={bsStyles.handle} />
          <View style={bsStyles.header}>
            <Text style={bsStyles.title} numberOfLines={2}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={AppColors.onSurface} />
            </TouchableOpacity>
          </View>
          <Text style={bsStyles.subtitle}>Kurumların onay durumu</Text>

          {loading ? (
            <View style={bsStyles.center}>
              <ActivityIndicator size="small" color={AppColors.primary} />
            </View>
          ) : approvals.length === 0 ? (
            <View style={bsStyles.center}>
              <Text style={bsStyles.emptyText}>Herhangi bir kuruma kayıtlı değilsiniz.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {approvals.map((item) => {
                const isApproved = item.status === 'approved';
                const isRejected = item.status === 'rejected';
                const statusColor = isApproved ? AppColors.success : isRejected ? AppColors.error : '#F59E0B';
                const statusBg = isApproved ? AppColors.successContainer : isRejected ? '#FEE2E2' : '#FEF3C7';
                const statusIcon: 'checkmark-circle' | 'close-circle' | 'time' = isApproved
                  ? 'checkmark-circle'
                  : isRejected
                  ? 'close-circle'
                  : 'time';
                const statusLabel = isApproved ? 'Onaylandı' : isRejected ? 'Reddedildi' : 'Henüz İncelenmedi';

                return (
                  <View key={item.tenant_id} style={bsStyles.row}>
                    <View style={[bsStyles.iconWrap, { backgroundColor: statusBg }]}>
                      <Ionicons name={statusIcon} size={22} color={statusColor} />
                    </View>
                    <View style={bsStyles.rowContent}>
                      <Text style={bsStyles.tenantName}>{item.tenant_name}</Text>
                      <View style={[bsStyles.badge, { backgroundColor: statusBg }]}>
                        <Text style={[bsStyles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                      {isRejected && item.rejection_reason ? (
                        <Text style={bsStyles.rejectionReason}>"{item.rejection_reason}"</Text>
                      ) : null}
                      {(isApproved || isRejected) && item.reviewed_by ? (
                        <Text style={bsStyles.reviewedBy}>
                          {item.reviewed_by}
                          {item.reviewed_at ? ` · ${new Date(item.reviewed_at).toLocaleDateString('tr-TR')}` : ''}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const bsStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.surfaceContainer,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: AppColors.onSurface },
  subtitle: { fontSize: 13, color: AppColors.onSurfaceVariant, marginBottom: 16 },
  center: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: AppColors.onSurfaceVariant },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainerLow,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: { flex: 1, gap: 4 },
  tenantName: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  rejectionReason: { fontSize: 13, color: AppColors.error, fontStyle: 'italic', marginTop: 2 },
  reviewedBy: { fontSize: 12, color: AppColors.onSurfaceVariant },
});

// ─── Esas Tipler ──────────────────────────────────────────────────────────────

interface BasicProfile {
  title?: string | null;
  bio?: string | null;
  education_summary?: string | null;
  specialization?: string | null;
  experience_years?: number | null;
  linkedin_url?: string | null;
  website_url?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
}

interface Education {
  id: number;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean;
  gpa?: number | null;
  description?: string | null;
  file_path?: string | null;
}

interface Certificate {
  id: number;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
  description?: string | null;
  status?: string;
  file_path?: string | null;
}

interface Course {
  id: number;
  title: string;
  type: string;
  provider: string;
  start_date: string;
  end_date?: string | null;
  duration_hours?: number | null;
  location?: string | null;
  is_online?: boolean;
  certificate_url?: string | null;
  description?: string | null;
  status?: string;
  file_path?: string | null;
}

interface Skill {
  id: number;
  name: string;
  level: string;
  category: string;
  proficiency?: number | null;
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function formatDate(dateStr?: string | null): string {
  if (!dateStr) { return ''; }
  const datePart = dateStr.slice(0, 10);
  const [year, month, day] = datePart.split('-');
  if (year && month && day) { return `${day}.${month}.${year}`; }
  if (year && month) { return `${month}.${year}`; }
  return dateStr;
}


const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const _currentYear = new Date().getFullYear();
const DP_YEARS = Array.from({ length: _currentYear - 1949 }, (_, i) => 1950 + i).reverse();

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function DatePickerField({
  label,
  value,
  onChange,
  placeholder,
  optional,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const parseValue = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return { year: y, month: m, day: d };
    }
    return { year: _currentYear - 5, month: 1, day: 1 };
  };

  const [pickerYear, setPickerYear] = useState(parseValue().year);
  const [pickerMonth, setPickerMonth] = useState(parseValue().month);
  const [pickerDay, setPickerDay] = useState(parseValue().day);

  const handleOpen = () => {
    const parsed = parseValue();
    setPickerYear(parsed.year);
    setPickerMonth(parsed.month);
    setPickerDay(parsed.day);
    setOpen(true);
  };

  const handleConfirm = () => {
    const maxDay = getDaysInMonth(pickerYear, pickerMonth);
    const safeDay = Math.min(pickerDay, maxDay);
    const mm = String(pickerMonth).padStart(2, '0');
    const dd = String(safeDay).padStart(2, '0');
    onChange(`${pickerYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  const maxDay = getDaysInMonth(pickerYear, pickerMonth);

  return (
    <View style={dpStyles.group}>
      <Text style={dpStyles.label}>{label}</Text>
      <TouchableOpacity style={dpStyles.trigger} onPress={handleOpen}>
        <Ionicons name="calendar-outline" size={16} color={AppColors.onSurfaceVariant} />
        <Text style={[dpStyles.triggerText, !value && dpStyles.triggerPlaceholder]}>
          {value ? formatDate(value) : (placeholder ?? 'Tarih seçin')}
        </Text>
        <Ionicons name="chevron-down" size={14} color={AppColors.onSurfaceVariant} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={dpStyles.overlay}>
          <View style={dpStyles.sheet}>
            <View style={dpStyles.handle} />
            <View style={dpStyles.sheetHeader}>
              <Text style={dpStyles.sheetTitle}>{label}</Text>
              {optional && (
                <TouchableOpacity onPress={handleClear}>
                  <Text style={dpStyles.clearBtn}>Temizle</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={dpStyles.columns}>
              {/* YIL */}
              <View style={dpStyles.colWrap}>
                <Text style={dpStyles.colLabel}>Yıl</Text>
                <ScrollView style={dpStyles.colScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {DP_YEARS.map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[dpStyles.colItem, pickerYear === y && dpStyles.colItemActive]}
                      onPress={() => setPickerYear(y)}
                      activeOpacity={0.7}
                    >
                      <Text style={[dpStyles.colItemText, pickerYear === y && dpStyles.colItemTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* AY */}
              <View style={dpStyles.colWrap}>
                <Text style={dpStyles.colLabel}>Ay</Text>
                <ScrollView style={dpStyles.colScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {MONTHS_TR.map((name, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[dpStyles.colItem, pickerMonth === idx + 1 && dpStyles.colItemActive]}
                      onPress={() => setPickerMonth(idx + 1)}
                      activeOpacity={0.7}
                    >
                      <Text style={[dpStyles.colItemText, pickerMonth === idx + 1 && dpStyles.colItemTextActive]}>{name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* GÜN */}
              <View style={dpStyles.colWrap}>
                <Text style={dpStyles.colLabel}>Gün</Text>
                <ScrollView style={dpStyles.colScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[dpStyles.colItem, pickerDay === d && dpStyles.colItemActive]}
                      onPress={() => setPickerDay(d)}
                      activeOpacity={0.7}
                    >
                      <Text style={[dpStyles.colItemText, pickerDay === d && dpStyles.colItemTextActive]}>
                        {String(d).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={dpStyles.preview}>
              <Text style={dpStyles.previewText}>
                Seçilen: {String(Math.min(pickerDay, maxDay)).padStart(2, '0')}.{String(pickerMonth).padStart(2, '0')}.{pickerYear}
              </Text>
            </View>

            <View style={dpStyles.sheetFooter}>
              <TouchableOpacity style={dpStyles.cancelBtn} onPress={() => setOpen(false)} activeOpacity={0.7}>
                <Text style={dpStyles.cancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dpStyles.confirmBtn} onPress={handleConfirm} activeOpacity={0.8}>
                <Text style={dpStyles.confirmText}>Tamam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const dpStyles = StyleSheet.create({
  group: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.onSurface, marginBottom: 6 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  triggerText: { flex: 1, fontSize: 14, color: AppColors.onSurface },
  triggerPlaceholder: { color: AppColors.onSurfaceVariant },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.surfaceContainer,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: AppColors.onSurface },
  clearBtn: { fontSize: 13, color: AppColors.error, fontWeight: '600' },
  columns: { flexDirection: 'row', gap: 8 },
  colWrap: { flex: 1, alignItems: 'center', gap: 6 },
  colLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colScroll: {
    height: 180,
    width: '100%',
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
    borderRadius: 10,
  },
  colItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainerLow,
  },
  colItemActive: { backgroundColor: AppColors.primaryContainer },
  colItemText: { fontSize: 14, color: AppColors.onSurface },
  colItemTextActive: { color: AppColors.primary, fontWeight: '700' },
  preview: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: AppColors.infoContainer,
    borderRadius: 10,
  },
  previewText: { fontSize: 15, fontWeight: '600', color: AppColors.primary },
  sheetFooter: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: AppColors.onSurface },
  confirmBtn: {
    flex: 2,
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ─── Sabitler ────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'male', label: 'Erkek' },
  { value: 'female', label: 'Kadın' },
  { value: 'other', label: 'Diğer' },
  { value: 'prefer_not_to_say', label: 'Belirtmek İstemiyorum' },
];

const SKILL_LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Başlangıç' },
  { value: 'intermediate', label: 'Orta' },
  { value: 'advanced', label: 'İleri' },
  { value: 'expert', label: 'Uzman' },
];

const SKILL_CATEGORY_OPTIONS = [
  { value: 'language', label: 'Dil' },
  { value: 'technology', label: 'Teknoloji' },
  { value: 'pedagogy', label: 'Pedagoji' },
  { value: 'art', label: 'Sanat' },
  { value: 'sport', label: 'Spor' },
  { value: 'music', label: 'Müzik' },
  { value: 'science', label: 'Bilim' },
  { value: 'other', label: 'Diğer' },
];

const COURSE_TYPE_OPTIONS = [
  { value: 'course', label: 'Kurs' },
  { value: 'seminar', label: 'Seminer' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'conference', label: 'Konferans' },
  { value: 'training', label: 'Eğitim' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'other', label: 'Diğer' },
];

const DEGREE_OPTIONS = [
  { value: 'high_school', label: 'Lise' },
  { value: 'associate', label: 'Ön Lisans' },
  { value: 'bachelor', label: 'Lisans' },
  { value: 'master', label: 'Yüksek Lisans' },
  { value: 'phd', label: 'Doktora' },
  { value: 'certificate', label: 'Sertifika' },
  { value: 'other', label: 'Diğer' },
];

// ─── Yardımcı Bileşenler ─────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'url' | 'email-address';
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={AppColors.onSurfaceVariant}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
      />
    </View>
  );
}

function SelectField({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  const selected = options.find(o => o.value === value);
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.selectRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.selectChip, value === opt.value && styles.selectChipActive]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.selectChipText, value === opt.value && styles.selectChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const [activeTab, setActiveTab] = useState<'basic' | 'education' | 'certificates' | 'courses' | 'skills'>('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Temel profil
  const [basic, setBasic] = useState<BasicProfile>({});

  // Listeler
  const [educations, setEducations] = useState<Education[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Modal state'leri
  const [eduModal, setEduModal] = useState(false);
  const [certModal, setCertModal] = useState(false);
  const [courseModal, setCourseModal] = useState(false);
  const [skillModal, setSkillModal] = useState(false);

  // Onay durumu bottomsheet
  const [approvalSheet, setApprovalSheet] = useState<{
    visible: boolean;
    title: string;
    type: 'certificate' | 'course' | 'education';
    id: number;
  } | null>(null);
  const [approvals, setApprovals] = useState<TenantApproval[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  // Belge seçimi (yeni kayıt için)
  const [eduDocument, setEduDocument] = useState<{ uri: string; name: string; mimeType: string; base64: string } | null>(null);
  const [certDocument, setCertDocument] = useState<{ uri: string; name: string; mimeType: string; base64: string } | null>(null);
  const [courseDocument, setCourseDocument] = useState<{ uri: string; name: string; mimeType: string; base64: string } | null>(null);

  // Form state'leri
  const [eduForm, setEduForm] = useState<Partial<Education>>({});
  const [certForm, setCertForm] = useState<Partial<Certificate>>({});
  const [courseForm, setCourseForm] = useState<Partial<Course>>({ type: 'course', is_online: false });
  const [skillForm, setSkillForm] = useState<Partial<Skill>>({ level: 'beginner', category: 'other' });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  // ─── Veri yükleme ────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, eduRes, certRes, courseRes, skillRes] = await Promise.all([
        api.get('/teacher/profile'),
        api.get('/teacher/profile/educations?per_page=50'),
        api.get('/teacher/profile/certificates?per_page=50'),
        api.get('/teacher/profile/courses?per_page=50'),
        api.get('/teacher/profile/skills'),
      ]);

      const p = profileRes.data?.data ?? {};
      setBasic({
        title: p.title ?? '',
        bio: p.bio ?? '',
        education_summary: p.education_summary ?? '',
        specialization: p.specialization ?? '',
        experience_years: p.experience_years ?? null,
        linkedin_url: p.linkedin_url ?? '',
        website_url: p.website_url ?? '',
        gender: p.gender ?? '',
        date_of_birth: p.date_of_birth ?? '',
      });

      setEducations(eduRes.data?.data ?? []);
      setCertificates(certRes.data?.data ?? []);
      setCourses(courseRes.data?.data ?? []);
      setSkills(skillRes.data?.data ?? []);
    } catch {
      Alert.alert('Hata', 'Profil bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Temel profil kaydetme ────────────────────────────────────────────────

  const saveBasicProfile = async () => {
    setSaving(true);
    try {
      await api.put('/teacher/profile', {
        title: basic.title || null,
        bio: basic.bio || null,
        education_summary: basic.education_summary || null,
        specialization: basic.specialization || null,
        experience_years: basic.experience_years ?? null,
        linkedin_url: basic.linkedin_url || null,
        website_url: basic.website_url || null,
        gender: basic.gender || null,
        date_of_birth: basic.date_of_birth || null,
      });
      Alert.alert('Başarılı', 'Profil bilgileri güncellendi.');
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err) ?? 'Profil güncellenemedi.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Eğitim CRUD ─────────────────────────────────────────────────────────

  const ALLOWED_MIME_TYPES = ['image/heic', 'image/heif', 'image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];

  const pickDocument = async (onPicked: (doc: { uri: string; name: string; mimeType: string; base64: string }) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri erişim izni gereklidir.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 1,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const mime = (asset.mimeType ?? 'image/jpeg').toLowerCase();
      if (!ALLOWED_MIME_TYPES.includes(mime)) {
        Alert.alert('Desteklenmeyen Format', 'Lütfen HEIC, PNG, JPG, JPEG veya BMP formatında bir görsel seçin.');
        return;
      }

      // HEIC/HEIF: backend GD kütüphanesi desteklemez, frontend'de JPEG'e çevir
      const isHeic = mime === 'image/heic' || mime === 'image/heif';
      if (isHeic) {
        const converted = await ImageManipulator.manipulateAsync(
          asset.uri,
          [],
          { format: ImageManipulator.SaveFormat.JPEG, base64: true, compress: 0.9 },
        );
        if (!converted.base64) {
          Alert.alert('Hata', 'HEIC görsel dönüştürülemedi. Lütfen tekrar deneyin.');
          return;
        }
        onPicked({ uri: converted.uri, name: `photo_${Date.now()}.jpg`, mimeType: 'image/jpeg', base64: converted.base64 });
        return;
      }

      if (!asset.base64) {
        Alert.alert('Hata', 'Görsel okunamadı. Lütfen tekrar deneyin.');
        return;
      }
      const ext = mime.split('/')[1] ?? 'jpg';
      onPicked({ uri: asset.uri, name: `photo_${Date.now()}.${ext}`, mimeType: mime, base64: asset.base64 });
    }
  };

  const uploadDocument = async (type: 'educations' | 'courses' | 'certificates', id: number, doc: { uri: string; name: string; mimeType: string; base64: string }) => {
    await api.post(`/teacher/profile/${type}/${id}/document`, {
      photo: doc.base64,
      mime_type: doc.mimeType,
    });
  };

  const openEduModal = (edu?: Education) => {
    if (edu) {
      setEduForm({ ...edu });
      setEditingId(edu.id);
    } else {
      setEduForm({ degree: 'bachelor' });
      setEditingId(null);
    }
    setEduDocument(null);
    setEduModal(true);
  };

  const saveEducation = async () => {
    if (!eduForm.institution || !eduForm.degree || !eduForm.field_of_study || !eduForm.start_date) {
      Alert.alert('Hata', 'Okul, derece, alan ve başlangıç tarihi zorunludur.');
      return;
    }
    if (eduForm.end_date && eduForm.end_date <= eduForm.start_date) {
      Alert.alert('Hata', 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır.');
      return;
    }
    // Yeni kayıt için belge zorunlu
    if (!editingId && !eduDocument) {
      Alert.alert('Belge Gerekli', 'Eğitim kaydı eklemek için belge (PDF veya görsel) yüklemeniz zorunludur.');
      return;
    }
    setModalSaving(true);
    try {
      if (editingId) {
        await api.put(`/teacher/profile/educations/${editingId}`, eduForm);
        if (eduDocument && !eduForm.file_path) {
          await uploadDocument('educations', editingId, eduDocument);
        }
      } else {
        const res = await api.post('/teacher/profile/educations', eduForm);
        const newId = res.data?.data?.id;
        if (newId && eduDocument) {
          try {
            await uploadDocument('educations', newId, eduDocument);
          } catch (uploadErr: unknown) {
            await api.delete(`/teacher/profile/educations/${newId}`).catch(() => null);
            Alert.alert('Hata', getApiError(uploadErr));
            setModalSaving(false);
            return;
          }
        }
      }
      setEduModal(false);
      fetchAll();
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err) ?? 'Kaydedilemedi.');
    } finally {
      setModalSaving(false);
    }
  };

  const deleteEducation = (id: number) => {
    Alert.alert('Sil', 'Bu eğitim kaydını silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/teacher/profile/educations/${id}`);
            fetchAll();
          } catch {
            Alert.alert('Hata', 'Silinemedi.');
          }
        },
      },
    ]);
  };

  // ─── Sertifika CRUD ──────────────────────────────────────────────────────

  const openCertModal = (cert?: Certificate) => {
    if (cert) {
      setCertForm({ ...cert });
      setEditingId(cert.id);
    } else {
      setCertForm({});
      setEditingId(null);
    }
    setCertDocument(null);
    setCertModal(true);
  };

  const saveCertificate = async () => {
    if (!certForm.name || !certForm.issuing_organization || !certForm.issue_date) {
      Alert.alert('Hata', 'Sertifika adı, veren kuruluş ve tarih zorunludur.');
      return;
    }
    setModalSaving(true);
    try {
      if (editingId) {
        await api.put(`/teacher/profile/certificates/${editingId}`, certForm);
        if (certDocument && !certForm.file_path) {
          await uploadDocument('certificates', editingId, certDocument);
        }
      } else {
        const res = await api.post('/teacher/profile/certificates', certForm);
        const newId = res.data?.data?.id;
        if (newId && certDocument) {
          try {
            await uploadDocument('certificates', newId, certDocument);
          } catch (uploadErr: unknown) {
            await api.delete(`/teacher/profile/certificates/${newId}`).catch(() => null);
            Alert.alert('Hata', getApiError(uploadErr));
            setModalSaving(false);
            return;
          }
        }
      }
      setCertModal(false);
      fetchAll();
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err) ?? 'Kaydedilemedi.');
    } finally {
      setModalSaving(false);
    }
  };

  const deleteCertificate = (id: number) => {
    Alert.alert('Sil', 'Bu sertifikayı silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/teacher/profile/certificates/${id}`);
            fetchAll();
          } catch {
            Alert.alert('Hata', 'Silinemedi.');
          }
        },
      },
    ]);
  };

  // ─── Kurs CRUD ───────────────────────────────────────────────────────────

  const openCourseModal = (course?: Course) => {
    if (course) {
      setCourseForm({ ...course });
      setEditingId(course.id);
    } else {
      setCourseForm({ type: 'course', is_online: false });
      setEditingId(null);
    }
    setCourseDocument(null);
    setCourseModal(true);
  };

  const saveCourse = async () => {
    if (!courseForm.title || !courseForm.provider || !courseForm.start_date) {
      Alert.alert('Hata', 'Başlık, sağlayıcı ve başlangıç tarihi zorunludur.');
      return;
    }
    if (!editingId && !courseDocument) {
      Alert.alert('Belge Gerekli', 'Kurs/Seminer eklemek için belge (PDF veya görsel) yüklemeniz zorunludur.');
      return;
    }
    setModalSaving(true);
    try {
      if (editingId) {
        await api.put(`/teacher/profile/courses/${editingId}`, courseForm);
        if (courseDocument && !courseForm.file_path) {
          await uploadDocument('courses', editingId, courseDocument);
        }
      } else {
        const res = await api.post('/teacher/profile/courses', courseForm);
        const newId = res.data?.data?.id;
        if (newId && courseDocument) {
          try {
            await uploadDocument('courses', newId, courseDocument);
          } catch (uploadErr: unknown) {
            await api.delete(`/teacher/profile/courses/${newId}`).catch(() => null);
            Alert.alert('Hata', getApiError(uploadErr));
            setModalSaving(false);
            return;
          }
        }
      }
      setCourseModal(false);
      fetchAll();
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err) ?? 'Kaydedilemedi.');
    } finally {
      setModalSaving(false);
    }
  };

  const deleteCourse = (id: number) => {
    Alert.alert('Sil', 'Bu kursu silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/teacher/profile/courses/${id}`);
            fetchAll();
          } catch {
            Alert.alert('Hata', 'Silinemedi.');
          }
        },
      },
    ]);
  };

  // ─── Onay Durumu ─────────────────────────────────────────────────────────

  const openApprovalSheet = async (type: 'certificate' | 'course' | 'education', id: number, title: string) => {
    setApprovals([]);
    setApprovalSheet({ visible: true, title, type, id });
    setApprovalsLoading(true);
    try {
      const pathMap = { certificate: 'certificates', course: 'courses', education: 'educations' };
      const res = await api.get<{ data: TenantApproval[] }>(`/teacher/profile/${pathMap[type]}/${id}/approvals`);
      setApprovals(res.data.data ?? []);
    } catch {
      // Hata durumunda boş liste
    } finally {
      setApprovalsLoading(false);
    }
  };

  // ─── Yetenek CRUD ────────────────────────────────────────────────────────

  const openSkillModal = (skill?: Skill) => {
    if (skill) {
      setSkillForm({ ...skill });
      setEditingId(skill.id);
    } else {
      setSkillForm({ level: 'beginner', category: 'other' });
      setEditingId(null);
    }
    setSkillModal(true);
  };

  const saveSkill = async () => {
    if (!skillForm.name || !skillForm.level || !skillForm.category) {
      Alert.alert('Hata', 'İsim, seviye ve kategori zorunludur.');
      return;
    }
    setModalSaving(true);
    try {
      if (editingId) {
        await api.put(`/teacher/profile/skills/${editingId}`, skillForm);
      } else {
        await api.post('/teacher/profile/skills', skillForm);
      }
      setSkillModal(false);
      fetchAll();
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err) ?? 'Kaydedilemedi.');
    } finally {
      setModalSaving(false);
    }
  };

  const deleteSkill = (id: number) => {
    Alert.alert('Sil', 'Bu yeteneği silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/teacher/profile/skills/${id}`);
            fetchAll();
          } catch {
            Alert.alert('Hata', 'Silinemedi.');
          }
        },
      },
    ]);
  };

  // ─── Tab içerikleri ──────────────────────────────────────────────────────

  const renderBasicTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <FormField
        label="Ünvan"
        value={basic.title ?? ''}
        onChangeText={v => setBasic(b => ({ ...b, title: v }))}
        placeholder="Ör: Anaokulu Öğretmeni"
      />
      <FormField
        label="Uzmanlık Alanı"
        value={basic.specialization ?? ''}
        onChangeText={v => setBasic(b => ({ ...b, specialization: v }))}
        placeholder="Ör: Erken Çocukluk Eğitimi"
      />
      <FormField
        label="Deneyim (Yıl)"
        value={basic.experience_years != null ? String(basic.experience_years) : ''}
        onChangeText={v => setBasic(b => ({ ...b, experience_years: v ? parseInt(v) : null }))}
        keyboardType="numeric"
        placeholder="Ör: 5"
      />
      <FormField
        label="Biyografi"
        value={basic.bio ?? ''}
        onChangeText={v => setBasic(b => ({ ...b, bio: v }))}
        multiline
        placeholder="Kendinizi kısaca tanıtın..."
      />
      <FormField
        label="Eğitim Özeti"
        value={basic.education_summary ?? ''}
        onChangeText={v => setBasic(b => ({ ...b, education_summary: v }))}
        multiline
        placeholder="Eğitim geçmişinizin özeti..."
      />
      <SelectField
        label="Cinsiyet"
        value={basic.gender ?? ''}
        options={GENDER_OPTIONS}
        onSelect={v => setBasic(b => ({ ...b, gender: v }))}
      />
      <DatePickerField
        label="Doğum Tarihi"
        value={basic.date_of_birth}
        onChange={v => setBasic(b => ({ ...b, date_of_birth: v }))}
        optional
      />
      <FormField
        label="LinkedIn URL"
        value={basic.linkedin_url ?? ''}
        onChangeText={v => setBasic(b => ({ ...b, linkedin_url: v }))}
        keyboardType="url"
        placeholder="https://linkedin.com/in/..."
      />
      <FormField
        label="Web Sitesi"
        value={basic.website_url ?? ''}
        onChangeText={v => setBasic(b => ({ ...b, website_url: v }))}
        keyboardType="url"
        placeholder="https://..."
      />

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={saveBasicProfile}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.saveBtnText}>Kaydet</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );

  const renderEducationTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.addBtn} onPress={() => openEduModal()}>
        <Ionicons name="add-circle-outline" size={20} color={AppColors.primary} />
        <Text style={styles.addBtnText}>Eğitim Ekle</Text>
      </TouchableOpacity>

      {educations.length === 0 && (
        <Text style={styles.emptyText}>Henüz eğitim bilgisi eklenmemiş.</Text>
      )}

      {educations.map(edu => (
        <View key={edu.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="school-outline" size={20} color={AppColors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{edu.institution}</Text>
              <Text style={styles.cardSub}>{DEGREE_OPTIONS.find(d => d.value === edu.degree)?.label ?? edu.degree} — {edu.field_of_study}</Text>
              <Text style={styles.cardDate}>
                {formatDate(edu.start_date)} — {edu.is_current ? 'Devam Ediyor' : (edu.end_date ? formatDate(edu.end_date) : '?')}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => openApprovalSheet('education', edu.id, edu.institution)}
              >
                <Ionicons name="people-outline" size={18} color="#8b5cf6" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => openEduModal(edu)}>
                <Ionicons name="pencil-outline" size={18} color={AppColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => deleteEducation(edu.id)}>
                <Ionicons name="trash-outline" size={18} color={AppColors.error} />
              </TouchableOpacity>
            </View>
          </View>
          {edu.description ? (
            <Text style={styles.cardDesc}>{edu.description}</Text>
          ) : null}
          {edu.file_path ? (
            <View style={styles.docBadge}>
              <Ionicons name="document-attach-outline" size={13} color={AppColors.primary} />
              <Text style={styles.docBadgeText}>Belge yüklendi</Text>
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );

  const renderCertificatesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.addBtn} onPress={() => openCertModal()}>
        <Ionicons name="add-circle-outline" size={20} color={AppColors.primary} />
        <Text style={styles.addBtnText}>Sertifika Ekle</Text>
      </TouchableOpacity>

      {certificates.length === 0 && (
        <Text style={styles.emptyText}>Henüz sertifika eklenmemiş.</Text>
      )}

      {certificates.map(cert => (
        <View key={cert.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="ribbon-outline" size={20} color="#f59e0b" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{cert.name}</Text>
              <Text style={styles.cardSub}>{cert.issuing_organization}</Text>
              <Text style={styles.cardDate}>{formatDate(cert.issue_date)}{cert.expiry_date ? ` — ${formatDate(cert.expiry_date)}` : ''}</Text>
              {cert.status && cert.status !== 'approved' && (
                <View style={[styles.statusBadge, cert.status === 'pending' && styles.statusPending]}>
                  <Text style={styles.statusBadgeText}>
                    {cert.status === 'pending' ? 'Onay Bekliyor' : cert.status}
                  </Text>
                </View>
              )}
              {cert.file_path ? (
                <View style={styles.docBadge}>
                  <Ionicons name="document-attach-outline" size={13} color={AppColors.primary} />
                  <Text style={styles.docBadgeText}>Belge yüklendi</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => openApprovalSheet('certificate', cert.id, cert.name)}
              >
                <Ionicons name="people-outline" size={18} color="#8b5cf6" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => openCertModal(cert)}>
                <Ionicons name="pencil-outline" size={18} color={AppColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => deleteCertificate(cert.id)}>
                <Ionicons name="trash-outline" size={18} color={AppColors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderCoursesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.addBtn} onPress={() => openCourseModal()}>
        <Ionicons name="add-circle-outline" size={20} color={AppColors.primary} />
        <Text style={styles.addBtnText}>Kurs / Seminer Ekle</Text>
      </TouchableOpacity>

      {courses.length === 0 && (
        <Text style={styles.emptyText}>Henüz kurs veya seminer eklenmemiş.</Text>
      )}

      {courses.map(course => (
        <View key={course.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="library-outline" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{course.title}</Text>
              <Text style={styles.cardSub}>
                {COURSE_TYPE_OPTIONS.find(t => t.value === course.type)?.label ?? course.type} — {course.provider}
              </Text>
              <Text style={styles.cardDate}>
                {formatDate(course.start_date)}{course.end_date ? ` — ${formatDate(course.end_date)}` : ''}
                {course.duration_hours ? ` (${course.duration_hours} saat)` : ''}
              </Text>
              {course.is_online && (
                <Text style={styles.onlineBadge}>Çevrimiçi</Text>
              )}
              {course.status && course.status !== 'approved' && (
                <View style={[styles.statusBadge, course.status === 'pending' && styles.statusPending]}>
                  <Text style={styles.statusBadgeText}>
                    {course.status === 'pending' ? 'Onay Bekliyor' : course.status}
                  </Text>
                </View>
              )}
              {course.file_path ? (
                <View style={styles.docBadge}>
                  <Ionicons name="document-attach-outline" size={13} color={AppColors.primary} />
                  <Text style={styles.docBadgeText}>Belge yüklendi</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => openApprovalSheet('course', course.id, course.title)}
              >
                <Ionicons name="people-outline" size={18} color="#8b5cf6" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => openCourseModal(course)}>
                <Ionicons name="pencil-outline" size={18} color={AppColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => deleteCourse(course.id)}>
                <Ionicons name="trash-outline" size={18} color={AppColors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderSkillsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.addBtn} onPress={() => openSkillModal()}>
        <Ionicons name="add-circle-outline" size={20} color={AppColors.primary} />
        <Text style={styles.addBtnText}>Yetenek Ekle</Text>
      </TouchableOpacity>

      {skills.length === 0 && (
        <Text style={styles.emptyText}>Henüz yetenek eklenmemiş.</Text>
      )}

      <View style={styles.skillsGrid}>
        {skills.map(skill => (
          <View key={skill.id} style={styles.skillCard}>
            <Text style={styles.skillName}>{skill.name}</Text>
            <Text style={styles.skillMeta}>
              {SKILL_CATEGORY_OPTIONS.find(c => c.value === skill.category)?.label ?? skill.category}
            </Text>
            <Text style={styles.skillLevel}>
              {SKILL_LEVEL_OPTIONS.find(l => l.value === skill.level)?.label ?? skill.level}
            </Text>
            {skill.proficiency != null && (
              <View style={styles.proficiencyBar}>
                <View style={[styles.proficiencyFill, { width: `${skill.proficiency}%` as any }]} />
              </View>
            )}
            <View style={styles.skillActions}>
              <TouchableOpacity onPress={() => openSkillModal(skill)}>
                <Ionicons name="pencil-outline" size={16} color={AppColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteSkill(skill.id)}>
                <Ionicons name="trash-outline" size={16} color={AppColors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={AppColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Üst bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={AppColors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {([
          { key: 'basic', label: 'Genel', icon: 'person-outline' },
          { key: 'education', label: 'Eğitim', icon: 'school-outline' },
          { key: 'certificates', label: 'Sertifika', icon: 'ribbon-outline' },
          { key: 'courses', label: 'Kurs/Seminer', icon: 'library-outline' },
          { key: 'skills', label: 'Yetenekler', icon: 'star-outline' },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? AppColors.primary : AppColors.onSurfaceVariant}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* İçerik */}
      {activeTab === 'basic' && renderBasicTab()}
      {activeTab === 'education' && renderEducationTab()}
      {activeTab === 'certificates' && renderCertificatesTab()}
      {activeTab === 'courses' && renderCoursesTab()}
      {activeTab === 'skills' && renderSkillsTab()}

      {/* ─── Eğitim Modal ─── */}
      <Modal visible={eduModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Eğitimi Düzenle' : 'Eğitim Ekle'}</Text>
            <TouchableOpacity onPress={() => setEduModal(false)}>
              <Ionicons name="close" size={24} color={AppColors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <FormField
              label="Okul / Üniversite *"
              value={eduForm.institution ?? ''}
              onChangeText={v => setEduForm(f => ({ ...f, institution: v }))}
            />
            <SelectField
              label="Derece *"
              value={eduForm.degree ?? 'bachelor'}
              options={DEGREE_OPTIONS}
              onSelect={v => setEduForm(f => ({ ...f, degree: v }))}
            />
            <FormField
              label="Alan / Bölüm *"
              value={eduForm.field_of_study ?? ''}
              onChangeText={v => setEduForm(f => ({ ...f, field_of_study: v }))}
              placeholder="Ör: Bilgisayar Mühendisliği"
            />
            <DatePickerField
              label="Başlangıç Tarihi *"
              value={eduForm.start_date}
              onChange={v => setEduForm(f => ({ ...f, start_date: v ?? '' }))}
            />
            <DatePickerField
              label="Bitiş Tarihi"
              value={eduForm.end_date}
              onChange={v => setEduForm(f => ({ ...f, end_date: v }))}
              placeholder="Devam ediyorsa boş bırakın"
              optional
            />
            <FormField
              label="GPA (0-4)"
              value={eduForm.gpa != null ? String(eduForm.gpa) : ''}
              onChangeText={v => setEduForm(f => ({ ...f, gpa: v ? parseFloat(v) : null }))}
              keyboardType="numeric"
            />
            <FormField
              label="Açıklama"
              value={eduForm.description ?? ''}
              onChangeText={v => setEduForm(f => ({ ...f, description: v }))}
              multiline
            />

            {/* Belge yükleme */}
            <View style={docStyles.section}>
              <Text style={docStyles.label}>Görsel {!editingId && <Text style={docStyles.required}>*</Text>}</Text>
              {eduForm.file_path ? (
                <View style={docStyles.uploadedBox}>
                  <Ionicons name="document-attach" size={18} color={AppColors.primary} />
                  <Text style={docStyles.uploadedText}>Belge mevcut — değiştirilemez</Text>
                </View>
              ) : (
                <>
                  <View style={docStyles.warningBox}>
                    <Ionicons name="information-circle-outline" size={15} color="#92400e" />
                    <Text style={docStyles.warningText}>Yüklenen görseller sonradan değiştirilemez.</Text>
                  </View>
                  <TouchableOpacity
                    style={[docStyles.pickBtn, eduDocument && docStyles.pickBtnSelected]}
                    onPress={() => pickDocument(setEduDocument)}
                  >
                    <Ionicons name={eduDocument ? 'checkmark-circle' : 'cloud-upload-outline'} size={18} color={eduDocument ? AppColors.success : AppColors.primary} />
                    <Text style={[docStyles.pickBtnText, eduDocument && docStyles.pickBtnTextSelected]}>
                      {eduDocument ? eduDocument.name : 'Belge Seç'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEduModal(false)}>
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, modalSaving && styles.saveBtnDisabled]}
              onPress={saveEducation}
              disabled={modalSaving}
            >
              {modalSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.modalSaveText}>Kaydet</Text>
              }
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ─── Sertifika Modal ─── */}
      <Modal visible={certModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Sertifikayı Düzenle' : 'Sertifika Ekle'}</Text>
            <TouchableOpacity onPress={() => setCertModal(false)}>
              <Ionicons name="close" size={24} color={AppColors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <FormField
              label="Sertifika Adı *"
              value={certForm.name ?? ''}
              onChangeText={v => setCertForm(f => ({ ...f, name: v }))}
            />
            <FormField
              label="Veren Kuruluş *"
              value={certForm.issuing_organization ?? ''}
              onChangeText={v => setCertForm(f => ({ ...f, issuing_organization: v }))}
            />
            <DatePickerField
              label="Veriliş Tarihi *"
              value={certForm.issue_date}
              onChange={v => setCertForm(f => ({ ...f, issue_date: v ?? '' }))}
            />
            <DatePickerField
              label="Geçerlilik Tarihi"
              value={certForm.expiry_date}
              onChange={v => setCertForm(f => ({ ...f, expiry_date: v }))}
              placeholder="Opsiyonel"
              optional
            />
            <FormField
              label="Sertifika ID"
              value={certForm.credential_id ?? ''}
              onChangeText={v => setCertForm(f => ({ ...f, credential_id: v }))}
            />
            <FormField
              label="Sertifika URL"
              value={certForm.credential_url ?? ''}
              onChangeText={v => setCertForm(f => ({ ...f, credential_url: v }))}
              keyboardType="url"
            />
            <FormField
              label="Açıklama"
              value={certForm.description ?? ''}
              onChangeText={v => setCertForm(f => ({ ...f, description: v }))}
              multiline
            />

            {/* Belge yükleme */}
            <View style={docStyles.section}>
              <Text style={docStyles.label}>Görsel</Text>
              {certForm.file_path ? (
                <View style={docStyles.uploadedBox}>
                  <Ionicons name="document-attach" size={18} color={AppColors.primary} />
                  <Text style={docStyles.uploadedText}>Belge mevcut — değiştirilemez</Text>
                </View>
              ) : (
                <>
                  <View style={docStyles.warningBox}>
                    <Ionicons name="information-circle-outline" size={15} color="#92400e" />
                    <Text style={docStyles.warningText}>Yüklenen görseller sonradan değiştirilemez.</Text>
                  </View>
                  <TouchableOpacity
                    style={[docStyles.pickBtn, certDocument && docStyles.pickBtnSelected]}
                    onPress={() => pickDocument(setCertDocument)}
                  >
                    <Ionicons name={certDocument ? 'checkmark-circle' : 'cloud-upload-outline'} size={18} color={certDocument ? AppColors.success : AppColors.primary} />
                    <Text style={[docStyles.pickBtnText, certDocument && docStyles.pickBtnTextSelected]}>
                      {certDocument ? certDocument.name : 'Belge Seç'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCertModal(false)}>
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, modalSaving && styles.saveBtnDisabled]}
              onPress={saveCertificate}
              disabled={modalSaving}
            >
              {modalSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.modalSaveText}>Kaydet</Text>
              }
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ─── Kurs Modal ─── */}
      <Modal visible={courseModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Kursu Düzenle' : 'Kurs / Seminer Ekle'}</Text>
            <TouchableOpacity onPress={() => setCourseModal(false)}>
              <Ionicons name="close" size={24} color={AppColors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <FormField
              label="Başlık *"
              value={courseForm.title ?? ''}
              onChangeText={v => setCourseForm(f => ({ ...f, title: v }))}
            />
            <SelectField
              label="Tür *"
              value={courseForm.type ?? 'course'}
              options={COURSE_TYPE_OPTIONS}
              onSelect={v => setCourseForm(f => ({ ...f, type: v }))}
            />
            <FormField
              label="Sağlayıcı / Kurum *"
              value={courseForm.provider ?? ''}
              onChangeText={v => setCourseForm(f => ({ ...f, provider: v }))}
            />
            <DatePickerField
              label="Başlangıç Tarihi *"
              value={courseForm.start_date}
              onChange={v => setCourseForm(f => ({ ...f, start_date: v ?? '' }))}
            />
            <DatePickerField
              label="Bitiş Tarihi"
              value={courseForm.end_date}
              onChange={v => setCourseForm(f => ({ ...f, end_date: v }))}
              placeholder="Opsiyonel"
              optional
            />
            <FormField
              label="Süre (Saat)"
              value={courseForm.duration_hours != null ? String(courseForm.duration_hours) : ''}
              onChangeText={v => setCourseForm(f => ({ ...f, duration_hours: v ? parseInt(v) : null }))}
              keyboardType="numeric"
            />
            <FormField
              label="Konum"
              value={courseForm.location ?? ''}
              onChangeText={v => setCourseForm(f => ({ ...f, location: v }))}
            />

            <View style={styles.toggleRow}>
              <Text style={styles.fieldLabel}>Çevrimiçi</Text>
              <TouchableOpacity
                style={[styles.toggleBtn, courseForm.is_online && styles.toggleBtnActive]}
                onPress={() => setCourseForm(f => ({ ...f, is_online: !f.is_online }))}
              >
                <Text style={[styles.toggleText, courseForm.is_online && styles.toggleTextActive]}>
                  {courseForm.is_online ? 'Evet' : 'Hayır'}
                </Text>
              </TouchableOpacity>
            </View>

            <FormField
              label="Sertifika URL"
              value={courseForm.certificate_url ?? ''}
              onChangeText={v => setCourseForm(f => ({ ...f, certificate_url: v }))}
              keyboardType="url"
            />
            <FormField
              label="Açıklama"
              value={courseForm.description ?? ''}
              onChangeText={v => setCourseForm(f => ({ ...f, description: v }))}
              multiline
            />

            {/* Belge yükleme */}
            <View style={docStyles.section}>
              <Text style={docStyles.label}>Görsel {!editingId && <Text style={docStyles.required}>*</Text>}</Text>
              {courseForm.file_path ? (
                <View style={docStyles.uploadedBox}>
                  <Ionicons name="document-attach" size={18} color={AppColors.primary} />
                  <Text style={docStyles.uploadedText}>Belge mevcut — değiştirilemez</Text>
                </View>
              ) : (
                <>
                  <View style={docStyles.warningBox}>
                    <Ionicons name="information-circle-outline" size={15} color="#92400e" />
                    <Text style={docStyles.warningText}>Yüklenen görseller sonradan değiştirilemez.</Text>
                  </View>
                  <TouchableOpacity
                    style={[docStyles.pickBtn, courseDocument && docStyles.pickBtnSelected]}
                    onPress={() => pickDocument(setCourseDocument)}
                  >
                    <Ionicons name={courseDocument ? 'checkmark-circle' : 'cloud-upload-outline'} size={18} color={courseDocument ? AppColors.success : AppColors.primary} />
                    <Text style={[docStyles.pickBtnText, courseDocument && docStyles.pickBtnTextSelected]}>
                      {courseDocument ? courseDocument.name : 'Belge Seç'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCourseModal(false)}>
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, modalSaving && styles.saveBtnDisabled]}
              onPress={saveCourse}
              disabled={modalSaving}
            >
              {modalSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.modalSaveText}>Kaydet</Text>
              }
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ─── Yetenek Modal ─── */}
      <Modal visible={skillModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Yeteneği Düzenle' : 'Yetenek Ekle'}</Text>
            <TouchableOpacity onPress={() => setSkillModal(false)}>
              <Ionicons name="close" size={24} color={AppColors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <FormField
              label="Yetenek Adı *"
              value={skillForm.name ?? ''}
              onChangeText={v => setSkillForm(f => ({ ...f, name: v }))}
              placeholder="Ör: İngilizce, Python, Piyano..."
            />
            <SelectField
              label="Kategori *"
              value={skillForm.category ?? 'other'}
              options={SKILL_CATEGORY_OPTIONS}
              onSelect={v => setSkillForm(f => ({ ...f, category: v }))}
            />
            <SelectField
              label="Seviye *"
              value={skillForm.level ?? 'beginner'}
              options={SKILL_LEVEL_OPTIONS}
              onSelect={v => setSkillForm(f => ({ ...f, level: v }))}
            />
            <FormField
              label="Yeterlilik (0-100)"
              value={skillForm.proficiency != null ? String(skillForm.proficiency) : ''}
              onChangeText={v => setSkillForm(f => ({ ...f, proficiency: v ? parseInt(v) : null }))}
              keyboardType="numeric"
              placeholder="Opsiyonel"
            />
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSkillModal(false)}>
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, modalSaving && styles.saveBtnDisabled]}
              onPress={saveSkill}
              disabled={modalSaving}
            >
              {modalSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.modalSaveText}>Kaydet</Text>
              }
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {approvalSheet ? (
        <ApprovalBottomSheet
          visible={approvalSheet.visible}
          title={approvalSheet.title}
          approvals={approvals}
          loading={approvalsLoading}
          onClose={() => setApprovalSheet(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainerLow,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  tabBar: {
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainerLow,
    maxHeight: 52,
  },
  tabBarContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    flexDirection: 'row',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceContainerLow,
    marginHorizontal: 2,
  },
  tabItemActive: {
    backgroundColor: AppColors.primaryContainer,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.onSurfaceVariant,
  },
  tabLabelActive: {
    color: AppColors.primary,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.onSurface,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.onSurface,
  },
  fieldInputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  selectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: AppColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectChipActive: {
    backgroundColor: AppColors.primaryContainer,
    borderColor: AppColors.primary,
  },
  selectChipText: {
    fontSize: 12,
    color: AppColors.onSurfaceVariant,
    fontWeight: '500',
  },
  selectChipTextActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: AppColors.primaryContainer,
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  addBtnText: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: AppColors.onSurfaceVariant,
    fontSize: 14,
    marginTop: 32,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: AppColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  cardSub: {
    fontSize: 12,
    color: AppColors.onSurfaceVariant,
    marginTop: 2,
  },
  cardDate: {
    fontSize: 11,
    color: AppColors.onSurfaceVariant,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: AppColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDesc: {
    fontSize: 12,
    color: AppColors.onSurfaceVariant,
    marginTop: 8,
    lineHeight: 18,
  },
  statusBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400e',
  },
  onlineBadge: {
    fontSize: 10,
    color: AppColors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  docBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  docBadgeText: {
    fontSize: 11,
    color: AppColors.primary,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 32,
  },
  skillCard: {
    width: '47%',
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  skillMeta: {
    fontSize: 11,
    color: AppColors.onSurfaceVariant,
    marginTop: 2,
  },
  skillLevel: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  proficiencyBar: {
    height: 4,
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  proficiencyFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 2,
  },
  skillActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: AppColors.surfaceContainerLow,
  },
  toggleBtnActive: {
    backgroundColor: AppColors.primaryContainer,
  },
  toggleText: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: AppColors.primary,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainerLow,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainerLow,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: AppColors.surfaceContainerLow,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.onSurfaceVariant,
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

const docStyles = StyleSheet.create({
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.onSurface,
    marginBottom: 8,
  },
  required: {
    color: AppColors.error,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: AppColors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickBtnSelected: {
    borderStyle: 'solid',
    borderColor: AppColors.success,
    backgroundColor: AppColors.successContainer,
  },
  pickBtnText: {
    fontSize: 13,
    color: AppColors.primary,
    flex: 1,
  },
  pickBtnTextSelected: {
    color: AppColors.success,
  },
  uploadedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  uploadedText: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
  },
});
