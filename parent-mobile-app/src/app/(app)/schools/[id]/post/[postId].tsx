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

interface Comment {
  id: number;
  content: string;
  created_at: string | null;
  user: { id: number; name: string; surname: string | null } | null;
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

const REACTIONS = [
  { type: 'like', emoji: '👍' },
  { type: 'love', emoji: '❤️' },
  { type: 'care', emoji: '🤗' },
  { type: 'haha', emoji: '😄' },
  { type: 'wow', emoji: '😮' },
  { type: 'sad', emoji: '😢' },
];

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
  const [showReactions, setShowReactions] = useState(false);
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

  const handleReact = async (type: string) => {
    setShowReactions(false);
    try {
      const res = await api.post<{ data: { action: string; reactions_count: number } }>(
        `/parent/schools/${id}/posts/${postId}/react`,
        { type }
      );
      const d = res.data.data;
      setReactionsCount(d.reactions_count);
      setMyReaction(d.action === 'removed' ? null : type);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    }
  };

  const handleComment = async () => {
    const text = commentText.trim();
    if (!text) { return; }
    setCommenting(true);
    try {
      const res = await api.post<{ data: Comment }>(
        `/parent/schools/${id}/posts/${postId}/comments`,
        { content: text }
      );
      setComments((prev) => [...prev, res.data.data]);
      setCommentText('');
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setCommenting(false);
    }
  };

  const myReactionEmoji = REACTIONS.find((r) => r.type === myReaction)?.emoji;

  const authorLabel = post?.author
    ? [post.author.name, post.author.surname].filter(Boolean).join(' ')
    : 'Bilinmiyor';

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
        {/* Loading */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={AppColors.primary} />
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void fetchPost()}>
              <Text style={styles.retryBtnText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
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

              {/* Medya */}
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

              {/* Tepki / yorum bar */}
              <View style={styles.actionBar}>
                <View>
                  <TouchableOpacity
                    style={[styles.actionBtn, myReaction ? styles.actionBtnActive : null]}
                    onLongPress={() => setShowReactions(true)}
                    onPress={() => {
                      if (myReaction) {
                        void handleReact(myReaction);
                      } else {
                        setShowReactions((v) => !v);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnText}>
                      {myReactionEmoji ?? '👍'} {reactionsCount}
                    </Text>
                  </TouchableOpacity>

                  {showReactions && (
                    <View style={styles.reactionPicker}>
                      {REACTIONS.map((r) => (
                        <TouchableOpacity
                          key={r.type}
                          style={styles.reactionOption}
                          onPress={() => void handleReact(r.type)}
                        >
                          <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => inputRef.current?.focus()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionBtnText}>💬 {comments.length}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Yorumlar */}
            <Text style={styles.commentsTitle}>Yorumlar</Text>

            {comments.length === 0 && (
              <Text style={styles.noComments}>Henüz yorum yok. İlk yorumu sen yaz!</Text>
            )}

            {comments.map((item) => (
              <View key={item.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>
                    {item.user ? item.user.name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
                <View style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>
                    {item.user
                      ? [item.user.name, item.user.surname].filter(Boolean).join(' ')
                      : 'Bilinmiyor'}
                  </Text>
                  <Text style={styles.commentContent}>{item.content}</Text>
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
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Yorum girişi */}
        {!loading && !error && post && (
          <View style={styles.inputBar}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Yorum yaz..."
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
  reactionPicker: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  reactionOption: { padding: 4 },
  reactionEmoji: { fontSize: 24 },
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
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
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
  commentDate: { fontSize: 11, color: AppColors.onSurfaceVariant, marginTop: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceContainerLow,
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
