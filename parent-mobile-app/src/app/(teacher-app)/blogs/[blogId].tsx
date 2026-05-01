import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

interface BlogPost {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  is_published: boolean;
  published_at: string | null;
}

interface Comment {
  id: number;
  content: string;
  quoted_content: string | null;
  parent_comment_id: number | null;
  user: { id: number; name: string } | null;
  created_at: string | null;
  replies?: Comment[];
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) { return ''; }
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) { return `${mins}dk önce`; }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) { return `${hrs}sa önce`; }
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

function CommentItem({
  comment,
  onReply,
  onDelete,
}: {
  comment: Comment;
  onReply: (comment: Comment) => void;
  onDelete: (commentId: number) => void;
}) {
  return (
    <View style={[commentStyles.wrap, comment.parent_comment_id !== null && commentStyles.replyWrap]}>
      {comment.quoted_content ? (
        <View style={commentStyles.quoteBox}>
          <Text style={commentStyles.quoteText} numberOfLines={2}>
            {comment.quoted_content}
          </Text>
        </View>
      ) : null}
      <View style={commentStyles.row}>
        <View style={commentStyles.avatar}>
          <Text style={commentStyles.avatarText}>
            {(comment.user?.name ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={commentStyles.bubble}>
          <Text style={commentStyles.userName}>{comment.user?.name ?? 'Kullanıcı'}</Text>
          <Text style={commentStyles.content}>{comment.content}</Text>
          <View style={commentStyles.footer}>
            <Text style={commentStyles.time}>{timeAgo(comment.created_at)}</Text>
            <TouchableOpacity onPress={() => onReply(comment)}>
              <Text style={commentStyles.replyBtn}>Yanıtla</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(comment.id)}>
              <Ionicons name="trash-outline" size={13} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} onReply={onReply} onDelete={onDelete} />
      ))}
    </View>
  );
}

const commentStyles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  replyWrap: { marginLeft: 40 },
  quoteBox: {
    backgroundColor: AppColors.primaryContainer,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    marginLeft: 48,
  },
  quoteText: { fontSize: 12, color: AppColors.onSurfaceVariant, fontStyle: 'italic' },
  row: { flexDirection: 'row', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { color: AppColors.white, fontWeight: '700', fontSize: 14 },
  bubble: { flex: 1, backgroundColor: AppColors.white, borderRadius: 14, padding: 12 },
  userName: { fontSize: 13, fontWeight: '700', color: AppColors.onSurface, marginBottom: 4 },
  content: { fontSize: 14, color: AppColors.onSurface, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  time: { fontSize: 11, color: AppColors.onSurfaceVariant, flex: 1 },
  replyBtn: { fontSize: 12, color: AppColors.primary, fontWeight: '600' },
});

