import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import api from '../../../../lib/api';
import { getApiError } from '../../../../lib/auth';

interface TeacherProfile {
  id: number;
  name: string;
  title: string | null;
  specialization: string | null;
  bio: string | null;
  experience_years: number;
  profile_photo: string | null;
  country: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  languages: string[] | null;
  blog_posts_count: number;
  followers_count: number;
  is_following: boolean;
  educations: Array<{ id: number; degree: string; institution: string; field_of_study: string | null; start_date: string; end_date: string | null }>;
  certificates: Array<{ id: number; name: string; issuer: string; issue_date: string }>;
  courses: Array<{ id: number; name: string; organizer: string; start_date: string }>;
  skills: Array<{ id: number; name: string; level: string | null }>;
}

interface BlogPost {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  published_at: string | null;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) { return ''; }
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) { return 'Bugün'; }
  if (days < 7) { return `${days}g önce`; }
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

export default function TeacherProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teacherId = Number(id);

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [postsLastPage, setPostsLastPage] = useState(1);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'posts' | 'info'>('posts');

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: TeacherProfile }>(`/parent/teachers/${teacherId}`);
      setProfile(res.data.data);
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  const fetchPosts = useCallback(
    async (page = 1) => {
      try {
        setPostsLoading(true);
        const res = await api.get<{
          data: BlogPost[];
          meta: { current_page: number; last_page: number };
        }>(`/parent/teachers/${teacherId}/posts?page=${page}`);
        if (page === 1) {
          setPosts(res.data.data);
        } else {
          setPosts((prev) => [...prev, ...res.data.data]);
        }
        setPostsPage(res.data.meta.current_page);
        setPostsLastPage(res.data.meta.last_page);
      } catch {
        // sessizce geç
      } finally {
        setPostsLoading(false);
      }
    },
    [teacherId]
  );

  useEffect(() => {
    void fetchProfile();
    void fetchPosts(1);
  }, [fetchProfile, fetchPosts]);

  const handleFollow = async () => {
    if (!profile) { return; }
    setFollowLoading(true);
    try {
      if (profile.is_following) {
        await api.delete(`/parent/teachers/${teacherId}/follow`);
        setProfile((prev) =>
          prev
            ? { ...prev, is_following: false, followers_count: prev.followers_count - 1 }
            : prev
        );
      } else {
        await api.post(`/parent/teachers/${teacherId}/follow`);
        setProfile((prev) =>
          prev
            ? { ...prev, is_following: true, followers_count: prev.followers_count + 1 }
            : prev
        );
      }
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async (blogPostId: number) => {
    const post = posts.find((p) => p.id === blogPostId);
    if (!post) { return; }
    try {
      if (post.is_liked) {
        await api.delete(`/parent/teacher-blogs/${blogPostId}/like`);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === blogPostId
              ? { ...p, is_liked: false, likes_count: p.likes_count - 1 }
              : p
          )
        );
      } else {
        await api.post(`/parent/teacher-blogs/${blogPostId}/like`);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === blogPostId
              ? { ...p, is_liked: true, likes_count: p.likes_count + 1 }
              : p
          )
        );
      }
    } catch {
      // sessizce geç
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={AppColors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.errorCenter}>
          <Text style={styles.errorText}>{error ?? 'Öğretmen bulunamadı.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initial = profile.name.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Öğretmen Profili</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          {profile.title ? <Text style={styles.subtitle}>{profile.title}</Text> : null}
          {profile.specialization ? (
            <Text style={styles.specialization}>{profile.specialization}</Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.blog_posts_count}</Text>
              <Text style={styles.statLabel}>Blog</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.followers_count}</Text>
              <Text style={styles.statLabel}>Takipçi</Text>
            </View>
            {profile.experience_years > 0 ? (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.experience_years}</Text>
                  <Text style={styles.statLabel}>Yıl Deneyim</Text>
                </View>
              </>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.followBtn, profile.is_following && styles.followBtnActive]}
            onPress={handleFollow}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator color={profile.is_following ? AppColors.primary : '#FFFFFF'} size="small" />
            ) : (
              <>
                <Ionicons
                  name={profile.is_following ? 'person-remove-outline' : 'person-add-outline'}
                  size={16}
                  color={profile.is_following ? AppColors.primary : '#FFFFFF'}
                />
                <Text
                  style={[styles.followBtnText, profile.is_following && styles.followBtnTextActive]}
                >
                  {profile.is_following ? 'Takibi Bırak' : 'Takip Et'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Bio */}
        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hakkında</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* Section tabs */}
        <View style={styles.sectionTabBar}>
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'posts' && styles.sectionTabActive]}
            onPress={() => setActiveSection('posts')}
          >
            <Text
              style={[
                styles.sectionTabText,
                activeSection === 'posts' && styles.sectionTabTextActive,
              ]}
            >
              Blog Yazıları
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'info' && styles.sectionTabActive]}
            onPress={() => setActiveSection('info')}
          >
            <Text
              style={[
                styles.sectionTabText,
                activeSection === 'info' && styles.sectionTabTextActive,
              ]}
            >
              CV / Bilgiler
            </Text>
          </TouchableOpacity>
        </View>

        {activeSection === 'posts' ? (
          <View style={styles.postList}>
            {posts.length === 0 && !postsLoading ? (
              <View style={styles.empty}>
                <Ionicons name="document-text-outline" size={36} color="#D1D5DB" />
                <Text style={styles.emptyText}>Henüz blog yazısı yok.</Text>
              </View>
            ) : (
              posts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postCard}
                  onPress={() =>
                    router.push(`/(app)/teachers/${teacherId}/blog/${post.id}` as never)
                  }
                >
                  {post.image_url ? (
                    <Image
                      source={{ uri: post.image_url }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Text style={styles.postTitle}>{post.title}</Text>
                  {post.description ? (
                    <Text style={styles.postDesc} numberOfLines={2}>
                      {post.description}
                    </Text>
                  ) : null}
                  <View style={styles.postFooter}>
                    <Text style={styles.postDate}>{timeAgo(post.published_at)}</Text>
                    <TouchableOpacity
                      style={styles.postStat}
                      onPress={() => handleLike(post.id)}
                    >
                      <Ionicons
                        name={post.is_liked ? 'heart' : 'heart-outline'}
                        size={15}
                        color={post.is_liked ? '#EF4444' : '#9CA3AF'}
                      />
                      <Text style={styles.postStatText}>{post.likes_count}</Text>
                    </TouchableOpacity>
                    <View style={styles.postStat}>
                      <Ionicons name="chatbubble-outline" size={14} color="#9CA3AF" />
                      <Text style={styles.postStatText}>{post.comments_count}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
            {postsLoading ? <ActivityIndicator color={AppColors.primary} style={styles.loader} /> : null}
            {postsPage < postsLastPage && !postsLoading ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => fetchPosts(postsPage + 1)}
              >
                <Text style={styles.loadMoreText}>Daha fazla yükle</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.cvSection}>
            {/* Eğitim */}
            {profile.educations.length > 0 ? (
              <View style={styles.cvGroup}>
                <Text style={styles.cvGroupTitle}>Eğitim Geçmişi</Text>
                {profile.educations.map((edu) => (
                  <View key={edu.id} style={styles.cvItem}>
                    <Text style={styles.cvItemTitle}>{edu.degree}</Text>
                    <Text style={styles.cvItemSub}>{edu.institution}</Text>
                    {edu.field_of_study ? (
                      <Text style={styles.cvItemMeta}>{edu.field_of_study}</Text>
                    ) : null}
                    <Text style={styles.cvItemMeta}>
                      {new Date(edu.start_date).getFullYear()} —{' '}
                      {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Devam ediyor'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Sertifikalar */}
            {profile.certificates.length > 0 ? (
              <View style={styles.cvGroup}>
                <Text style={styles.cvGroupTitle}>Sertifikalar</Text>
                {profile.certificates.map((cert) => (
                  <View key={cert.id} style={styles.cvItem}>
                    <Text style={styles.cvItemTitle}>{cert.name}</Text>
                    <Text style={styles.cvItemSub}>{cert.issuer}</Text>
                    <Text style={styles.cvItemMeta}>
                      {new Date(cert.issue_date).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Kurslar */}
            {profile.courses.length > 0 ? (
              <View style={styles.cvGroup}>
                <Text style={styles.cvGroupTitle}>Kurs & Seminerler</Text>
                {profile.courses.map((course) => (
                  <View key={course.id} style={styles.cvItem}>
                    <Text style={styles.cvItemTitle}>{course.name}</Text>
                    <Text style={styles.cvItemSub}>{course.organizer}</Text>
                    <Text style={styles.cvItemMeta}>
                      {new Date(course.start_date).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Yetenekler */}
            {profile.skills.length > 0 ? (
              <View style={styles.cvGroup}>
                <Text style={styles.cvGroupTitle}>Yetenekler</Text>
                <View style={styles.skillsWrap}>
                  {profile.skills.map((skill) => (
                    <View key={skill.id} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{skill.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {profile.educations.length === 0 &&
              profile.certificates.length === 0 &&
              profile.courses.length === 0 &&
              profile.skills.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Henüz bilgi eklenmemiş.</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  loader: { flex: 1, justifyContent: 'center' as never },
  backBtn: { padding: 16 },
  errorCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrap: { marginBottom: 12 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  name: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  subtitle: { fontSize: 14, color: AppColors.primary, fontWeight: '600', marginBottom: 2 },
  specialization: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statItem: { alignItems: 'center', paddingHorizontal: 20 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: '#F3F4F6' },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  followBtnActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: AppColors.primary,
  },
  followBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  followBtnTextActive: { color: AppColors.primary },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  bioText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  sectionTabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: 'center',
  },
  sectionTabActive: { backgroundColor: AppColors.primary },
  sectionTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  sectionTabTextActive: { color: '#FFFFFF' },
  postList: { paddingHorizontal: 16, paddingBottom: 24 },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postImage: { width: '100%', height: 160, borderRadius: 10, marginBottom: 10 },
  postTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  postDesc: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 10 },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  postDate: { flex: 1, fontSize: 12, color: '#9CA3AF' },
  postStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatText: { fontSize: 13, color: '#6B7280' },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    marginTop: 4,
  },
  loadMoreText: { fontSize: 13, fontWeight: '600', color: AppColors.primary },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  cvSection: { paddingHorizontal: 16, paddingBottom: 24 },
  cvGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cvGroupTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  cvItem: {
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
    paddingLeft: 12,
    marginBottom: 14,
  },
  cvItemTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  cvItemSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cvItemMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  skillChipText: { fontSize: 13, color: AppColors.primary, fontWeight: '600' },
});
