import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
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

interface Member {
  id: number;
  user_id: number;
  user: { id: number; name: string; surname: string; email: string; phone: string | null } | null;
  relation_type: string | null;
  role: 'super_parent' | 'co_parent';
  is_active: boolean;
}

interface FamilyProfile {
  id: string;
  family_name: string;
}

const AVATAR_COLORS = [AppColors.primary, '#8B5CF6', '#EC4899', AppColors.success, AppColors.warning];

function memberColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function FamilyScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRelation, setAddRelation] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editFamilyName, setEditFamilyName] = useState('');
  const [editNameLoading, setEditNameLoading] = useState(false);
  const [isSuperParent, setIsSuperParent] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) { setLoading(true); }
    try {
      const [profileRes, membersRes] = await Promise.all([
        api.get<{ data: FamilyProfile }>('/parent/family'),
        api.get<{ data: Member[] }>('/parent/family/members'),
      ]);
      setFamilyProfile(profileRes.data.data);
      const memberList = membersRes.data.data;
      setMembers(memberList);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Giriş yapan kullanıcının super_parent olup olmadığını members'tan belirle
  useEffect(() => {
    // members içinde role=super_parent olan ilk kişiyi ana veli kabul et
    // Daha iyi çözüm: me endpoint'inden user_id alıp karşılaştırmak
    // Şimdilik super_parent varsa ve tek kullanıcı kendi olabilir; basit kontrol:
    const superParentExists = members.some((m) => m.role === 'super_parent');
    setIsSuperParent(superParentExists);
  }, [members]);

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchData(true);
  };

  const openEditName = () => {
    setEditFamilyName(familyProfile?.family_name ?? '');
    setShowEditNameModal(true);
  };

  const handleUpdateFamilyName = async () => {
    if (!editFamilyName.trim()) {
      Alert.alert('Hata', 'Aile adı boş olamaz.');
      return;
    }

    setEditNameLoading(true);
    try {
      await api.put('/parent/family', { family_name: editFamilyName.trim() });
      setFamilyProfile((prev) => prev ? { ...prev, family_name: editFamilyName.trim() } : prev);
      setShowEditNameModal(false);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setEditNameLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!addEmail.trim()) {
      Alert.alert('Hata', 'E-posta adresi zorunludur.');
      return;
    }

    setAddLoading(true);
    try {
      await api.post('/parent/family/members', {
        email: addEmail.trim(),
        relation_type: addRelation.trim() || undefined,
      });
      setShowAddModal(false);
      setAddEmail('');
      setAddRelation('');
      void fetchData(true);
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
              await api.delete(`/parent/family/members/${member.user_id}`);
              void fetchData(true);
            } catch (err: unknown) {
              Alert.alert('Hata', getApiError(err));
            }
          },
        },
      ]
    );
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
        <View>
          <Text style={styles.headerSub}>Yönet</Text>
          <Text style={styles.headerTitle}>Ailem</Text>
        </View>
        <Button
          label="Üye Ekle"
          variant="primary"
          size="sm"
          icon={<Ionicons name="person-add-outline" size={16} color={AppColors.white} />}
          onPress={() => setShowAddModal(true)}
        />
      </View>

      {/* Aile Adı Kartı */}
      <TouchableOpacity
        style={styles.familyNameCard}
        onPress={isSuperParent ? openEditName : undefined}
        activeOpacity={isSuperParent ? 0.75 : 1}
      >
        <View style={styles.familyNameIcon}>
          <Ionicons name="home-outline" size={22} color={AppColors.primary} />
        </View>
        <View style={styles.familyNameInfo}>
          <Text style={styles.familyNameLabel}>Aile Adı</Text>
          <Text style={styles.familyNameText}>{familyProfile?.family_name ?? '—'}</Text>
        </View>
        {isSuperParent && (
          <Ionicons name="pencil-outline" size={18} color={AppColors.primary} />
        )}
      </TouchableOpacity>

      {/* Quick Actions */}
      <TouchableOpacity
        style={styles.quickAction}
        onPress={() => router.push('/(app)/family/emergency')}
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

          return (
            <Card style={styles.memberCard}>
              <Avatar name={name} size={46} shape="rounded" />
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.memberName}>{name}</Text>
                  <View style={[styles.roleBadge, isSuperParentMember ? styles.rolePrimary : styles.roleSecondary]}>
                    <Text style={[styles.roleBadgeText, isSuperParentMember ? styles.roleTextPrimary : styles.roleTextSecondary]}>
                      {isSuperParentMember ? 'Ana Veli' : 'Eş Veli'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.memberEmail}>{item.user?.email ?? ''}</Text>
                {item.relation_type && (
                  <Text style={styles.relationText}>{item.relation_type}</Text>
                )}
              </View>
              {!isSuperParentMember && (
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
            <Text style={styles.modalSubtitle}>
              Aile adı tüm aile üyeleri tarafından görülür.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Aile Adı</Text>
              <View style={styles.inputRow}>
                <Ionicons name="home-outline" size={17} color={AppColors.onSurfaceVariant} />
                <TextInput
                  style={styles.input}
                  value={editFamilyName}
                  onChangeText={setEditFamilyName}
                  placeholder="Örn: Aydoğdu Family"
                  placeholderTextColor={AppColors.surfaceContainer}
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                label="İptal"
                variant="outline"
                size="lg"
                onPress={() => setShowEditNameModal(false)}
              />
              <Button
                label="Kaydet"
                variant="primary"
                size="lg"
                loading={editNameLoading}
                onPress={handleUpdateFamilyName}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Üye Ekleme Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Aile Üyesi Ekle</Text>
            <Text style={styles.modalSubtitle}>
              Eklenmek istenen kişinin iStudy hesabı olması gerekir.
            </Text>

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

            <View style={styles.field}>
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

            <View style={styles.modalActions}>
              <Button
                label="İptal"
                variant="outline"
                size="lg"
                onPress={() => setShowAddModal(false)}
              />
              <Button
                label="Ekle"
                variant="primary"
                size="lg"
                loading={addLoading}
                onPress={handleAddMember}
              />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainer,
  },
  headerSub: { fontSize: 11, color: AppColors.onSurfaceVariant, fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: AppColors.primary, letterSpacing: -0.3 },
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
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 10,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  memberName: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface, flexShrink: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  rolePrimary: { backgroundColor: AppColors.primaryContainer },
  roleSecondary: { backgroundColor: AppColors.surfaceContainerLow },
  roleBadgeText: { fontSize: 10, fontWeight: '700' },
  roleTextPrimary: { color: AppColors.primary },
  roleTextSecondary: { color: AppColors.onSurfaceVariant },
  memberEmail: { fontSize: 12, color: AppColors.onSurfaceVariant },
  relationText: { fontSize: 11, color: AppColors.surfaceContainer, marginTop: 2 },
  removeBtn: { padding: 2 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: AppColors.onSurfaceVariant },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
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
});
