import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../_layout';
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

interface ReplyTarget {
  rootId: number;
  name: string;
  quotedText: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) { return ''; }
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TeacherBlogDetailScreen() {
  const { blogId } = useLocalSearchParams<{ blogId: string }>();
  const postId = Number(blogId);
  const { teacherUser } = useAuth();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const inputRef = useRef<TextInput>(null);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: BlogPost }>(`/teacher/blogs/${postId}`);
      setPost(res.data.data);
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const res = await api.get<{ data: Comment[] }>(`/teacher/blogs/${postId}/comments?page=1&per_page=100`);
      setComments(res.data.data);
    } catch {
      // sessizce geç
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadPost();
      void loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId])
  );

  const handleSubmitComment = async () => {
    const text = commentText.trim();
    if (!text) { return; }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { content: text };
      if (replyTo) {
        body.parent_comment_id = replyTo.rootId;
        body.quoted_content = replyTo.quotedText.substring(0, 200);
      }
      const res = await api.post<{ data: Comment }>(`/teacher/blogs/${postId}/comments`, body);
      const newComment = res.data.data;
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.rootId ? { ...c, replies: [...(c.replies ?? []), newComment] } : c
          )
        );
      } else {
        setComments((prev) => [newComment, ...prev]);
      }
      setCommentText('');
      setReplyTo(null);
      setPost((prev) => prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: number) => {
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

  const startReply = (comment: Comment, rootId?: number) => {
    setReplyTo({ rootId: rootId ?? comment.id, name: comment.user?.name ?? 'Kullanıcı', quotedText: comment.content });
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  const teacherName = teacherUser ? `${teacherUser.name} ${teacherUser.surname}` : 'Öğretmen';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(teacher-app)' as never)} activeOpacity={0.7}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>Blog Yazısı</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={AppColors.primary} />
          </View>
        )}

        {!loading && error && (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { void loadPost(); void loadComments(); }}>
              <Text style={styles.retryBtnText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && post && (
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
            <View style={styles.postCard}>
              {post.image_url ? (
                <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
              ) : null}

              <View style={styles.postBody}>
                <View style={styles.authorRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{teacherName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.authorName}>{teacherName}</Text>
                    {post.published_at ? (
                      <Text style={styles.date}>
                        {new Date(post.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[styles.badge, post.is_published ? styles.badgePublished : styles.badgeDraft]}>
                    <Text style={[styles.badgeText, post.is_published ? styles.badgeTextPublished : styles.badgeTextDraft]}>
                      {post.is_published ? 'Yayında' : 'Taslak'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.postTitle}>{post.title}</Text>
                {post.description ? <Text style={styles.postContent}>{post.description}</Text> : null}

                <View style={styles.actionBar}>
                  <View style={styles.actionBtn}>
                    <Ionicons name="heart" size={16} color={AppColors.error} />
                    <Text style={styles.actionBtnText}>{post.likes_count}</Text>
                  </View>
                  <View style={styles.actionBtn}>
                    <Ionicons name="chatbubble-outline" size={16} color={AppColors.onSurfaceVariant} />
                    <Text style={styles.actionBtnText}>{post.comments_count}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.commentsTitle}>Yorumlar</Text>

            {comments.length === 0 && (
              <Text style={styles.noComments}>Henüz yorum yok. İlk yorumu sen yaz!</Text>
            )}

            {comments.map((item) => (
              <View key={item.id}>
                <View style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {(item.user?.name ?? '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentBubble}>
                    {item.quoted_content ? (
                      <View style={styles.quoteBox}>
                        <Text style={styles.quoteText} numberOfLines={2}>{item.quoted_content}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.commentAuthor}>{item.user?.name ?? 'Kullanıcı'}</Text>
                    <Text style={styles.commentContent}>{item.content}</Text>
                    <View style={styles.commentActions}>
                      <Text style={styles.commentDate}>{formatDate(item.created_at)}</Text>
                      <TouchableOpacity style={styles.commentActionBtn} onPress={() => startReply(item, item.id)}>
                        <Text style={styles.commentActionText}>Yanıtla</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.commentActionBtn} onPress={() => handleDeleteComment(item.id)}>
                        <Ionicons name="trash-outline" size={13} color={AppColors.onSurfaceVariant} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {item.replies?.map((reply) => (
                  <View key={reply.id} style={styles.replyItem}>
                    <View style={styles.replyConnector} />
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {(reply.user?.name ?? '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={[styles.commentBubble, styles.replyBubble]}>
                      <Text style={styles.commentAuthor}>{reply.user?.name ?? 'Kullanıcı'}</Text>
                      <Text style={styles.commentContent}>{reply.content}</Text>
                      <View style={styles.commentActions}>
                        <Text style={styles.commentDate}>{formatDate(reply.created_at)}</Text>
                        <TouchableOpacity style={styles.commentActionBtn} onPress={() => startReply(reply, item.id)}>
                          <Text style={styles.commentActionText}>Yanıtla</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.commentActionBtn} onPress={() => handleDeleteComment(reply.id)}>
                          <Ionicons name="trash-outline" size={13} color={AppColors.onSurfaceVariant} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}

        {!loading && !error && post && (
          <View style={styles.inputWrapper}>
            {replyTo ? (
              <View style={styles.replyBanner}>
                <Text style={styles.replyBannerText} numberOfLines={1}>↩ {replyTo.name} kişisine yanıt</Text>
                <TouchableOpacity onPress={() => setReplyTo(null)} activeOpacity={0.7}>
                  <Text style={styles.replyBannerClose}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.inputBar}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={replyTo ? 'Yanıt yaz...' : 'Yorum yaz...'}
                placeholderTextColor={AppColors.onSurfaceVariant}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={2000}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !commentText.trim() ? styles.sendBtnDisabled : null]}
                onPress={() => void handleSubmitComment()}
                disabled={submitting || !commentText.trim()}
                activeOpacity={0.7}
              >
                {submitting ? (
                  <ActivityIndicator color={AppColors.white} size="small" />
                ) : (
                  <Text style={styles.sendBtnText}>Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 14, color: AppColors.onSurfaceVariant, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: AppColors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: AppColors.white, fontWeight: '700', fontSize: 14 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceContainerLow,
  },
  backText: { color: AppColors.primary, fontSize: 15, fontWeight: '500', width: 60 },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: AppColors.onSurface, flex: 1, textAlign: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 12 },
  postCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  postImage: { width: '100%', height: 200 },
  postBody: { padding: 16 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: AppColors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: AppColors.white, fontSize: 16, fontWeight: '700' },
  authorName: { fontSize: 14, fontWeight: '600', color: AppColors.onSurface },
  date: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgePublished: { backgroundColor: AppColors.successContainer },
  badgeDraft: { backgroundColor: AppColors.surfaceContainerLow },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextPublished: { color: AppColors.success },
  badgeTextDraft: { color: AppColors.onSurfaceVariant },
  postTitle: { fontSize: 18, fontWeight: '800', color: AppColors.primary, marginBottom: 8 },
  postContent: { fontSize: 15, color: AppColors.onSurface, lineHeight: 23 },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainerLow,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceContainerLow,
  },
  actionBtnText: { fontSize: 14, color: AppColors.onSurface, fontWeight: '600' },
  commentsTitle: { fontSize: 16, fontWeight: '700', color: AppColors.onSurface, marginBottom: 10, marginTop: 4 },
  noComments: { fontSize: 13, color: AppColors.onSurfaceVariant, textAlign: 'center', paddingVertical: 20 },
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 4, alignItems: 'flex-start' },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: AppColors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2, flexShrink: 0,
  },
  commentAvatarText: { color: AppColors.white, fontSize: 12, fontWeight: '700' },
  commentBubble: { flex: 1, backgroundColor: AppColors.white, borderRadius: 12, padding: 10 },
  quoteBox: {
    backgroundColor: AppColors.primaryContainer,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
  },
  quoteText: { fontSize: 12, color: AppColors.onSurfaceVariant, fontStyle: 'italic' },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: AppColors.onSurface, marginBottom: 2 },
  commentContent: { fontSize: 14, color: AppColors.onSurface, lineHeight: 19 },
  commentActions: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12 },
  commentDate: { fontSize: 11, color: AppColors.onSurfaceVariant, flex: 1 },
  commentActionBtn: { paddingVertical: 2 },
  commentActionText: { fontSize: 12, color: AppColors.primary, fontWeight: '500' },
  replyItem: { flexDirection: 'row', gap: 10, marginBottom: 4, alignItems: 'flex-start', marginLeft: 42 },
  replyConnector: { position: 'absolute', left: -26, top: 0, bottom: 0, width: 2, backgroundColor: AppColors.surfaceContainerLow },
  replyBubble: { backgroundColor: AppColors.surfaceContainerLow },
  inputWrapper: { backgroundColor: AppColors.white, borderTopWidth: 1, borderTopColor: AppColors.surfaceContainerLow },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: AppColors.primaryContainer,
  },
  replyBannerText: { fontSize: 12, color: AppColors.primary, fontWeight: '500', flex: 1 },
  replyBannerClose: { fontSize: 14, color: AppColors.primary, fontWeight: '700', paddingLeft: 8 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: AppColors.surfaceContainerLow,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.onSurface,
  },
  sendBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: AppColors.surfaceContainer },
  sendBtnText: { color: AppColors.white, fontWeight: '700', fontSize: 14 },
});
