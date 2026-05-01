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

import { AppColors } from '@/constants/theme';
import api from '../../../../../lib/api';
import { getApiError } from '../../../../../lib/auth';
import { useAuth } from '../../../../_layout';

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

interface Comment {
  id: number;
  content: string;
  quoted_content: string | null;
  parent_comment_id: number | null;
  user: { id: number; name: string } | null;
  created_at: string | null;
  replies?: Comment[];
}

export default function BlogDetailScreen() {
  const { id, blogId } = useLocalSearchParams<{ id: string; blogId: string }>();
  const postId = Number(blogId);
  const { user } = useAuth();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ rootId: number; name: string; quotedText: string } | null>(null);
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      void loadPost();
      void loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId])
  );

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: BlogPost }>(`/parent/teacher-blogs/${postId}`);
      setPost(res.data.data);
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const res = await api.get<{
        data: Comment[];
        meta: { current_page: number; last_page: number };
      }>(`/parent/teacher-blogs/${postId}/comments?page=1`);
      setComments(res.data.data);
    } catch {
      // sessizce geç
    }
  };

  const handleLike = async () => {
    if (!post) { return; }
    try {
      if (post.is_liked) {
        const res = await api.delete<{ data: { likes_count: number } }>(`/parent/teacher-blogs/${postId}/like`);
        setPost((prev) =>
          prev ? { ...prev, is_liked: false, likes_count: res.data.data.likes_count } : prev
        );
      } else {
        const res = await api.post<{ data: { likes_count: number } }>(`/parent/teacher-blogs/${postId}/like`);
        setPost((prev) =>
          prev ? { ...prev, is_liked: true, likes_count: res.data.data.likes_count } : prev
        );
      }
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    }
  };

  const handleSubmitComment = async () => {
    const text = commentText.trim();
    if (!text) { return; }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { content: text };
      if (replyTo) {
        payload.parent_comment_id = replyTo.rootId;
        payload.quoted_content = replyTo.quotedText.substring(0, 200);
      }
      const res = await api.post<{ data: Comment }>(
        `/parent/teacher-blogs/${postId}/comments`,
        payload
      );
      const newComment = res.data.data;
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.rootId ? { ...c, replies: [...(c.replies ?? []), newComment] } : c
          )
        );
      } else {
        setComments((prev) => [{ ...newComment, replies: [] }, ...prev]);
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

  const handleDelete = async (commentId: number) => {
    try {
      await api.delete(`/parent/teacher-blogs/${postId}/comments/${commentId}`);
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
  };

  const startReply = (comment: Comment, rootId?: number) => {
    setReplyTo({
      rootId: rootId ?? comment.id,
      name: comment.user?.name ?? 'Kullanıcı',
      quotedText: comment.content,
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) { router.back(); } else { router.replace('/(app)' as never); }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>Blog Yazısı</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={AppColors.primary} />
          </View>
        )}

        {!loading && error && (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void loadPost()}>
              <Text style={styles.retryBtnText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && post && (
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Post kartı */}
            <View style={styles.postCard}>
              {post.image_url && (
                <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
              )}

              <View style={styles.authorRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {post.teacher ? post.teacher.name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.authorName}>{post.teacher?.name ?? 'Bilinmiyor'}</Text>
                  {post.teacher?.title ? (
                    <Text style={styles.authorTitle}>{post.teacher.title}</Text>
                  ) : null}
                  {post.published_at && (
                    <Text style={styles.date}>
                      {new Date(post.published_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              </View>

              <Text style={styles.title}>{post.title}</Text>
              {post.description ? (
                <Text style={styles.content}>{post.description}</Text>
              ) : null}

              {/* Beğeni / yorum bar */}
              <View style={styles.actionBar}>
                <TouchableOpacity
                  style={[styles.actionBtn, post.is_liked ? styles.actionBtnActive : null]}
                  onPress={() => void handleLike()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionBtnText}>
                    {post.is_liked ? '❤️' : '🤍'} {post.likes_count}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => inputRef.current?.focus()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionBtnText}>💬 {post.comments_count}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Yorumlar */}
            <Text style={styles.commentsTitle}>Yorumlar</Text>

            {comments.length === 0 && (
              <Text style={styles.noComments}>Henüz yorum yok. İlk yorumu sen yaz!</Text>
            )}

            {comments.map((item) => (
              <View key={item.id}>
                {/* Ana yorum */}
                <View style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {item.user ? item.user.name.charAt(0).toUpperCase() : '?'}
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
                      {item.created_at && (
                        <Text style={styles.commentDate}>
                          {new Date(item.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      )}
                      <TouchableOpacity
                        style={styles.commentActionBtn}
                        onPress={() => startReply(item, item.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.commentActionText}>Yanıtla</Text>
                      </TouchableOpacity>
                      {item.user?.id === user?.id && (
                        <TouchableOpacity
                          style={styles.commentActionBtn}
                          onPress={() => void handleDelete(item.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={13} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                {/* Yanıtlar */}
                {item.replies?.map((reply) => (
                  <View key={reply.id} style={styles.replyItem}>
                    <View style={styles.replyConnector} />
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {reply.user ? reply.user.name.charAt(0).toUpperCase() : '?'}
                      </Text>
                    </View>
                    <View style={[styles.commentBubble, styles.replyBubble]}>
                      {reply.quoted_content ? (
                        <View style={styles.quoteBox}>
                          <Text style={styles.quoteText} numberOfLines={2}>{reply.quoted_content}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.commentAuthor}>{reply.user?.name ?? 'Kullanıcı'}</Text>
                      <Text style={styles.commentContent}>{reply.content}</Text>
                      <View style={styles.commentActions}>
                        {reply.created_at && (
                          <Text style={styles.commentDate}>
                            {new Date(reply.created_at).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        )}
                        <TouchableOpacity
                          style={styles.commentActionBtn}
                          onPress={() => startReply(reply, item.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.commentActionText}>Yanıtla</Text>
                        </TouchableOpacity>
                        {reply.user?.id === user?.id && (
                          <TouchableOpacity
                            style={styles.commentActionBtn}
                            onPress={() => void handleDelete(reply.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={13} color="#9CA3AF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}

        {/* Yorum / yanıt girişi */}
        {!loading && !error && post && (
          <View style={styles.inputWrapper}>
            {replyTo && (
              <View style={styles.replyBanner}>
                <Text style={styles.replyBannerText} numberOfLines={1}>
                  ↩ {replyTo?.name} kişisine yanıt
                </Text>
                <TouchableOpacity onPress={() => setReplyTo(null)} activeOpacity={0.7}>
                  <Text style={styles.replyBannerClose}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
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
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 8,
  },
  postImage: { width: '100%', height: 200 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 0 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: AppColors.white, fontSize: 16, fontWeight: '700' },
  authorName: { fontSize: 14, fontWeight: '600', color: AppColors.onSurface },
  authorTitle: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 1 },
  date: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 1 },
  title: { fontSize: 18, fontWeight: '800', color: AppColors.primary, marginHorizontal: 16, marginTop: 12 },
  content: { fontSize: 15, color: AppColors.onSurface, lineHeight: 23, marginHorizontal: 16, marginTop: 8 },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    margin: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainerLow,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceContainerLow,
  },
  actionBtnActive: { backgroundColor: AppColors.primaryContainer },
  actionBtnText: { fontSize: 14, color: AppColors.onSurface, fontWeight: '600' },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.onSurface,
    marginBottom: 10,
    marginTop: 4,
  },
  noComments: {
    fontSize: 13,
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 4, alignItems: 'flex-start' },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  commentAvatarText: { color: AppColors.white, fontSize: 12, fontWeight: '700' },
  commentBubble: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 10,
  },
  quoteBox: {
    backgroundColor: AppColors.surfaceContainerLow,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
    padding: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  quoteText: { fontSize: 12, color: AppColors.onSurfaceVariant, fontStyle: 'italic' },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: AppColors.onSurface, marginBottom: 2 },
  commentContent: { fontSize: 14, color: AppColors.onSurface, lineHeight: 19 },
  commentActions: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12, flexWrap: 'wrap' },
  commentDate: { fontSize: 11, color: AppColors.onSurfaceVariant, flex: 1 },
  commentActionBtn: { paddingVertical: 2 },
  commentActionText: { fontSize: 12, color: AppColors.primary, fontWeight: '600' },
  replyItem: { flexDirection: 'row', gap: 10, marginBottom: 4, alignItems: 'flex-start', marginLeft: 42 },
  replyConnector: { position: 'absolute', left: -26, top: 0, bottom: 0, width: 2, backgroundColor: AppColors.surfaceContainerLow },
  replyBubble: { backgroundColor: AppColors.surfaceContainerLow },
  inputWrapper: {
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainerLow,
  },
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
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
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
