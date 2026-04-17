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
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

interface Family {
  id: string;
  family_name: string;
  my_role: 'super_parent' | 'co_parent';
  member_count: number;
  pending_invitations_count: number;
}

interface InvitationChild {
  id: number;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
}

interface Invitation {
  id: number;
  family: { id: string; family_name: string } | null;
  invited_by: { name: string; surname: string; email: string } | null;
  relation_type: string | null;
  children: InvitationChild[];
  created_at: string;
}

export default function FamilyScreen() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFamilyName, setCreateFamilyName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) { setLoading(true); }
    try {
      const [familiesRes, invitationsRes] = await Promise.all([
        api.get<{ data: Family[] }>('/parent/families'),
        api.get<{ data: Invitation[] }>('/parent/family/invitations'),
      ]);
      setFamilies(familiesRes.data.data);
      setInvitations(invitationsRes.data.data);
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

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchData(true);
  };

  const handleCreateFamily = async () => {
    if (!createFamilyName.trim()) {
      Alert.alert('Hata', 'Aile adı boş olamaz.');
      return;
    }
    setCreateLoading(true);
    try {
      await api.post('/parent/families', { family_name: createFamilyName.trim() });
      setShowCreateModal(false);
      setCreateFamilyName('');
      void fetchData(true);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitation: Invitation) => {
    try {
      await api.post(`/parent/family/invitations/${invitation.id}/accept`);
      void fetchData(true);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    }
  };

  const handleRejectInvitation = (invitation: Invitation) => {
    Alert.alert(
      'Daveti Reddet',
      `${invitation.family?.family_name ?? 'Bu aile'} davetini reddetmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/parent/family/invitations/${invitation.id}/reject`);
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
          label="Aile Oluştur"
          variant="primary"
          size="sm"
          icon={<Ionicons name="add-outline" size={16} color={AppColors.white} />}
          onPress={() => setShowCreateModal(true)}
        />
      </View>

      <FlatList
        data={families}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={AppColors.primary} />
        }
        ListHeaderComponent={
          invitations.length > 0 ? (
            <View>
              <SectionLabel style={styles.sectionLabelPad}>Bekleyen Davetler</SectionLabel>
              {invitations.map((inv) => (
                <Card key={inv.id} style={styles.invitationCard}>
                  <View style={styles.invitationTop}>
                    <View style={styles.invitationIcon}>
                      <Ionicons name="mail-outline" size={22} color={AppColors.warning} />
                    </View>
                    <View style={styles.invitationInfo}>
                      <Text style={styles.invitationFamily}>{inv.family?.family_name ?? 'Bilinmeyen Aile'}</Text>
                      {inv.invited_by && (
                        <Text style={styles.invitationBy}>
                          {inv.invited_by.name} {inv.invited_by.surname} davet etti
                        </Text>
                      )}
                      {inv.invited_by?.email ? (
                        <Text style={styles.invitationEmail}>{inv.invited_by.email}</Text>
                      ) : null}
                    </View>
                    <View style={styles.invitationActions}>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleAcceptInvitation(inv)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark-outline" size={18} color={AppColors.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleRejectInvitation(inv)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close-outline" size={18} color={AppColors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {(inv.children?.length ?? 0) > 0 && (
                    <View style={styles.invitationChildren}>
                      <Text style={styles.invitationChildrenLabel}>Atanmış çocuklar:</Text>
                      <View style={styles.invitationChildTags}>
                        {(inv.children ?? []).map((child) => (
                          <View key={child.id} style={styles.childTag}>
                            <Ionicons name="person-outline" size={11} color={AppColors.secondary} />
                            <Text style={styles.childTagText}>
                              {child.full_name}
                              {child.birth_date ? ` · ${new Date(child.birth_date).getFullYear()}` : ''}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </Card>
              ))}
            </View>
          ) : null
        }
        ListHeaderComponentStyle={{ marginBottom: families.length > 0 ? 0 : undefined }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(app)/family/[ulid]', params: { ulid: item.id } })}
            activeOpacity={0.8}
          >
            <Card style={styles.familyCard}>
              <View style={styles.familyIcon}>
                <Ionicons name="home-outline" size={22} color={AppColors.primary} />
              </View>
              <View style={styles.familyInfo}>
                <Text style={styles.familyName}>{item.family_name}</Text>
                <View style={styles.familyMeta}>
                  <Text style={styles.familyMetaText}>{item.member_count} üye</Text>
                  {item.pending_invitations_count > 0 && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>{item.pending_invitations_count} bekliyor</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.familyRoleBadge}>
                <Text style={styles.familyRoleText}>
                  {item.my_role === 'super_parent' ? 'Ana Veli' : 'Eş Veli'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.surfaceContainer} />
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          invitations.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="home-outline" size={48} color={AppColors.surfaceContainer} />
              <Text style={styles.emptyTitle}>Henüz aile profili yok</Text>
              <Text style={styles.emptyText}>Aile oluşturarak çocuklarınızı ve üyelerinizi yönetebilirsiniz.</Text>
              <Button
                label="İlk Ailemi Oluştur"
                variant="primary"
                size="md"
                onPress={() => setShowCreateModal(true)}
                style={styles.emptyBtn}
              />
            </View>
          ) : null
        }
      />

      {/* Aile Oluşturma Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Yeni Aile Oluştur</Text>
            <Text style={styles.modalSubtitle}>
              Aile oluşturduktan sonra diğer velileri davet edebilirsiniz.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Aile Adı</Text>
              <View style={styles.inputRow}>
                <Ionicons name="home-outline" size={17} color={AppColors.onSurfaceVariant} />
                <TextInput
                  style={styles.input}
                  value={createFamilyName}
                  onChangeText={setCreateFamilyName}
                  placeholder="Örn: Aydoğdu Ailesi"
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
                onPress={() => { setShowCreateModal(false); setCreateFamilyName(''); }}
              />
              <Button
                label="Oluştur"
                variant="primary"
                size="lg"
                loading={createLoading}
                onPress={handleCreateFamily}
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
  sectionLabelPad: { paddingHorizontal: 20, marginTop: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 12 },
  // Davet
  invitationCard: {
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.warning,
    gap: 10,
  },
  invitationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invitationIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitationInfo: { flex: 1 },
  invitationFamily: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface },
  invitationBy: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 2 },
  invitationEmail: { fontSize: 11, color: AppColors.onSurfaceVariant, marginTop: 1 },
  invitationActions: { flexDirection: 'row', gap: 8 },
  invitationChildren: {
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  invitationChildrenLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invitationChildTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  childTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  childTagText: { fontSize: 11, fontWeight: '600', color: AppColors.secondary },
  acceptBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: AppColors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: AppColors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Aile kartı
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 10,
  },
  familyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyInfo: { flex: 1 },
  familyName: { fontSize: 16, fontWeight: '800', color: AppColors.onSurface },
  familyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  familyMetaText: { fontSize: 12, color: AppColors.onSurfaceVariant },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  pendingBadgeText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  familyRoleBadge: {
    backgroundColor: AppColors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  familyRoleText: { fontSize: 11, fontWeight: '700', color: AppColors.primary },
  // Boş durum
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: AppColors.onSurface, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: AppColors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { marginTop: 24, alignSelf: 'center' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
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
