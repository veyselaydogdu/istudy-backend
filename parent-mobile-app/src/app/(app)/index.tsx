import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { AppHeader } from '@/components/ui/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { PillTabs } from '@/components/ui/PillTabs';
import { PrivateImage } from '@/components/ui/PrivateImage';
import api from '../../lib/api';
import { getApiError } from '../../lib/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Post {
  title: string;
  id: number;
  school_id: number;
  school_name: string | null;
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

type FeedTab = 'schools' | 'teachers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const CONTENT_LIMIT = 200;

// ─── Post Card ───────────────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = post.content.length > CONTENT_LIMIT;
  const displayContent = isLong && !expanded
    ? post.content.slice(0, CONTENT_LIMIT) + '...'
    : post.content;

  const authorName = post.author
    ? `${post.author.name} ${post.author.surname}`
    : post.school_name ?? 'Okul';

  return (
    <TouchableOpacity
      onPress={() => router.replace(`/(app)/schools/${post.school_id}/post/${post.id}` as never)}
      activeOpacity={0.88}
    >
      <View style={styles.card}>
        {/* Decorative blob */}
        <View style={styles.cardBlob} />

        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.authorLeft}>
            <Avatar name={authorName} size={48} shape="rounded" color={AppColors.primary} />
            <View style={styles.authorMeta}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName} numberOfLines={1}>{authorName}</Text>
                {post.is_pinned && (
                  <Ionicons name="pin" size={12} color={AppColors.secondary} />
                )}
                {post.is_global && (
                  <View style={styles.globalBadge}>
                    <Text style={styles.globalBadgeText}>Genel</Text>
                  </View>
                )}
              </View>
              <Text style={styles.authorSub}>
                {post.school_name ? `${post.school_name} • ` : ''}{timeAgo(post.published_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.postTitle}>{post.title}</Text>

        {/* Content */}
        <Text style={styles.content}>{displayContent}</Text>
        {isLong && !expanded && (
          <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); setExpanded(true); }} activeOpacity={0.7}>
            <Text style={styles.readMore}>devamını oku</Text>
          </TouchableOpacity>
        )}

        {/* Image */}
        {post.media.length > 0 && (
          <View style={styles.imageWrap}>
            <PrivateImage uri={post.media[0].url} style={styles.postImage} />
          </View>
        )}

        {/* Action bar */}
        <View style={styles.actionBar}>
          <View style={styles.actionLeft}>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="heart" size={18} color={AppColors.primary} />
              </View>
              <Text style={styles.actionCount}>{post.reactions_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <View style={[styles.actionIconWrap, styles.actionIconTertiary]}>
                <Ionicons name="chatbubble" size={18} color={AppColors.tertiary} />
              </View>
              <Text style={styles.actionCount}>{post.comments_count}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={18} color={AppColors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Blog Post Card ───────────────────────────────────────────────────────────

function BlogPostCard({ post, onLike }: { post: BlogPost; onLike: (id: number) => void }) {
  const teacherName = post.teacher?.name ?? 'Öğretmen';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => router.push(`/(app)/teachers/${post.teacher?.id}/blog/${post.id}` as never)}
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.authorLeft}>
            <TouchableOpacity onPress={() => router.push(`/(app)/teachers/${post.teacher?.id}` as never)}>
              <Avatar name={teacherName} size={48} shape="rounded" color={AppColors.secondary} />
            </TouchableOpacity>
            <View style={styles.authorMeta}>
              <Text style={styles.authorName}>{teacherName}</Text>
              <Text style={styles.authorSub}>
                {post.teacher?.title ? `${post.teacher.title} • ` : ''}{timeAgo(post.published_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        {post.image_url ? (
          <>
            <Text style={styles.postTitle}>{post.title}</Text>
            {post.description ? (
              <Text style={styles.content} numberOfLines={3}>{post.description}</Text>
            ) : null}
            <View style={styles.imageWrap}>
              <PrivateImage uri={post.image_url} style={styles.postImage} />
            </View>
          </>
        ) : (
          /* Gradient announcement card when no image */
          <View style={styles.announcementCard}>
            <View style={styles.announcementBlob} />
            <View style={styles.announcementIcon}>
              <Ionicons name="megaphone" size={22} color={AppColors.white} />
            </View>
            <Text style={styles.announcementTitle}>{post.title}</Text>
            {post.description ? (
              <Text style={styles.announcementDesc}>{post.description}</Text>
            ) : null}
          </View>
        )}

        {/* Action bar */}
        <View style={styles.actionBar}>
          <View style={styles.actionLeft}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(post.id)} activeOpacity={0.7}>
              <View style={[styles.actionIconWrap, post.is_liked && styles.actionIconLiked]}>
                <Ionicons
                  name={post.is_liked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={post.is_liked ? AppColors.error : AppColors.onSurfaceVariant}
                />
              </View>
              <Text style={styles.actionCount}>{post.likes_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <View style={[styles.actionIconWrap, styles.actionIconTertiary]}>
                <Ionicons name="chatbubble-outline" size={18} color={AppColors.onSurfaceVariant} />
              </View>
              <Text style={styles.actionCount}>{post.comments_count}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Feed Tabs ────────────────────────────────────────────────────────────────

const FEED_TABS: { key: FeedTab; label: string }[] = [
  { key: 'schools', label: 'Okullarım' },
  { key: 'teachers', label: 'Öğretmenler' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

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
          const response = await api.get<{
            data: Post[];
            meta: { current_page: number; last_page: number };
          }>(`/parent/feed/schools?page=${currentPage}`);
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
            p.id === blogPostId ? { ...p, is_liked: false, likes_count: p.likes_count - 1 } : p
          )
        );
      } else {
        await api.post(`/parent/teacher-blogs/${blogPostId}/like`);
        setBlogPosts((prev) =>
          prev.map((p) =>
            p.id === blogPostId ? { ...p, is_liked: true, likes_count: p.likes_count + 1 } : p
          )
        );
      }
    } catch {
      // sessizce geç
    }
  };

  const listHeader = (
    <>
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={AppColors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {/* Feed tab pills */}
      <PillTabs
        items={FEED_TABS}
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key as FeedTab)}
        showIcons={false}
        scrollable={true}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar style="dark" backgroundColor={AppColors.surfaceContainerLow} />
      <AppHeader hasBellNotification />

      {activeTab === 'teachers' ? (
        <FlatList
          data={blogPosts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <BlogPostCard post={item} onLike={handleLike} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={listHeader}
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
            loading && blogPosts.length > 0
              ? <ActivityIndicator color={AppColors.primary} style={styles.loader} />
              : null
          }
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={listHeader}
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
            loading && posts.length > 0
              ? <ActivityIndicator color={AppColors.primary} style={styles.loader} />
              : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.surfaceContainerLow,
  },

  // ── List ──
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },

  // ── Card ──
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 28,
    padding: 18,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    gap: 12,
  },
  cardBlob: {
    position: 'absolute',
    top: -32,
    right: -32,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.primaryContainer,
    opacity: 0.2,
  },

  // ── Card header ──
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  authorMeta: {
    flex: 1,
    gap: 2,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.onSurface,
    flexShrink: 1,
  },
  authorSub: {
    fontSize: 12,
    color: AppColors.tertiary,
    fontWeight: '600',
  },
  globalBadge: {
    backgroundColor: AppColors.primaryContainer,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  globalBadgeText: {
    fontSize: 10,
    color: AppColors.primary,
    fontWeight: '700',
  },

  // ── Content ──
  postTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.onSurface,
  },
  content: {
    fontSize: 14,
    color: AppColors.onSurface,
    lineHeight: 22,
    fontWeight: '500',
  },
  readMore: {
    fontSize: 13,
    color: AppColors.primary,
    fontWeight: '700',
    marginTop: -4,
  },

  // ── Image ──
  imageWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },

  // ── Announcement card (blog without image) ──
  announcementCard: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: AppColors.primary,
    overflow: 'hidden',
    gap: 8,
  },
  announcementBlob: {
    position: 'absolute',
    bottom: -24,
    right: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  announcementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.white,
    lineHeight: 24,
  },
  announcementDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    fontWeight: '500',
  },

  // ── Action bar ──
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: `${AppColors.surfaceContainer}80`,
    paddingTop: 10,
    marginTop: 2,
  },
  actionLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconTertiary: {
    backgroundColor: AppColors.surfaceContainerLow,
  },
  actionIconLiked: {
    backgroundColor: AppColors.errorContainer,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '800',
    color: AppColors.onSurface,
  },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Misc ──
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: AppColors.error,
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: AppColors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.onSurface,
  },
  emptyText: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  loader: {
    paddingVertical: 20,
  },
});
