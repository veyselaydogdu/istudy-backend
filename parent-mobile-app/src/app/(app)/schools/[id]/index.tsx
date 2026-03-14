import { router, useLocalSearchParams } from 'expo-router';
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

import api from '../../../../lib/api';
import { getApiError } from '../../../../lib/auth';

interface SchoolDetail {
  id: number;
  name: string;
  type: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  current_academic_year: { id: number; name: string } | null;
}

interface Post {
  id: number;
  content: string;
  visibility: string;
  is_pinned: boolean;
  published_at: string | null;
  author: { id: number; name: string; surname: string } | null;
  reactions_count: number;
  comments_count: number;
}

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchSchool = useCallback(async () => {
    try {
      const response = await api.get<{ data: SchoolDetail }>(`/parent/schools/${id}`);
      setSchool(response.data.data);
    } catch (err: unknown) {
      void getApiError(err);
    }
  }, [id]);

  const fetchPosts = useCallback(async (currentPage = 1, isRefresh = false) => {
    setPostsLoading(true);
    try {
      const response = await api.get<{
        data: Post[];
        meta: { current_page: number; last_page: number };
      }>(`/parent/schools/${id}/feed?page=${currentPage}`);
      const newPosts = response.data.data;
      const meta = response.data.meta;

      if (isRefresh || currentPage === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setPage(meta.current_page);
      setLastPage(meta.last_page);
    } catch {
      // sessizce geç
    } finally {
      setPostsLoading(false);
    }
  }, [id]);

  const loadAll = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    await Promise.all([fetchSchool(), fetchPosts(1, isRefresh)]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchSchool, fetchPosts]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadAll(true);
  };

  const handleLoadMore = () => {
    if (!postsLoading && page < lastPage) {
      void fetchPosts(page + 1);
    }
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
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {school?.name ?? 'Okul'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {item.is_pinned && (
              <Text style={styles.pinned}>📌 Sabitlenmiş</Text>
            )}
            <View style={styles.postAuthor}>
              <View style={styles.postAvatar}>
                <Text style={styles.postAvatarText}>
                  {item.author
                    ? item.author.name.charAt(0).toUpperCase()
                    : '?'}
                </Text>
              </View>
              <View>
                <Text style={styles.postAuthorName}>
                  {item.author
                    ? `${item.author.name} ${item.author.surname}`
                    : 'Bilinmiyor'}
                </Text>
                <Text style={styles.postDate}>
                  {item.published_at
                    ? new Date(item.published_at).toLocaleDateString('tr-TR')
                    : ''}
                </Text>
              </View>
            </View>
            <Text style={styles.postContent}>{item.content}</Text>
            <View style={styles.postFooter}>
              <Text style={styles.postStat}>👍 {item.reactions_count}</Text>
              <Text style={styles.postStat}>💬 {item.comments_count}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          school ? (
            <View style={styles.schoolCard}>
              <View style={styles.schoolIconBox}>
                <Text style={styles.schoolIconText}>🏫</Text>
              </View>
              <Text style={styles.schoolName}>{school.name}</Text>
              {school.type && <Text style={styles.schoolType}>{school.type}</Text>}
              {school.address && (
                <Text style={styles.schoolInfo}>📍 {school.address}</Text>
              )}
              {school.phone && (
                <Text style={styles.schoolInfo}>📞 {school.phone}</Text>
              )}
              {school.current_academic_year && (
                <View style={styles.yearBadge}>
                  <Text style={styles.yearBadgeText}>
                    {school.current_academic_year.name}
                  </Text>
                </View>
              )}
              <Text style={styles.feedTitle}>Okul Akışı</Text>
            </View>
          ) : null
        }
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
          !postsLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Henüz paylaşım yok.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          postsLoading ? (
            <ActivityIndicator color="#208AEF" style={styles.loader} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backText: { color: '#208AEF', fontSize: 15, fontWeight: '500', width: 60 },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', flex: 1, textAlign: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  schoolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  schoolIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  schoolIconText: { fontSize: 28 },
  schoolName: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  schoolType: { fontSize: 12, color: '#208AEF', fontWeight: '600' },
  schoolInfo: { fontSize: 13, color: '#6B7280' },
  yearBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  yearBadgeText: { color: '#059669', fontSize: 12, fontWeight: '600' },
  feedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  pinned: { fontSize: 11, color: '#208AEF', fontWeight: '600', marginBottom: 8 },
  postAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  postAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#208AEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAvatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  postAuthorName: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  postDate: { fontSize: 11, color: '#9CA3AF' },
  postContent: { fontSize: 14, color: '#374151', lineHeight: 21, marginBottom: 10 },
  postFooter: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  postStat: { fontSize: 12, color: '#6B7280' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  loader: { paddingVertical: 20 },
});
