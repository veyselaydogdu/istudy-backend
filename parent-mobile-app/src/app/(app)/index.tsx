import { Ionicons } from '@expo/vector-icons';
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

type FeedTab = 'global' | 'schools';

const AVATAR_COLORS = ['#208AEF', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

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
          <Ionicons name="pin" size={12} color="#208AEF" />
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

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  pinnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  pinnedText: {
    fontSize: 11,
    color: '#208AEF',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  publishedAt: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  globalBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  globalBadgeText: {
    fontSize: 11,
    color: '#208AEF',
    fontWeight: '600',
  },
  content: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState<FeedTab>('schools');
  const [posts, setPosts] = useState<Post[]>([]);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Merhaba</Text>
          <Text style={styles.headerTitle}>Akış</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'global' && styles.tabActive]}
          onPress={() => setActiveTab('global')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="globe-outline"
            size={15}
            color={activeTab === 'global' ? '#FFFFFF' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'global' && styles.tabTextActive]}>
            Genel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schools' && styles.tabActive]}
          onPress={() => setActiveTab('schools')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="school-outline"
            size={15}
            color={activeTab === 'schools' ? '#FFFFFF' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'schools' && styles.tabTextActive]}>
            Okullarım
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#208AEF"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="newspaper-outline" size={40} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>Henüz paylaşım yok</Text>
              <Text style={styles.emptyText}>Yeni paylaşımlar burada görünecek.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <ActivityIndicator color="#208AEF" style={styles.loader} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerGreeting: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
    backgroundColor: '#208AEF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: '#DC2626',
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  loader: {
    paddingVertical: 20,
  },
});
