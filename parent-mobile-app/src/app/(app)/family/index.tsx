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

const AVATAR_COLORS = ['#208AEF', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

function memberColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function FamilyScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRelation, setAddRelation] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const fetchMembers = useCallback(async (isRefresh = false) => {
    if (!isRefresh) { setLoading(true); }
    try {
      const response = await api.get<{ data: Member[] }>('/parent/family/members');
      setMembers(response.data.data);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchMembers(true);
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
      void fetchMembers(true);
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
              void fetchMembers(true);
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
          <ActivityIndicator size="large" color="#208AEF" />
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
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Üye Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <TouchableOpacity
        style={styles.quickAction}
        onPress={() => router.push('/(app)/family/emergency')}
        activeOpacity={0.75}
      >
        <View style={styles.quickActionIcon}>
          <Ionicons name="medkit-outline" size={22} color="#EF4444" />
        </View>
        <View style={styles.quickActionInfo}>
          <Text style={styles.quickActionTitle}>Acil Durum Kişileri</Text>
          <Text style={styles.quickActionSub}>Acil iletişim listesini yönetin</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>AİLE ÜYELERİ</Text>

      <FlatList
        data={members}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const name = item.user ? `${item.user.name} ${item.user.surname}` : 'Bilinmiyor';
          const color = memberColor(item.user?.name ?? 'A');
          const initial = (item.user?.name ?? '?').charAt(0).toUpperCase();
          const isSuperParent = item.role === 'super_parent';

          return (
            <View style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: color }]}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.memberName}>{name}</Text>
                  <View style={[styles.roleBadge, isSuperParent ? styles.rolePrimary : styles.roleSecondary]}>
                    <Text style={[styles.roleBadgeText, isSuperParent ? styles.roleTextPrimary : styles.roleTextSecondary]}>
                      {isSuperParent ? 'Ana Veli' : 'Eş Veli'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.memberEmail}>{item.user?.email ?? ''}</Text>
                {item.relation_type && (
                  <Text style={styles.relationText}>{item.relation_type}</Text>
                )}
              </View>
              {!isSuperParent && (
                <TouchableOpacity
                  onPress={() => handleRemoveMember(item)}
                  activeOpacity={0.7}
                  style={styles.removeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#208AEF" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aile üyesi bulunamadı.</Text>
          </View>
        }
      />

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
                <Ionicons name="mail-outline" size={17} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  value={addEmail}
                  onChangeText={setAddEmail}
                  placeholder="ornek@mail.com"
                  placeholderTextColor="#C4C9D4"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>İlişki Türü (İsteğe bağlı)</Text>
              <View style={styles.inputRow}>
                <Ionicons name="people-outline" size={17} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  value={addRelation}
                  onChangeText={setAddRelation}
                  placeholder="Anne, Baba, Vasi..."
                  placeholderTextColor="#C4C9D4"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, addLoading && styles.btnDisabled]}
                onPress={handleAddMember}
                disabled={addLoading}
                activeOpacity={0.85}
              >
                {addLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Ekle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerSub: { fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1F2937' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionInfo: { flex: 1 },
  quickActionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  quickActionSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  memberName: { fontSize: 15, fontWeight: '700', color: '#1F2937', flexShrink: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  rolePrimary: { backgroundColor: '#EFF6FF' },
  roleSecondary: { backgroundColor: '#F3F4F6' },
  roleBadgeText: { fontSize: 10, fontWeight: '700' },
  roleTextPrimary: { color: '#208AEF' },
  roleTextSecondary: { color: '#6B7280' },
  memberEmail: { fontSize: 12, color: '#9CA3AF' },
  relationText: { fontSize: 11, color: '#C4C9D4', marginTop: 2 },
  removeBtn: { padding: 2 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  modalSubtitle: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: -6 },
  field: { gap: 7 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 13,
  },
  input: { flex: 1, fontSize: 14, color: '#1F2937', padding: 0 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#208AEF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
