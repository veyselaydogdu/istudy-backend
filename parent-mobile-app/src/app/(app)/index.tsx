import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { TabSelector } from '@/components/ui/TabSelector';
import api from '../../lib/api';
import { getApiError } from '../../lib/auth';

interface Post {
  title: string;
  id: number;
  school_id: number;
  content: string;
  visibility: string;
  is_pinned: boolean;
  is_global: boolean;
  published_at: string | null;
  author: { id: number; name: string; surname: string } | null;
  media: Array<{ id: number; url: string; type: string }>;
  reactions_count: number;
  comments_count: number;
}

interface BlogPost {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  teacher: { id: number; name: string; title: string | null } | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  published_at: string | null;
}

type FeedTab = 'global' | 'schools' | 'teachers';

function timeAgo(dateStr: string | null): string {
  if (!dateStr) { return ''; }
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) { return `${mins}dk önce`; }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) { return `${hrs}sa önce`; }
  const days = Math.floor(hrs / 24);
  if (days < 7) { return `${days}g önce`; }
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

function PostCard({ post }: { post: Post }) {
  const authorName = post.author
    ? `${post.author.name} ${post.author.surname}`
    : 'Bilinmiyor';

  return (
      <TouchableOpacity onPress={() => router.push(`/(app)/schools/${post.school_id}/post/${post.id}` as never)} activeOpacity={0.88}>
        <Card style={styles.postCard}>
      {post.is_pinned && (
        <View style={styles.pinnedRow}>
          <Ionicons name="pin" size={12} color={AppColors.secondary} />
          <Text style={styles.pinnedText}>Sabitlenmiş</Text>
        </View>
      )}
            {post.media.length > 0 && (
                <Image
                    source={{ uri: post.media[0].url }}
                    style={styles.postImage}
                    resizeMode="cover"
                />
            )}
            <View style={styles.authorRow}>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.title}</Text>
        </View>
        {post.is_global && (
          <View style={styles.globalBadge}>
            <Text style={styles.globalBadgeText}>Genel</Text>
          </View>
        )}
      </View>
      <Text style={styles.content}>{post.content}</Text>
      <View style={styles.footer}>
          <View style={styles.footerInIcons}>
              <View style={styles.stat}>
                  <Ionicons name="heart-outline" size={18} color={AppColors.onSurfaceVariant} />
                  <Text style={styles.statText}>{post.reactions_count}</Text>
              </View>
              <View style={styles.stat}>
                  <Ionicons name="chatbubble-outline" size={18} color={AppColors.onSurfaceVariant} />
                  <Text style={styles.statText}>{post.comments_count}</Text>
              </View>
          </View>
        <View style={styles.publishedAt}>
          <Text style={styles.publishedAt}>{timeAgo(post.published_at)}</Text>
        </View>
      </View>
    </Card>
      </TouchableOpacity>
  );
}

