import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

interface Family {
  id: string;
  family_name: string;
}

interface Member {
  id: number;
  user_id: number;
  user: { id: number; name: string; surname: string; email: string; phone: string | null } | null;
  relation_type: string | null;
  role: 'super_parent' | 'co_parent';
  is_active: boolean;
  invitation_status: 'pending' | 'accepted';
  invitation_security_code: string | null;
}

interface FamilyChild {
  id: number;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
}

const PERMISSION_LABELS: Record<string, string> = {
  can_edit_child_profile: 'Çocuk profili düzenleyebilir',
  can_add_child: 'Çocuk ekleyebilir',
  can_enroll_child: 'Okula kayıt yapabilir',
  can_view_child_details: 'Tüm detayları görüntüleyebilir',
};

const PERMISSION_ICONS: Record<string, string> = {
  can_edit_child_profile: 'create-outline',
  can_add_child: 'person-add-outline',
  can_enroll_child: 'school-outline',
  can_view_child_details: 'eye-outline',
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS);

export default function FamilyDetailScreen() {
  const { ulid } = useLocalSearchParams<{ ulid: string }>();

  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myRole, setMyRole] = useState<'super_parent' | 'co_parent' | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRelation, setAddRelation] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [familyChildren, setFamilyChildren] = useState<FamilyChild[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<number[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['can_view_child_details']);
  const [childrenLoading, setChildrenLoading] = useState(false);

  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editFamilyName, setEditFamilyName] = useState('');
  const [editNameLoading, setEditNameLoading] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) { setLoading(true); }
    try {
      const [familyRes, membersRes] = await Promise.all([
        api.get<{ data: Family }>(`/parent/families/${ulid}`),
        api.get<{ data: Member[] }>(`/parent/families/${ulid}/members`),
      ]);
      setFamily(familyRes.data.data);
      const memberList = membersRes.data.data;
      setMembers(memberList);

      // Determine my role from members list
      // We'll figure it out from families endpoint, but here we just check super_parent count
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ulid]);

  // Also fetch my role from families list
  useEffect(() => {
    void fetchData();
    void (async () => {
      try {
        const res = await api.get<{ data: Array<{ id: string; my_role: string }> }>('/parent/families');
        const found = res.data.data.find((f) => f.id === ulid);
        if (found) {
          setMyRole(found.my_role as 'super_parent' | 'co_parent');
        }
      } catch {
        // ignore
      }
    })();
  }, [fetchData, ulid]);

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchData(true);
  };

  useEffect(() => {
    if (!showAddModal || !ulid) { return; }
    setChildrenLoading(true);
    api.get<{ data: FamilyChild[] }>(`/parent/families/${ulid}/children`)
      .then((res) => setFamilyChildren(res.data.data))
      .catch(() => setFamilyChildren([]))
      .finally(() => setChildrenLoading(false));
  }, [showAddModal, ulid]);

  const toggleChild = (childId: number) => {
    setSelectedChildIds((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    );
  };

  const isSuperParent = myRole === 'super_parent';

  const resetAddModal = () => {
    setAddEmail('');
    setAddRelation('');
    setSelectedChildIds([]);
    setSelectedPermissions(['can_view_child_details']);
    setFamilyChildren([]);
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleAddMember = async () => {
    if (!addEmail.trim()) {
      Alert.alert('Hata', 'E-posta adresi zorunludur.');
      return;
    }
    setAddLoading(true);
    try {
      await api.post(`/parent/families/${ulid}/members`, {
        email: addEmail.trim(),
        relation_type: addRelation.trim() || undefined,
        child_ids: selectedChildIds.length > 0 ? selectedChildIds : undefined,
        permissions: selectedPermissions.length > 0 ? selectedPermissions : undefined,
      });
      setShowAddModal(false);
      resetAddModal();
      void fetchData(true);
      Alert.alert('Davet Gönderildi', 'Kullanıcı daveti kabul ettiğinde aileye dahil olacak.');
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveMember = (member: Member) => {
    if (member.role === 'super_parent') {
      Alert.alert('Hata', 'Ana veli aileden kaldırılamaz.');
      return;
    }

    Alert.alert(
      'Üyeyi Kaldır',
      `${member.user?.name ?? ''} ${member.user?.surname ?? ''} aile üyesini kaldırmak istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/parent/families/${ulid}/members/${member.user_id}`);
              void fetchData(true);
            } catch (err: unknown) {
              Alert.alert('Hata', getApiError(err));
            }
          },
        },
      ]
    );
  };

  const handleUpdateFamilyName = async () => {
    if (!editFamilyName.trim()) {
      Alert.alert('Hata', 'Aile adı boş olamaz.');
      return;
    }
    setEditNameLoading(true);
    try {
      await api.put(`/parent/families/${ulid}`, { family_name: editFamilyName.trim() });
      setFamily((prev) => prev ? { ...prev, family_name: editFamilyName.trim() } : prev);
      setShowEditNameModal(false);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setEditNameLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={AppColors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>Aile</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{family?.family_name ?? '—'}</Text>
        </View>
        {isSuperParent && (
          <Button
            label="Üye Ekle"
            variant="primary"
            size="sm"
            icon={<Ionicons name="person-add-outline" size={14} color={AppColors.white} />}
            onPress={() => setShowAddModal(true)}
          />
        )}
      </View>

      {/* Aile Adı Kartı */}
      <TouchableOpacity
        style={styles.familyNameCard}
        onPress={isSuperParent ? () => { setEditFamilyName(family?.family_name ?? ''); setShowEditNameModal(true); } : undefined}
        activeOpacity={isSuperParent ? 0.75 : 1}
      >
        <View style={styles.familyNameIcon}>
          <Ionicons name="home-outline" size={22} color={AppColors.primary} />
        </View>
        <View style={styles.familyNameInfo}>
          <Text style={styles.familyNameLabel}>Aile Adı</Text>
          <Text style={styles.familyNameText}>{family?.family_name ?? '—'}</Text>
        </View>
        {isSuperParent && (
          <Ionicons name="pencil-outline" size={18} color={AppColors.primary} />
        )}
      </TouchableOpacity>

      {/* Acil Durum Kişileri */}
      <TouchableOpacity
        style={styles.quickAction}
        onPress={() => router.push({ pathname: '/(app)/family/emergency', params: { familyUlid: ulid } })}
        activeOpacity={0.75}
      >
        <View style={styles.quickActionIcon}>
          <Ionicons name="medkit-outline" size={22} color={AppColors.error} />
        </View>
        <View style={styles.quickActionInfo}>
          <Text style={styles.quickActionTitle}>Acil Durum Kişileri</Text>
          <Text style={styles.quickActionSub}>Acil iletişim listesini yönetin</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={AppColors.surfaceContainer} />
      </TouchableOpacity>

      <SectionLabel style={styles.sectionLabelPad}>Aile Üyeleri</SectionLabel>

      <FlatList
        data={members}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const name = item.user ? `${item.user.name} ${item.user.surname}` : 'Bilinmiyor';
          const isSuperParentMember = item.role === 'super_parent';
          const isPending = item.invitation_status === 'pending';

          return (
            <Card style={[styles.memberCard, isPending && styles.memberCardPending]}>
              <Avatar name={name} size={46} shape="rounded" />
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.memberName}>{name}</Text>
                  {isPending ? (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Beklemede</Text>
                    </View>
                  ) : (
                    <View style={[styles.roleBadge, isSuperParentMember ? styles.rolePrimary : styles.roleSecondary]}>
                      <Text style={[styles.roleBadgeText, isSuperParentMember ? styles.roleTextPrimary : styles.roleTextSecondary]}>
                        {isSuperParentMember ? 'Ana Veli' : 'Eş Veli'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberEmail}>{item.user?.email ?? ''}</Text>
                {item.relation_type && (
                  <Text style={styles.relationText}>{item.relation_type}</Text>
                )}
                {isPending && isSuperParent && item.invitation_security_code && (
                  <View style={styles.securityCodeRow}>
                    <Ionicons name="key-outline" size={12} color={AppColors.info} />
                    <Text style={styles.securityCodeLabel}>Güvenlik Kodu: </Text>
                    <Text style={styles.securityCodeValue}>{item.invitation_security_code}</Text>
                  </View>
                )}
              </View>
              {!isSuperParentMember && isSuperParent && (
                <TouchableOpacity
                  onPress={() => handleRemoveMember(item)}
                  activeOpacity={0.7}
                  style={styles.removeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle-outline" size={22} color={AppColors.error} />
                </TouchableOpacity>
              )}
            </Card>
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={AppColors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aile üyesi bulunamadı.</Text>
          </View>
        }
      />

      {/* Aile Adı Düzenleme Modal */}
      <Modal
        visible={showEditNameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Aile Adını Düzenle</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Aile Adı</Text>
              <View style={styles.inputRow}>
                <Ionicons name="home-outline" size={17} color={AppColors.onSurfaceVariant} />
                <TextInput
                  style={styles.input}
                  value={editFamilyName}
                  onChangeText={setEditFamilyName}
                  placeholder="Örn: Aydoğdu Ailesi"
                  placeholderTextColor={AppColors.surfaceContainer}
                  autoCorrect={false}
                />
              </View>
            </View>
            <View style={styles.modalActions}>
              <Button label="İptal" variant="outline" size="lg" onPress={() => setShowEditNameModal(false)} />
              <Button label="Kaydet" variant="primary" size="lg" loading={editNameLoading} onPress={handleUpdateFamilyName} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Üye Ekleme Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowAddModal(false); resetAddModal(); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Aile Üyesi Davet Et</Text>
            <Text style={styles.modalSubtitle}>
              Davet edilen kişi kabul ettiğinde aileye dahil olur. Kişinin iStudy hesabı olmalıdır.
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <Text style={styles.label}>E-posta Adresi</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={17} color={AppColors.onSurfaceVariant} />
                  <TextInput
                    style={styles.input}
                    value={addEmail}
                    onChangeText={setAddEmail}
                    placeholder="ornek@mail.com"
                    placeholderTextColor={AppColors.surfaceContainer}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
              <View style={[styles.field, styles.fieldGap]}>
                <Text style={styles.label}>İlişki Türü (İsteğe bağlı)</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="people-outline" size={17} color={AppColors.onSurfaceVariant} />
                  <TextInput
                    style={styles.input}
                    value={addRelation}
                    onChangeText={setAddRelation}
                    placeholder="Anne, Baba, Vasi..."
                    placeholderTextColor={AppColors.surfaceContainer}
                  />
                </View>
              </View>

              {/* Yetkiler */}
              <View style={[styles.field, styles.fieldGap]}>
                <View style={styles.permissionHeader}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={AppColors.primary} />
                  <Text style={styles.label}>Yetkiler</Text>
                </View>
                <Text style={styles.labelHint}>
                  Seçilen işlemleri yapabilir. Seçilmeyen yetkiler için "Yetkiniz yok" uyarısı alır.
                </Text>
                <View style={styles.permissionList}>
                  {ALL_PERMISSIONS.map((perm) => {
                    const active = selectedPermissions.includes(perm);
                    return (
                      <TouchableOpacity
                        key={perm}
                        style={[styles.permRow, active && styles.permRowActive]}
                        onPress={() => togglePermission(perm)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.permIconBox, active && styles.permIconBoxActive]}>
                          <Ionicons
                            name={PERMISSION_ICONS[perm] as any}
                            size={16}
                            color={active ? AppColors.white : AppColors.onSurfaceVariant}
                          />
                        </View>
                        <Text style={[styles.permLabel, active && styles.permLabelActive]}>
                          {PERMISSION_LABELS[perm]}
                        </Text>
                        <View style={[styles.permCheck, active && styles.permCheckActive]}>
                          {active && <Ionicons name="checkmark" size={13} color={AppColors.white} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Çocuk Seçimi */}
              <View style={[styles.field, styles.fieldGap]}>
                <View style={styles.permissionHeader}>
                  <Ionicons name="people-outline" size={16} color={AppColors.primary} />
                  <Text style={styles.label}>Çocuk Erişimi (İsteğe bağlı)</Text>
                </View>
                <Text style={styles.labelHint}>Seçilmezse tüm çocuklara erişebilir.</Text>
                {childrenLoading ? (
                  <ActivityIndicator size="small" color={AppColors.primary} style={{ marginTop: 8 }} />
                ) : familyChildren.length === 0 ? (
                  <Text style={styles.noChildrenText}>Bu ailede henüz çocuk bulunmuyor.</Text>
                ) : (
                  <View style={styles.chipGroup}>
                    {familyChildren.map((child) => {
                      const selected = selectedChildIds.includes(child.id);
                      return (
                        <TouchableOpacity
                          key={child.id}
                          style={[styles.chip, selected && styles.chipSelected]}
                          onPress={() => toggleChild(child.id)}
                          activeOpacity={0.75}
                        >
                          <Ionicons
                            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={16}
                            color={selected ? AppColors.white : AppColors.onSurfaceVariant}
                          />
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {child.full_name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button label="İptal" variant="outline" size="lg" onPress={() => { setShowAddModal(false); resetAddModal(); }} />
              <Button label="Davet Gönder" variant="primary" size="lg" loading={addLoading} onPress={handleAddMember} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainer,
    gap: 10,
  },
  backBtn: { padding: 2 },
  headerCenter: { flex: 1 },
  headerSub: { fontSize: 11, color: AppColors.onSurfaceVariant, fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: AppColors.primary, letterSpacing: -0.3 },
  familyNameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderBottomWidth: 3,
    borderBottomColor: AppColors.primaryContainer,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  familyNameIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyNameInfo: { flex: 1 },
  familyNameLabel: { fontSize: 11, color: AppColors.onSurfaceVariant, fontWeight: '600', marginBottom: 2 },
  familyNameText: { fontSize: 16, fontWeight: '800', color: AppColors.primary },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderBottomWidth: 3,
    borderBottomColor: AppColors.surfaceContainer,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionInfo: { flex: 1 },
  quickActionTitle: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface },
  quickActionSub: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 2 },
  sectionLabelPad: { paddingHorizontal: 20, marginTop: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  memberCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  memberName: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface, flexShrink: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  rolePrimary: { backgroundColor: AppColors.primaryContainer },
  roleSecondary: { backgroundColor: AppColors.surfaceContainerLow },
  roleBadgeText: { fontSize: 10, fontWeight: '700' },
  roleTextPrimary: { color: AppColors.primary },
  roleTextSecondary: { color: AppColors.onSurfaceVariant },
  memberCardPending: { borderLeftWidth: 3, borderLeftColor: '#D97706' },
  pendingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  pendingBadgeText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  securityCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    backgroundColor: AppColors.infoContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  securityCodeLabel: { fontSize: 11, color: AppColors.info, fontWeight: '600' },
  securityCodeValue: { fontSize: 13, color: AppColors.info, fontWeight: '900', letterSpacing: 2 },
  memberEmail: { fontSize: 12, color: AppColors.onSurfaceVariant },
  relationText: { fontSize: 11, color: AppColors.surfaceContainer, marginTop: 2 },
  removeBtn: { padding: 2 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: AppColors.onSurfaceVariant },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
    maxHeight: '90%',
  },
  modalScroll: { flexGrow: 0 },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: AppColors.surfaceContainer,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: AppColors.onSurface },
  modalSubtitle: { fontSize: 13, color: AppColors.onSurfaceVariant, lineHeight: 20, marginTop: -6 },
  field: { gap: 7 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.onSurface },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AppColors.surfaceContainerLow,
    borderWidth: 2,
    borderColor: AppColors.surfaceContainer,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 13,
  },
  input: { flex: 1, fontSize: 14, color: AppColors.onSurface, padding: 0 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  labelHint: { fontSize: 11, color: AppColors.onSurfaceVariant, marginTop: -4 },
  noChildrenText: { fontSize: 13, color: AppColors.onSurfaceVariant, marginTop: 4 },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: AppColors.surfaceContainer,
  },
  chipSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: AppColors.onSurfaceVariant },
  chipTextSelected: { color: AppColors.white },
  fieldGap: { marginTop: 6 },
  permissionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  permissionList: { gap: 8, marginTop: 4 },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: AppColors.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: AppColors.surfaceContainer,
  },
  permRowActive: {
    backgroundColor: AppColors.primaryContainer,
    borderColor: AppColors.primary,
  },
  permIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: AppColors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permIconBoxActive: {
    backgroundColor: AppColors.primary,
  },
  permLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: AppColors.onSurfaceVariant },
  permLabelActive: { color: AppColors.primary },
  permCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: AppColors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permCheckActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
});
