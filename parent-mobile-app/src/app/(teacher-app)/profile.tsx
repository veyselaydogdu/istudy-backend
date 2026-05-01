import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

interface JoinHistoryEntry {
  id: number;
  status_type: 'pending' | 'rejected' | 'removed';
  sent_at: string | null;
  joined_at: string | null;
}

interface JoinRequestGroup {
  school_id: number | null;
  school_name: string | null;
  tenant_id: number;
  tenant_name: string | null;
  current_status: 'pending' | 'rejected' | 'removed';
  pending_id: number | null;
  sent_at: string | null;
  history: JoinHistoryEntry[];
}

interface BlogPost {
  id: number;
  title: string;
  image_url: string | null;
  is_published: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string | null;
}

export default function TeacherProfileScreen() {
  const { teacherUser, signOutTeacher } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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
  const [blogImage, setBlogImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [blogLoading, setBlogLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tenantsRes, invitationsRes, joinRequestsRes, blogsRes] = await Promise.all([
        api.get<{ data: Tenant[] }>('/teacher/memberships/my-tenants'),
        api.get<{ data: Invitation[] }>('/teacher/memberships/invitations'),
        api.get<{ data: JoinRequest[] }>('/teacher/memberships/my-join-requests'),
        api.get<{ data: BlogPost[]; meta: unknown }>('/teacher/blogs?per_page=5'),
      ]);
      setTenants(tenantsRes.data.data);
      setInvitations(invitationsRes.data.data);
      setJoinRequests(joinRequestsRes.data.data);
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

  const isFirstRender = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      api.get<{ data: BlogPost[]; meta: unknown }>('/teacher/blogs?per_page=5')
        .then((res) => setBlogPosts(res.data.data))
        .catch(() => {});
    }, [])
  );

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

  const handleCancelJoinRequest = (pendingId: number) => {
    Alert.alert('Talebi İptal Et', 'Bu katılma talebini iptal etmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal Et',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/teacher/memberships/join-requests/${pendingId}`);
            const res = await api.get<{ data: JoinRequestGroup[] }>('/teacher/memberships/my-join-requests');
            setJoinRequests(res.data.data);
          } catch (err: unknown) {
            Alert.alert('Hata', getApiError(err));
          }
        },
      },
    ]);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  const handleJoinTenant = async () => {
    if (!inviteCode.trim()) { return; }
    setJoinLoading(true);
    try {
      await api.post('/teacher/memberships/join', { registration_code: inviteCode.trim() });
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

  const handlePickBlogImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setBlogImage(result.assets[0]);
    }
  };

  const handleCreateBlog = async () => {
    if (!blogTitle.trim()) {
      Alert.alert('Hata', 'Başlık zorunludur.');
      return;
    }
    setBlogLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', blogTitle.trim());
      if (blogDescription.trim()) {
        formData.append('description', blogDescription.trim());
      }
      formData.append('published_at', new Date().toISOString());
      if (blogImage) {
        const ext = (blogImage.uri.split('.').pop() ?? 'jpg').toLowerCase();
        formData.append('image', {
          uri: blogImage.uri,
          name: `blog.${ext}`,
          type: blogImage.mimeType ?? `image/${ext}`,
        } as never);
      }
      await api.post('/teacher/blogs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBlogTitle('');
      setBlogDescription('');
      setBlogImage(null);
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
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => router.push('/(teacher-app)/edit-profile')}>
            <Ionicons name="create-outline" size={15} color={AppColors.primary} />
            <Text style={styles.editProfileBtnText}>Profili Düzenle</Text>
          </TouchableOpacity>
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

        {/* Gönderilen Talepler */}
        {joinRequests.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gönderilen Talepler</Text>
              {joinRequests.some((g) => g.current_status === 'pending') ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {joinRequests.filter((g) => g.current_status === 'pending').length}
                  </Text>
                </View>
              ) : null}
            </View>
            {joinRequests.map((group) => {
              const groupKey = group.school_id ? `school_${group.school_id}` : `tenant_${group.tenant_id}`;
              const isExpanded = expandedGroups.has(groupKey);
              const statusIcon = group.current_status === 'pending' ? 'time-outline'
                : group.current_status === 'removed' ? 'remove-circle-outline'
                : 'close-circle-outline';
              const statusColor = group.current_status === 'pending' ? '#F59E0B'
                : group.current_status === 'removed' ? '#EA580C'
                : '#EF4444';
              const statusIconBg = group.current_status === 'pending' ? '#FEF3C7'
                : group.current_status === 'removed' ? '#FFF7ED'
                : '#FEE2E2';
              const statusBorderColor = group.current_status === 'pending' ? '#F59E0B'
                : group.current_status === 'removed' ? '#EA580C'
                : '#EF4444';
              const statusLabel = group.current_status === 'pending' ? 'Bekliyor'
                : group.current_status === 'removed' ? 'Kaldırıldı'
                : 'Reddedildi';
              const statusBadgeStyle = group.current_status === 'pending' ? styles.joinStatusPending
                : group.current_status === 'removed' ? styles.joinStatusRemoved
                : styles.joinStatusRejected;
              const statusTextStyle = group.current_status === 'pending' ? styles.joinStatusTextPending
                : group.current_status === 'removed' ? styles.joinStatusTextRemoved
                : styles.joinStatusTextRejected;

              return (
                <View key={groupKey} style={[styles.joinRequestCard, { borderLeftColor: statusBorderColor }]}>
                  <TouchableOpacity
                    style={styles.joinRequestCardInner}
                    onPress={() => toggleGroup(groupKey)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.joinRequestIconWrap, { backgroundColor: statusIconBg }]}>
                      <Ionicons name={statusIcon} size={20} color={statusColor} />
                    </View>
                    <View style={styles.joinRequestInfo}>
                      <Text style={styles.joinRequestTenant}>
                        {group.school_name ?? group.tenant_name ?? 'Okul'}
                      </Text>
                      {group.school_name ? (
                        <Text style={styles.joinRequestDate}>{group.tenant_name}</Text>
                      ) : null}
                      <Text style={styles.joinRequestDate}>
                        {group.sent_at ? new Date(group.sent_at).toLocaleDateString('tr-TR') : ''}
                      </Text>
                    </View>
                    <View style={[styles.joinStatusBadge, statusBadgeStyle]}>
                      <Text style={[styles.joinStatusText, statusTextStyle]}>{statusLabel}</Text>
                    </View>
                    {group.current_status === 'pending' && group.pending_id ? (
                      <TouchableOpacity
                        style={styles.cancelRequestBtn}
                        onPress={() => handleCancelJoinRequest(group.pending_id!)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    ) : null}
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={AppColors.onSurfaceVariant}
                      style={{ marginLeft: 4 }}
                    />
                  </TouchableOpacity>

                  {isExpanded ? (
                    <View style={styles.historySection}>
                      {group.history.map((entry, idx) => {
                        const eLabel = entry.status_type === 'pending' ? 'Bekliyor'
                          : entry.status_type === 'removed' ? 'Kaldırıldı'
                          : 'Reddedildi';
                        const eColor = entry.status_type === 'pending' ? '#F59E0B'
                          : entry.status_type === 'removed' ? '#EA580C'
                          : '#EF4444';
                        return (
                          <View key={entry.id} style={styles.historyItem}>
                            <View style={[styles.historyDot, { backgroundColor: eColor }]} />
                            {idx < group.history.length - 1 ? <View style={styles.historyLine} /> : null}
                            <View style={styles.historyItemContent}>
                              <Text style={[styles.historyLabel, { color: eColor }]}>{eLabel}</Text>
                              <Text style={styles.historyDate}>
                                {entry.sent_at ? new Date(entry.sent_at).toLocaleDateString('tr-TR') : ''}
                                {entry.joined_at ? ` — Katıldı: ${new Date(entry.joined_at).toLocaleDateString('tr-TR')}` : ''}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
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
              <TouchableOpacity
                key={post.id}
                style={styles.blogCard}
                onPress={() => router.push(`/(teacher-app)/blogs/${post.id}` as never)}
                activeOpacity={0.8}
              >
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
              </TouchableOpacity>
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
              Okulun kayıt kodunu girerek katılma talebi gönderin.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Kayıt kodu (örn: 7568B9E6)"
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
            <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickBlogImage}>
              <Ionicons name="image-outline" size={18} color={AppColors.primary} />
              <Text style={styles.imagePickerText}>
                {blogImage ? 'Görsel Seçildi' : 'Görsel Ekle (opsiyonel)'}
              </Text>
              {blogImage ? (
                <TouchableOpacity onPress={() => setBlogImage(null)}>
                  <Ionicons name="close-circle" size={18} color={AppColors.error} />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
            {blogImage ? (
              <Image
                source={{ uri: blogImage.uri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setBlogTitle('');
                  setBlogDescription('');
                  setBlogImage(null);
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
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: AppColors.onSurface, marginBottom: 20 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: AppColors.error, fontSize: 13, flex: 1 },
  profileCard: {
    backgroundColor: AppColors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    shadowColor: AppColors.primary,
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
  avatarText: { color: AppColors.white, fontSize: 28, fontWeight: '800' },
  profileName: { fontSize: 20, fontWeight: '800', color: AppColors.white },
  profileEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: AppColors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  editProfileBtnText: { fontSize: 13, fontWeight: '700', color: AppColors.primary },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AppColors.onSurface, flex: 1 },
  badge: {
    backgroundColor: AppColors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: AppColors.white, fontSize: 11, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primaryContainer,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addBtnText: { fontSize: 13, color: AppColors.primary, fontWeight: '600' },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
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
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inviteInfo: { flex: 1 },
  inviteTenant: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface },
  inviteBy: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 2 },
  inviteActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: AppColors.success,
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
  joinRequestCard: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  joinRequestCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  joinRequestIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  joinRequestInfo: { flex: 1 },
  joinRequestTenant: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface },
  joinRequestDate: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 2 },
  joinStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  joinStatusPending: { backgroundColor: '#FEF3C7' },
  joinStatusRejected: { backgroundColor: '#FEE2E2' },
  joinStatusRemoved: { backgroundColor: '#FFF7ED' },
  joinStatusText: { fontSize: 11, fontWeight: '700' },
  joinStatusTextPending: { color: '#D97706' },
  joinStatusTextRejected: { color: '#EF4444' },
  joinStatusTextRemoved: { color: '#EA580C' },
  cancelRequestBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  historySection: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainerLow,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    position: 'relative',
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
    marginRight: 10,
    zIndex: 1,
  },
  historyLine: {
    position: 'absolute',
    left: 4,
    top: 13,
    width: 2,
    height: 22,
    backgroundColor: AppColors.surfaceContainerLow,
  },
  historyItemContent: { flex: 1 },
  historyLabel: { fontSize: 13, fontWeight: '700' },
  historyDate: { fontSize: 11, color: AppColors.onSurfaceVariant, marginTop: 2 },
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
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
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tenantInfo: { flex: 1 },
  tenantName: { fontSize: 15, fontWeight: '700', color: AppColors.onSurface },
  tenantSchools: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 2 },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: AppColors.surfaceContainerLow,
  },
  statusActive: { backgroundColor: AppColors.successContainer },
  statusInactive: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 12, fontWeight: '600', color: AppColors.onSurfaceVariant },
  statusTextActive: { color: AppColors.success },
  statusTextInactive: { color: AppColors.error },
  blogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
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
  blogTitle: { fontSize: 14, fontWeight: '700', color: AppColors.onSurface, marginBottom: 6 },
  blogStats: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  blogStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  blogStatText: { fontSize: 12, color: AppColors.onSurfaceVariant },
  publishedBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: AppColors.surfaceContainerLow,
  },
  publishedBadgeActive: { backgroundColor: AppColors.successContainer },
  publishedText: { fontSize: 11, fontWeight: '600', color: AppColors.onSurfaceVariant },
  publishedTextActive: { color: AppColors.success },
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
  emptyText: { fontSize: 14, color: AppColors.onSurfaceVariant, textAlign: 'center' },
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
  logoutButtonText: { color: AppColors.error, fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: AppColors.onSurface, marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: AppColors.onSurfaceVariant, marginBottom: 16, lineHeight: 20 },
  modalInput: {
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: AppColors.onSurface,
    borderWidth: 1.5,
    borderColor: AppColors.surfaceContainer,
    marginBottom: 12,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.primaryContainer,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  imagePickerText: { fontSize: 14, color: AppColors.primary, fontWeight: '600', flex: 1 },
  imagePreview: { width: '100%', height: 160, borderRadius: 12, marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AppColors.surfaceContainerLow,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: AppColors.onSurfaceVariant },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: AppColors.white },
});
