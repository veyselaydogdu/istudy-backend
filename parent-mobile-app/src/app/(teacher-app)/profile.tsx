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

import { useAuth } from '../_layout';
import api from '../../lib/api';
import { getApiError, teacherLogoutRequest } from '../../lib/auth';

interface Invitation {
  id: number;
  tenant_id: number;
  tenant_name: string | null;
  invited_by: string | null;
  invited_at: string | null;
}

interface Tenant {
  membership_id: number;
  tenant_id: number;
  tenant_name: string | null;
  status: string;
  schools: Array<{ id: number; name: string }>;
  joined_at: string | null;
}

interface BlogPost {
  id: number;
  title: string;
  is_published: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string | null;
}

export default function TeacherProfileScreen() {
  const { teacherUser, signOutTeacher } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Join tenant modal
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // New blog modal
  const [blogModalVisible, setBlogModalVisible] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogDescription, setBlogDescription] = useState('');
  const [blogLoading, setBlogLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tenantsRes, invitationsRes, blogsRes] = await Promise.all([
        api.get<{ data: Tenant[] }>('/teacher/memberships/my-tenants'),
        api.get<{ data: Invitation[] }>('/teacher/memberships/invitations'),
        api.get<{ data: BlogPost[]; meta: unknown }>('/teacher/blogs?per_page=5'),
      ]);
      setTenants(tenantsRes.data.data);
      setInvitations(invitationsRes.data.data);
      setBlogPosts(blogsRes.data.data);
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          try {
            await teacherLogoutRequest();
          } catch {
            // Ignore
          }
          await signOutTeacher();
          router.replace('/(auth)/teacher-login');
        },
      },
    ]);
  };

  const handleAcceptInvitation = async (id: number) => {
    try {
      await api.patch(`/teacher/memberships/invitations/${id}/accept`);
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
      void loadData();
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    }
  };

  const handleRejectInvitation = async (id: number) => {
    try {
      await api.patch(`/teacher/memberships/invitations/${id}/reject`);
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    }
  };

  const handleJoinTenant = async () => {
    if (!inviteCode.trim()) { return; }
    setJoinLoading(true);
    try {
      await api.post('/teacher/memberships/join', { invite_code: inviteCode.trim() });
      setInviteCode('');
      setJoinModalVisible(false);
      void loadData();
      Alert.alert('Başarılı', 'Katılma talebiniz gönderildi.');
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreateBlog = async () => {
    if (!blogTitle.trim()) {
      Alert.alert('Hata', 'Başlık zorunludur.');
      return;
    }
    setBlogLoading(true);
    try {
      await api.post('/teacher/blogs', {
        title: blogTitle.trim(),
        description: blogDescription.trim() || undefined,
        published_at: new Date().toISOString(),
      });
      setBlogTitle('');
      setBlogDescription('');
      setBlogModalVisible(false);
      void loadData();
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setBlogLoading(false);
    }
  };

  const handleDeleteBlog = (id: number) => {
    Alert.alert('Blog Yazısını Sil', 'Bu blog yazısını silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/teacher/blogs/${id}`);
            setBlogPosts((prev) => prev.filter((p) => p.id !== id));
          } catch (err: unknown) {
            Alert.alert('Hata', getApiError(err));
          }
        },
      },
    ]);
  };

  const initials = `${teacherUser?.name?.charAt(0) ?? ''}${teacherUser?.surname?.charAt(0) ?? ''}`.toUpperCase();

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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Profil</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>
            {teacherUser?.name} {teacherUser?.surname}
          </Text>
          <Text style={styles.profileEmail}>{teacherUser?.email}</Text>
        </View>

        {/* Davetler */}
        {invitations.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gelen Davetler</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{invitations.length}</Text>
              </View>
            </View>
            {invitations.map((inv) => (
              <View key={inv.id} style={styles.inviteCard}>
                <View style={styles.inviteIconWrap}>
                  <Ionicons name="mail-outline" size={20} color="#208AEF" />
                </View>
                <View style={styles.inviteInfo}>
                  <Text style={styles.inviteTenant}>{inv.tenant_name ?? 'Kurum'}</Text>
                  {inv.invited_by ? (
                    <Text style={styles.inviteBy}>Davet eden: {inv.invited_by}</Text>
                  ) : null}
                </View>
                <View style={styles.inviteActions}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAcceptInvitation(inv.id)}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleRejectInvitation(inv.id)}
                  >
                    <Ionicons name="close" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Kurumlarım */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kurumlarım</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setJoinModalVisible(true)}
            >
              <Ionicons name="add" size={16} color="#208AEF" />
              <Text style={styles.addBtnText}>Kuruma Katıl</Text>
            </TouchableOpacity>
          </View>
          {tenants.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Henüz bir kuruma üye değilsiniz.</Text>
            </View>
          ) : (
            tenants.map((t) => (
              <View key={t.membership_id} style={styles.tenantCard}>
                <View style={styles.tenantIconWrap}>
                  <Ionicons name="business-outline" size={18} color="#208AEF" />
                </View>
                <View style={styles.tenantInfo}>
                  <Text style={styles.tenantName}>{t.tenant_name ?? 'Kurum'}</Text>
                  {t.schools.length > 0 ? (
                    <Text style={styles.tenantSchools}>
                      {t.schools.map((s) => s.name).join(', ')}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    t.status === 'active' ? styles.statusActive : styles.statusInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      t.status === 'active' ? styles.statusTextActive : styles.statusTextInactive,
                    ]}
                  >
                    {t.status === 'active' ? 'Aktif' : 'Pasif'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Blog Yazılarım */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Blog Yazılarım</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setBlogModalVisible(true)}
            >
              <Ionicons name="add" size={16} color="#208AEF" />
              <Text style={styles.addBtnText}>Yeni Yazı</Text>
            </TouchableOpacity>
          </View>
          {blogPosts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Henüz blog yazısı yok.</Text>
            </View>
          ) : (
            blogPosts.map((post) => (
              <View key={post.id} style={styles.blogCard}>
                <View style={styles.blogInfo}>
                  <Text style={styles.blogTitle} numberOfLines={2}>
                    {post.title}
                  </Text>
                  <View style={styles.blogStats}>
                    <View style={styles.blogStat}>
                      <Ionicons name="heart-outline" size={13} color="#9CA3AF" />
                      <Text style={styles.blogStatText}>{post.likes_count}</Text>
                    </View>
                    <View style={styles.blogStat}>
                      <Ionicons name="chatbubble-outline" size={13} color="#9CA3AF" />
                      <Text style={styles.blogStatText}>{post.comments_count}</Text>
                    </View>
                    <View
                      style={[
                        styles.publishedBadge,
                        post.is_published && styles.publishedBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.publishedText,
                          post.is_published && styles.publishedTextActive,
                        ]}
                      >
                        {post.is_published ? 'Yayında' : 'Taslak'}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.blogDeleteBtn}
                  onPress={() => handleDeleteBlog(post.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Çıkış */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Kuruma Katıl Modal */}
      <Modal visible={joinModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Kuruma Katıl</Text>
            <Text style={styles.modalSubtitle}>
              Kurumun davet kodunu girerek katılma talebi gönderin.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Davet kodu"
              placeholderTextColor="#9CA3AF"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setInviteCode('');
                  setJoinModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, joinLoading && styles.btnDisabled]}
                onPress={handleJoinTenant}
                disabled={joinLoading}
              >
                {joinLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Talep Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Yeni Blog Modal */}
      <Modal visible={blogModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Yeni Blog Yazısı</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Başlık *"
              placeholderTextColor="#9CA3AF"
              value={blogTitle}
              onChangeText={setBlogTitle}
            />
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="İçerik (opsiyonel)"
              placeholderTextColor="#9CA3AF"
              value={blogDescription}
              onChangeText={setBlogDescription}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setBlogTitle('');
                  setBlogDescription('');
                  setBlogModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, blogLoading && styles.btnDisabled]}
                onPress={handleCreateBlog}
                disabled={blogLoading}
              >
                {blogLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Yayınla</Text>
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
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 20 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#DC2626', fontSize: 13, flex: 1 },
  profileCard: {
    backgroundColor: '#208AEF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarText: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  profileName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  profileEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', flex: 1 },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addBtnText: { fontSize: 13, color: '#208AEF', fontWeight: '600' },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#208AEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inviteIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inviteInfo: { flex: 1 },
  inviteTenant: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  inviteBy: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  inviteActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tenantIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tenantInfo: { flex: 1 },
  tenantName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  tenantSchools: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
  },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusInactive: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  statusTextActive: { color: '#059669' },
  statusTextInactive: { color: '#EF4444' },
  blogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  blogInfo: { flex: 1 },
  blogTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  blogStats: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  blogStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  blogStatText: { fontSize: 12, color: '#9CA3AF' },
  publishedBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F3F4F6',
  },
  publishedBadgeActive: { backgroundColor: '#D1FAE5' },
  publishedText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  publishedTextActive: { color: '#059669' },
  blogDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  empty: { paddingVertical: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 4,
  },
  logoutButtonText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 20 },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#208AEF',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
