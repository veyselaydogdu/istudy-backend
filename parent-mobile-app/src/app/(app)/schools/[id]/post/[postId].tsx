import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

interface MediaItem {
  id: number;
  type: string | null;
  url: string | null;
  sort_order: number;
}

interface Reply {
  id: number;
  content: string;
  parent_id: number | null;
  created_at: string | null;
  likes_count: number;
  my_like: boolean;
  user: { id: number; name: string; surname: string | null } | null;
}

interface Comment {
  id: number;
  content: string;
  parent_id: number | null;
  created_at: string | null;
  likes_count: number;
  my_like: boolean;
  user: { id: number; name: string; surname: string | null } | null;
  replies: Reply[];
}

interface PostDetail {
  id: number;
  title: string | null;
  content: string;
  visibility: string;
  is_pinned: boolean;
  published_at: string | null;
  author: { id: number; name: string; surname: string | null } | null;
  reactions_count: number;
  comments_count: number;
  media: MediaItem[];
}

export default function PostDetailScreen() {
  const params = useLocalSearchParams();
  const id = String(params.id ?? '');
  const postId = String(params.postId ?? '');

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [reactionsCount, setReactionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commenting, setCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const inputRef = useRef<TextInput>(null);

  const fetchPost = useCallback(async () => {
    if (!id || !postId) { return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{
        data: { post: PostDetail; my_reaction: string | null; comments: Comment[] };
      }>(`/parent/schools/${id}/posts/${postId}`);
      const d = res.data.data;
      setPost(d.post);
      setComments(d.comments ?? []);
      setMyReaction(d.my_reaction ?? null);
      setReactionsCount(d.post.reactions_count ?? 0);
    } catch (err: unknown) {
      const msg = getApiError(err);
      setError(msg);
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  }, [id, postId]);

  useEffect(() => {
    void fetchPost();
  }, [fetchPost]);

  const handleReact = async () => {
    try {
      const res = await api.post<{ data: { action: string; reactions_count: number } }>(
        `/parent/schools/${id}/posts/${postId}/react`,
        { type: 'heart' }
      );
      const d = res.data.data;
      setReactionsCount(d.reactions_count);
      setMyReaction(d.action === 'removed' ? null : 'heart');
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    }
  };

  const handleComment = async () => {
    const text = commentText.trim();
    if (!text) { return; }
    setCommenting(true);
    try {
      const body: Record<string, unknown> = { content: text };
      if (replyTo) { body.parent_id = replyTo.id; }

      const res = await api.post<{ data: Comment }>(
        `/parent/schools/${id}/posts/${postId}/comments`,
        body
      );
      const newComment = res.data.data;
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, replies: [...(c.replies ?? []), newComment as unknown as Reply] }
              : c
          )
        );
      } else {
        setComments((prev) => [...prev, { ...newComment, replies: [] }]);
      }
      setCommentText('');
      setReplyTo(null);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setCommenting(false);
    }
  };

  const handleCommentLike = async (commentId: number, isReply: boolean, parentId?: number) => {
    try {
      const res = await api.post<{ data: { action: string; likes_count: number } }>(
        `/parent/schools/${id}/posts/${postId}/comments/${commentId}/like`
      );
      const { action, likes_count } = res.data.data;
      if (isReply && parentId != null) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? {
                  ...c,
                  replies: c.replies.map((r) =>
                    r.id === commentId
                      ? { ...r, likes_count, my_like: action === 'added' }
                      : r
                  ),
                }
              : c
          )
        );
      } else {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, likes_count, my_like: action === 'added' }
              : c
          )
        );
      }
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    }
  };

  const startReply = (comment: Comment | Reply, parentId?: number) => {
    const name = comment.user
      ? [comment.user.name, comment.user.surname].filter(Boolean).join(' ')
      : 'Bilinmiyor';
    const targetId = parentId ?? comment.id;
    setReplyTo({ id: targetId, name });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const authorLabel = post?.author
    ? [post.author.name, post.author.surname].filter(Boolean).join(' ')
    : 'Bilinmiyor';

  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);

  const renderCommentUser = (user: Comment['user']) =>
    user ? [user.name, user.surname].filter(Boolean).join(' ') : 'Bilinmiyor';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>Paylaşım</Text>
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
            <TouchableOpacity style={styles.retryBtn} onPress={() => void fetchPost()}>
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
              {post.is_pinned && <Text style={styles.pinned}>📌 Sabitlenmiş</Text>}

              <View style={styles.authorRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {post.author ? post.author.name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.authorName}>{authorLabel}</Text>
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

              {!!post.title && <Text style={styles.title}>{post.title}</Text>}
              <Text style={styles.content}>{post.content}</Text>

              {post.media.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.mediaScroll}
                >
                  {post.media.map((m) =>
                    m.url && m.type === 'image' ? (
                      <Image
                        key={m.id}
                        source={{ uri: m.url }}
                        style={styles.mediaImage}
                        resizeMode="cover"
                      />
                    ) : null
                  )}
                </ScrollView>
              )}

              {/* Beğeni / yorum bar */}
              <View style={styles.actionBar}>
                <TouchableOpacity
                  style={[styles.actionBtn, myReaction ? styles.actionBtnActive : null]}
                  onPress={() => void handleReact()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionBtnText}>
                    {myReaction ? '❤️' : '🤍'} {reactionsCount}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => inputRef.current?.focus()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionBtnText}>💬 {totalComments}</Text>
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
                    <Text style={styles.commentAuthor}>{renderCommentUser(item.user)}</Text>
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
                        onPress={() => void handleCommentLike(item.id, false)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.commentActionText, item.my_like ? styles.commentActionActive : null]}>
                          {item.my_like ? '❤️' : '🤍'} {item.likes_count > 0 ? item.likes_count : ''}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.commentActionBtn}
                        onPress={() => startReply(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.commentActionText}>Yanıtla</Text>
                      </TouchableOpacity>
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
                      <Text style={styles.commentAuthor}>{renderCommentUser(reply.user)}</Text>
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
                          onPress={() => void handleCommentLike(reply.id, true, item.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.commentActionText, reply.my_like ? styles.commentActionActive : null]}>
                            {reply.my_like ? '❤️' : '🤍'} {reply.likes_count > 0 ? reply.likes_count : ''}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.commentActionBtn}
                          onPress={() => startReply(reply, item.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.commentActionText}>Yanıtla</Text>
                        </TouchableOpacity>
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
                  ↩ {replyTo.name} kişisine yanıt
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
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !commentText.trim() ? styles.sendBtnDisabled : null]}
                onPress={() => void handleComment()}
                disabled={commenting || !commentText.trim()}
                activeOpacity={0.7}
              >
                {commenting ? (
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
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  pinned: { fontSize: 11, color: AppColors.primary, fontWeight: '600', marginBottom: 8 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
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
  date: { fontSize: 12, color: AppColors.onSurfaceVariant, marginTop: 1 },
  title: { fontSize: 18, fontWeight: '800', color: AppColors.primary, marginBottom: 8 },
  content: { fontSize: 15, color: AppColors.onSurface, lineHeight: 23, marginTop: 4 },
  mediaScroll: { marginTop: 12 },
  mediaImage: {
    width: 260,
    height: 195,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: AppColors.surfaceContainerLow,
  },
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
  commentAuthor: { fontSize: 12, fontWeight: '700', color: AppColors.onSurface, marginBottom: 2 },
  commentContent: { fontSize: 14, color: AppColors.onSurface, lineHeight: 19 },
  commentActions: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12, flexWrap: 'wrap' },
  commentDate: { fontSize: 11, color: AppColors.onSurfaceVariant },
  commentActionBtn: { paddingVertical: 2 },
  commentActionText: { fontSize: 12, color: AppColors.onSurfaceVariant, fontWeight: '500' },
  commentActionActive: { color: '#E53935' },
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