function BlogPostCard({ post, onLike }: { post: BlogPost; onLike: (id: number) => void }) {
  const teacherName = post.teacher?.name ?? 'Öğretmen';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => router.push(`/(app)/teachers/${post.teacher?.id}/blog/${post.id}` as never)}
    >
      <Card style={styles.postCard}>
        <View style={styles.authorRow}>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/teachers/${post.teacher?.id}` as never)}
          >
            <Avatar name={teacherName} size={48} shape="rounded" color={AppColors.secondary} />
          </TouchableOpacity>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{teacherName}</Text>
            {post.teacher?.title ? (
              <Text style={styles.publishedAt}>{post.teacher.title}</Text>
            ) : null}
          </View>
          <Text style={styles.publishedAt}>{timeAgo(post.published_at)}</Text>
        </View>
        <Text style={styles.blogTitle}>{post.title}</Text>
        {post.description ? (
          <Text style={styles.content} numberOfLines={3}>
            {post.description}
          </Text>
        ) : null}
        {post.image_url ? (
          <Image
            source={{ uri: post.image_url }}
            style={styles.postImage}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.stat} onPress={() => onLike(post.id)}>
            <Ionicons
              name={post.is_liked ? 'heart' : 'heart-outline'}
              size={18}
              color={post.is_liked ? AppColors.errorContainer : AppColors.onSurfaceVariant}
            />
            <Text style={styles.statText}>{post.likes_count}</Text>
          </TouchableOpacity>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={18} color={AppColors.onSurfaceVariant} />
            <Text style={styles.statText}>{post.comments_count}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const FEED_TABS = [
  { key: 'global' as FeedTab, label: 'Genel' },
  { key: 'schools' as FeedTab, label: 'Okullarım' },
  { key: 'teachers' as FeedTab, label: 'Öğretmenler' },
];

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState<FeedTab>('schools');
  const [posts, setPosts] = useState<Post[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (currentPage = 1, isRefresh = false) => {
      if (loading && !isRefresh) { return; }
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'teachers') {
          const response = await api.get<{
            data: BlogPost[];
            meta: { current_page: number; last_page: number };
          }>(`/parent/teacher-feed?page=${currentPage}`);
          const newPosts = response.data.data;
          const meta = response.data.meta;
          if (isRefresh || currentPage === 1) {
            setBlogPosts(newPosts);
          } else {
            setBlogPosts((prev) => [...prev, ...newPosts]);
          }
          setPage(meta.current_page);
          setLastPage(meta.last_page);
        } else {
          const endpoint =
            activeTab === 'global'
              ? `/parent/feed/global?page=${currentPage}`
              : `/parent/feed/schools?page=${currentPage}`;
          const response = await api.get<{
            data: Post[];
            meta: { current_page: number; last_page: number };
          }>(endpoint);
          const newPosts = response.data.data;
          const meta = response.data.meta;
          if (isRefresh || currentPage === 1) {
            setPosts(newPosts);
          } else {
            setPosts((prev) => [...prev, ...newPosts]);
          }
          setPage(meta.current_page);
          setLastPage(meta.last_page);
        }
      } catch (err: unknown) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab]
  );

  useEffect(() => {
    void fetchPosts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchPosts(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && page < lastPage) {
      void fetchPosts(page + 1);
    }
  };

  const handleLike = async (blogPostId: number) => {
    const post = blogPosts.find((p) => p.id === blogPostId);
    if (!post) { return; }
    try {
      if (post.is_liked) {
        await api.delete(`/parent/teacher-blogs/${blogPostId}/like`);
        setBlogPosts((prev) =>
          prev.map((p) =>
            p.id === blogPostId
              ? { ...p, is_liked: false, likes_count: p.likes_count - 1 }
              : p
          )
        );
      } else {
        await api.post(`/parent/teacher-blogs/${blogPostId}/like`);
        setBlogPosts((prev) =>
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" backgroundColor={AppColors.white} />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Merhaba 👋</Text>
          <Text style={styles.headerTitle}>Okul Günlüğü</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color={AppColors.onSurfaceVariant} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabWrap}>
        <TabSelector tabs={FEED_TABS} activeKey={activeTab} onSelect={setActiveTab} />
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={AppColors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {activeTab === 'teachers' ? (
        <FlatList
          data={blogPosts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <BlogPostCard post={item} onLike={handleLike} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={AppColors.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="person-circle-outline" size={44} color={AppColors.surfaceContainer} />
                </View>
                <Text style={styles.emptyTitle}>Henüz blog yazısı yok</Text>
                <Text style={styles.emptyText}>Takip ettiğiniz öğretmenlerin yazıları burada görünecek.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loading && blogPosts.length > 0 ? <ActivityIndicator color={AppColors.primary} style={styles.loader} /> : null
          }
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={AppColors.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="newspaper-outline" size={44} color={AppColors.surfaceContainer} />
                </View>
                <Text style={styles.emptyTitle}>Henüz paylaşım yok</Text>
                <Text style={styles.emptyText}>Yeni paylaşımlar burada görünecek.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loading && posts.length > 0 ? <ActivityIndicator color={AppColors.primary} style={styles.loader} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.white },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainer,
  },
  headerGreeting: {
    fontSize: 12,
    color: AppColors.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: AppColors.primary,
    letterSpacing: -0.3,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.error,
    borderWidth: 1.5,
    borderColor: AppColors.primaryContainer,
  },
  tabWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainer,
  },

  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
    backgroundColor: AppColors.surface,
  },

  postCard: { borderRadius: 16, padding: 16 },
  pinnedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  pinnedText: { fontSize: 11, color: AppColors.secondary, fontWeight: '700' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 18, fontWeight: '600', color: AppColors.onSurface },
  publishedAt: { fontSize: 11, color: AppColors.onSurfaceVariant, fontWeight: '500', marginTop: 1},
  globalBadge: { backgroundColor: AppColors.primaryContainer, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  globalBadgeText: { fontSize: 10, color: AppColors.primary, fontWeight: '700' },
  blogTitle: { fontSize: 16, fontWeight: '800', color: AppColors.onSurface, marginBottom: 6 },
  content: { fontSize: 14, color: AppColors.onSurface, lineHeight: 22, marginBottom: 12, fontWeight: '500' },
  postImage: { width: '100%', height: 190, borderRadius: 12, marginBottom: 12},
  footer: { flexDirection: 'row', gap: 18, borderTopWidth: 1, borderTopColor: AppColors.surfaceContainer, paddingTop: 10, marginTop: 4, justifyContent: "space-between" },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, color: AppColors.onSurfaceVariant, fontWeight: '600' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 8, backgroundColor: '#fee2e2', borderRadius: 12, padding: 12 },
  errorText: { color: AppColors.error, fontSize: 13, flex: 1, fontWeight: '500' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 28, backgroundColor: AppColors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: AppColors.onSurface },
  emptyText: { fontSize: 13, color: AppColors.onSurfaceVariant, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  loader: { paddingVertical: 20 },
  footerInIcons: { flexDirection: 'row', gap: 18 },
});
