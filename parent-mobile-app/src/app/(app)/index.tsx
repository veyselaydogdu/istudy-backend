import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import api from '../../lib/api';
import { getApiError } from '../../lib/auth';

interface Post {
  id: number;
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

const AVATAR_COLORS = [AppColors.primary, '#8B5CF6', '#EC4899', AppColors.tertiary, AppColors.success];

function avatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

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
  const initial = authorName.charAt(0).toUpperCase();
  const color = avatarColor(authorName);

  return (
    <View style={cardStyles.card}>
      {post.is_pinned && (
        <View style={cardStyles.pinnedRow}>
          <Ionicons name="pin" size={12} color={AppColors.primary} />
          <Text style={cardStyles.pinnedText}>Sabitlenmiş</Text>
        </View>
      )}
      <View style={cardStyles.authorRow}>
        <View style={[cardStyles.avatar, { backgroundColor: color }]}>
          <Text style={cardStyles.avatarText}>{initial}</Text>
        </View>
        <View style={cardStyles.authorInfo}>
          <Text style={cardStyles.authorName}>{authorName}</Text>
          <Text style={cardStyles.publishedAt}>{timeAgo(post.published_at)}</Text>
        </View>
        {post.is_global && (
          <View style={cardStyles.globalBadge}>
            <Text style={cardStyles.globalBadgeText}>Genel</Text>
          </View>
        )}

      </View>
      <Text style={cardStyles.content}>{post.content}</Text>
      <View style={cardStyles.footer}>
        <View style={cardStyles.stat}>
          <Ionicons name="heart-outline" size={15} color="#6B7280" />
          <Text style={cardStyles.statText}>{post.reactions_count}</Text>
        </View>
        <View style={cardStyles.stat}>
          <Ionicons name="chatbubble-outline" size={15} color="#6B7280" />
          <Text style={cardStyles.statText}>{post.comments_count}</Text>
        </View>
      </View>
    </View>
  );
}

function BlogPostCard({ post, onLike }: { post: BlogPost; onLike: (id: number) => void }) {
  const teacherName = post.teacher?.name ?? 'Öğretmen';
  const initial = teacherName.charAt(0).toUpperCase();
  const color = avatarColor(teacherName);

  return (
    <TouchableOpacity
      style={cardStyles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/(app)/teachers/${post.teacher?.id}/blog/${post.id}` as never)}
    >
      <View style={cardStyles.authorRow}>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/teachers/${post.teacher?.id}` as never)}
        >
          <View style={[cardStyles.avatar, { backgroundColor: color }]}>
            <Text style={cardStyles.avatarText}>{initial}</Text>
          </View>
        </TouchableOpacity>
        <View style={cardStyles.authorInfo}>
          <Text style={cardStyles.authorName}>{teacherName}</Text>
          {post.teacher?.title ? (
            <Text style={cardStyles.publishedAt}>{post.teacher.title}</Text>
          ) : null}
        </View>
        <Text style={cardStyles.publishedAt}>{timeAgo(post.published_at)}</Text>
      </View>
      <Text style={blogCardStyles.blogTitle}>{post.title}</Text>
      {post.description ? (
        <Text style={cardStyles.content} numberOfLines={3}>
          {post.description}
        </Text>
      ) : null}
      {post.image_url ? (
        <Image
          source={{ uri: post.image_url }}
          style={blogCardStyles.blogImage}
          resizeMode="cover"
        />
      ) : null}
      <View style={cardStyles.footer}>
        <TouchableOpacity style={cardStyles.stat} onPress={() => onLike(post.id)}>
          <Ionicons
            name={post.is_liked ? 'heart' : 'heart-outline'}
            size={15}
            color={post.is_liked ? AppColors.errorContainer : AppColors.onSurfaceVariant}
          />
          <Text style={cardStyles.statText}>{post.likes_count}</Text>
        </TouchableOpacity>
        <View style={cardStyles.stat}>
          <Ionicons name="chatbubble-outline" size={15} color="#6B7280" />
          <Text style={cardStyles.statText}>{post.comments_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const blogCardStyles = StyleSheet.create({
  blogTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  blogImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: AppColors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    borderBottomWidth: 3,
    borderBottomColor: AppColors.surfaceContainer,
  },
  pinnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  pinnedText: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: '600',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  publishedAt: {
    fontSize: 12,
    color: AppColors.onSurfaceVariant,
    marginTop: 1,
  },
  globalBadge: {
    backgroundColor: AppColors.primaryContainer,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  globalBadgeText: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: '600',
  },
  content: {
    fontSize: 14,
    color: AppColors.onSurface,
    lineHeight: 22,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainer,
    paddingTop: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
    fontWeight: '500',
  },
});

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

  const TABS: Array<{ key: FeedTab; label: string; icon: string }> = [
    { key: 'global', label: 'Genel', icon: 'globe-outline' },
    { key: 'schools', label: 'Okullarım', icon: 'school-outline' },
    { key: 'teachers', label: 'Öğretmenler', icon: 'person-circle-outline' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Merhaba</Text>
          <Text style={styles.headerTitle}>Akış</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={22} color={AppColors.primary} />
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon as never}
              size={14}
              color={activeTab === tab.key ? AppColors.white : AppColors.onSurfaceVariant}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={AppColors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="person-circle-outline" size={40} color={AppColors.surfaceContainer} />
                </View>
                <Text style={styles.emptyTitle}>Henüz blog yazısı yok</Text>
                <Text style={styles.emptyText}>
                  Takip ettiğiniz öğretmenlerin yazıları burada görünecek.
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loading && blogPosts.length > 0 ? (
              <ActivityIndicator color={AppColors.primary} style={styles.loader} />
            ) : null
          }
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={AppColors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="newspaper-outline" size={40} color={AppColors.surfaceContainer} />
                </View>
                <Text style={styles.emptyTitle}>Henüz paylaşım yok</Text>
                <Text style={styles.emptyText}>Yeni paylaşımlar burada görünecek.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loading && posts.length > 0 ? (
              <ActivityIndicator color={AppColors.primary} style={styles.loader} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainer,
  },
  headerGreeting: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: AppColors.primary,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.primaryDim,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    gap: 6,
  },
  tabActive: {
    backgroundColor: AppColors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.onSurfaceVariant,
  },
  tabTextActive: {
    color: AppColors.white,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: AppColors.error,
    fontSize: 13,
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: AppColors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  emptyText: {
    fontSize: 14,
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
  },
  loader: {
    paddingVertical: 20,
  },
});