export default function TeacherBlogDetailScreen() {
  const { blogId } = useLocalSearchParams<{ blogId: string }>();
  const postId = Number(blogId);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsLastPage, setCommentsLastPage] = useState(1);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      void loadPost();
      void loadComments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId])
  );

  const loadPost = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: BlogPost }>(`/teacher/blogs/${postId}`);
      setPost(res.data.data);
    } catch {
      // sessizce geç
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (page = 1) => {
    try {
      const res = await api.get<{
        data: Comment[];
        meta: { current_page: number; last_page: number };
      }>(`/teacher/blogs/${postId}/comments?page=${page}`);
      if (page === 1) {
        setComments(res.data.data);
      } else {
        setComments((prev) => [...prev, ...res.data.data]);
      }
      setCommentsPage(res.data.meta.current_page);
      setCommentsLastPage(res.data.meta.last_page);
    } catch {
      // sessizce geç
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) { return; }
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { content: commentText.trim() };
      if (replyTo) {
        payload.parent_comment_id = replyTo.id;
        payload.quoted_content = replyTo.content.substring(0, 200);
      }
      const res = await api.post<{ data: Comment }>(
        `/teacher/blogs/${postId}/comments`,
        payload
      );
      const newComment = res.data.data;
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), newComment] } : c
          )
        );
      } else {
        setComments((prev) => [newComment, ...prev]);
      }
      setCommentText('');
      setReplyTo(null);
      setPost((prev) => prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev);
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commentId: number) => {
    Alert.alert('Yorumu Sil', 'Bu yorumu silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/teacher/blogs/${postId}/comments/${commentId}`);
            setComments((prev) => {
              const filtered = prev.filter((c) => c.id !== commentId);
              return filtered.map((c) => ({
                ...c,
                replies: c.replies?.filter((r) => r.id !== commentId) ?? [],
              }));
            });
            setPost((prev) => prev ? { ...prev, comments_count: Math.max(0, prev.comments_count - 1) } : prev);
          } catch (err: unknown) {
            Alert.alert('Hata', getApiError(err));
          }
        },
      },
    ]);
  };

  const handleReply = (comment: Comment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={AppColors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Blog Detayı</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <CommentItem comment={item} onReply={handleReply} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (commentsPage < commentsLastPage) { void loadComments(commentsPage + 1); }
          }}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            post ? (
              <View style={styles.postCard}>
                {post.image_url ? (
                  <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
                ) : null}
                <View style={styles.postMeta}>
                  {post.is_published ? (
                    <View style={styles.publishedBadge}>
                      <Text style={styles.publishedText}>Yayında</Text>
                    </View>
                  ) : (
                    <View style={[styles.publishedBadge, styles.draftBadge]}>
                      <Text style={[styles.publishedText, styles.draftText]}>Taslak</Text>
                    </View>
                  )}
                  {post.published_at ? (
                    <Text style={styles.postDate}>
                      {new Date(post.published_at).toLocaleDateString('tr-TR')}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.postTitle}>{post.title}</Text>
                {post.description ? (
                  <Text style={styles.postDesc}>{post.description}</Text>
                ) : null}
                <View style={styles.postStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="heart" size={16} color={AppColors.error} />
                    <Text style={styles.statText}>{post.likes_count} beğeni</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="chatbubble-outline" size={16} color={AppColors.onSurfaceVariant} />
                    <Text style={styles.statText}>{post.comments_count} yorum</Text>
                  </View>
                </View>
                <Text style={styles.commentsHeading}>Yorumlar</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubble-outline" size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>Henüz yorum yok.</Text>
            </View>
          }
        />

        {replyTo ? (
          <View style={styles.replyIndicator}>
            <View style={styles.replyIndicatorContent}>
              <Ionicons name="return-down-forward-outline" size={14} color={AppColors.primary} />
              <Text style={styles.replyIndicatorText} numberOfLines={1}>
                {replyTo.user?.name ?? 'Kullanıcı'}: {replyTo.content}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Yorum yaz..."
            placeholderTextColor="#9CA3AF"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
            onPress={handleSubmitComment}
            disabled={submitting || !commentText.trim()}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainerLow,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.onSurface },
  list: { padding: 16, paddingBottom: 8 },
  postCard: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  postImage: { width: '100%', height: 200 },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    paddingBottom: 8,
  },
  publishedBadge: {
    backgroundColor: AppColors.successContainer,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  publishedText: { fontSize: 12, fontWeight: '600', color: AppColors.success },
  draftBadge: { backgroundColor: AppColors.surfaceContainerLow },
  draftText: { color: AppColors.onSurfaceVariant },
  postDate: { fontSize: 12, color: AppColors.onSurfaceVariant },
  postTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.onSurface,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  postDesc: {
    fontSize: 15,
    color: AppColors.onSurface,
    lineHeight: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  postStats: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainerLow,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, color: AppColors.onSurfaceVariant, fontWeight: '500' },
  commentsHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.onSurface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainerLow,
  },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 14, color: AppColors.onSurfaceVariant, textAlign: 'center' },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  replyIndicatorContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyIndicatorText: { fontSize: 13, color: AppColors.onSurface, flex: 1 },
  errorText: {
    fontSize: 12,
    color: AppColors.error,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#FEE2E2',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainerLow,
  },
  input: {
    flex: 1,
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.onSurface,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: AppColors.surfaceContainer,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#93C5FD' },
});
