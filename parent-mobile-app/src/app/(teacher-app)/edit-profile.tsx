import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
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

// ─── Tipler ──────────────────────────────────────────────────────────────────

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
}

interface Skill {
  id: number;
  name: string;
  level: string;
  category: string;
  proficiency?: number | null;
}

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

  const openEduModal = (edu?: Education) => {
    if (edu) {
      setEduForm({ ...edu });
      setEditingId(edu.id);
    } else {
      setEduForm({ degree: 'bachelor' });
      setEditingId(null);
    }
    setEduModal(true);
  };

  const saveEducation = async () => {
    if (!eduForm.institution || !eduForm.degree || !eduForm.field_of_study || !eduForm.start_date) {
      Alert.alert('Hata', 'Okul, derece, alan ve başlangıç tarihi zorunludur.');
      return;
    }
    setModalSaving(true);
    try {
      if (editingId) {
        await api.put(`/teacher/profile/educations/${editingId}`, eduForm);
      } else {
        await api.post('/teacher/profile/educations', eduForm);
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
      } else {
        await api.post('/teacher/profile/certificates', certForm);
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
    setCourseModal(true);
  };

  const saveCourse = async () => {
    if (!courseForm.title || !courseForm.provider || !courseForm.start_date) {
      Alert.alert('Hata', 'Başlık, sağlayıcı ve başlangıç tarihi zorunludur.');
      return;
    }
    setModalSaving(true);
    try {
      if (editingId) {
        await api.put(`/teacher/profile/courses/${editingId}`, courseForm);
      } else {
        await api.post('/teacher/profile/courses', courseForm);
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
      <FormField
        label="Doğum Tarihi"
        value={basic.date_of_birth ?? ''}
        onChangeText={v => setBasic(b => ({ ...b, date_of_birth: v }))}
        placeholder="YYYY-MM-DD"
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
              <Text style={styles.cardSub}>{edu.degree} — {edu.field_of_study}</Text>
              <Text style={styles.cardDate}>
                {edu.start_date} — {edu.is_current ? 'Devam Ediyor' : (edu.end_date ?? '?')}
              </Text>
            </View>
            <View style={styles.cardActions}>
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
              <Text style={styles.cardDate}>{cert.issue_date}</Text>
              {cert.status && cert.status !== 'approved' && (
                <View style={[styles.statusBadge, cert.status === 'pending' && styles.statusPending]}>
                  <Text style={styles.statusBadgeText}>
                    {cert.status === 'pending' ? 'Onay Bekliyor' : cert.status}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.cardActions}>
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
                {course.start_date}{course.end_date ? ` — ${course.end_date}` : ''}
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
            </View>
            <View style={styles.cardActions}>
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
            <FormField
              label="Başlangıç Tarihi *"
              value={eduForm.start_date ?? ''}
              onChangeText={v => setEduForm(f => ({ ...f, start_date: v }))}
              placeholder="YYYY-MM-DD"
            />
            <FormField
              label="Bitiş Tarihi"
              value={eduForm.end_date ?? ''}
              onChangeText={v => setEduForm(f => ({ ...f, end_date: v || null }))}
              placeholder="Devam ediyorsa boş bırakın"
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
            <FormField
              label="Veriliş Tarihi *"
              value={certForm.issue_date ?? ''}
              onChangeText={v => setCertForm(f => ({ ...f, issue_date: v }))}
              placeholder="YYYY-MM-DD"
            />
            <FormField
              label="Geçerlilik Tarihi"
              value={certForm.expiry_date ?? ''}
              onChangeText={v => setCertForm(f => ({ ...f, expiry_date: v || null }))}
              placeholder="YYYY-MM-DD (opsiyonel)"
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
            <FormField
              label="Başlangıç Tarihi *"
              value={courseForm.start_date ?? ''}
              onChangeText={v => setCourseForm(f => ({ ...f, start_date: v }))}
              placeholder="YYYY-MM-DD"
            />
            <FormField
              label="Bitiş Tarihi"
              value={courseForm.end_date ?? ''}
              onChangeText={v => setCourseForm(f => ({ ...f, end_date: v || null }))}
              placeholder="YYYY-MM-DD (opsiyonel)"
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
    </SafeAreaView>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
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
    backgroundColor: AppColors.background,
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
