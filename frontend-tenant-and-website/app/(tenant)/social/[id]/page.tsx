'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import AuthImg from '@/components/AuthImg';
import { SocialPost, SocialPostComment } from '@/types';
import {
    ArrowLeft, Pin, Globe, Users, ThumbsUp, Heart, Zap, MessageCircle,
    Send, Trash2, Clock, AlertTriangle, File, Video,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const REACTION_ICONS = { like: ThumbsUp, heart: Heart, clap: Zap };

function timeAgo(dateStr: string, t: (k: string, p?: object) => string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) { return t('social.justNow'); }
    if (mins < 60) { return t('social.minutesAgo', { count: mins }); }
    const hours = Math.floor(mins / 60);
    if (hours < 24) { return t('social.hoursAgo', { count: hours }); }
    return t('social.daysAgo', { count: Math.floor(hours / 24) });
}

function CommentItem({
    comment,
    schoolId,
    postId,
    onDelete,
    onReply,
    depth = 0,
}: {
    comment: SocialPostComment;
    schoolId: string;
    postId: number;
    onDelete: (id: number) => void;
    onReply: (parentId: number, parentUser: string) => void;
    depth?: number;
}) {
    const { t } = useTranslation();

    return (
        <div className={`flex gap-3 ${depth > 0 ? 'ml-8 mt-2' : ''}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {comment.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
                <div className={`rounded-xl p-3 ${comment.is_deleted ? 'border border-dashed border-danger/30 bg-danger/5' : 'bg-gray-50 dark:bg-[#1b2e4b]'}`}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-dark dark:text-white">{comment.user.name}</span>
                            {comment.is_deleted && (
                                <span className="flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                                    <AlertTriangle className="h-3 w-3" />
                                    {t('social.commentDeleted')}
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-400">{timeAgo(String(comment.created_at), t)}</span>
                    </div>
                    {comment.is_deleted ? (
                        <p className="text-xs italic text-gray-400">{t('social.commentDeletedText')}</p>
                    ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                    )}
                </div>

                {!comment.is_deleted && (
                    <div className="mt-1 flex items-center gap-3 px-1">
                        {depth === 0 && (
                            <button
                                type="button"
                                className="text-xs text-primary hover:underline"
                                onClick={() => onReply(comment.id, comment.user.name)}
                            >
                                {t('social.reply')}
                            </button>
                        )}
                        <button
                            type="button"
                            className="text-xs text-danger hover:underline"
                            onClick={() => onDelete(comment.id)}
                        >
                            {t('common.delete')}
                        </button>
                    </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                schoolId={schoolId}
                                postId={postId}
                                onDelete={onDelete}
                                onReply={onReply}
                                depth={1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SocialPostDetailPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('school') ?? '';

    const [post, setPost] = useState<SocialPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<SocialPostComment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);

    const [commentText, setCommentText] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchPost = useCallback(async () => {
        if (!schoolId) { return; }
        setLoading(true);
        try {
            const res = await apiClient.get(`/schools/${schoolId}/social/posts/${params.id}`);
            setPost(res.data?.data ?? null);
        } catch {
            toast.error(t('social.loadCommentError'));
        } finally {
            setLoading(false);
        }
    }, [schoolId, params.id]);

    const fetchComments = useCallback(async () => {
        if (!schoolId) { return; }
        setCommentsLoading(true);
        try {
            const res = await apiClient.get(`/schools/${schoolId}/social/posts/${params.id}/comments`);
            setComments(res.data?.data ?? []);
        } catch { /* sessizce geç */ } finally {
            setCommentsLoading(false);
        }
    }, [schoolId, params.id]);

    useEffect(() => {
        fetchPost();
        fetchComments();
    }, [fetchPost, fetchComments]);

    const handleSubmitComment = async () => {
        if (!commentText.trim()) { return; }
        setSubmitting(true);
        try {
            const res = await apiClient.post(`/schools/${schoolId}/social/posts/${params.id}/comments`, {
                content: commentText,
                parent_id: replyTo?.id ?? null,
            });
            if (res.data?.data) {
                if (replyTo) {
                    setComments((prev) => prev.map((c) => {
                        if (c.id === replyTo.id) {
                            return { ...c, replies: [...(c.replies ?? []), res.data.data] };
                        }
                        return c;
                    }));
                } else {
                    setComments((prev) => [...prev, res.data.data]);
                }
                setCommentText('');
                setReplyTo(null);
                if (post) {
                    setPost({ ...post, comments_count: post.comments_count + 1 });
                }
            }
        } catch {
            toast.error(t('social.addCommentError'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        const result = await Swal.fire({
            title: t('social.deleteCommentTitle'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('swal.confirmDelete'),
            cancelButtonText: t('swal.cancel'),
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.delete(`/schools/${schoolId}/social/posts/${params.id}/comments/${commentId}`);
            // Yorumu soft-delete olarak işaretle (listeden kaldırmak yerine)
            const markDeleted = (list: SocialPostComment[]): SocialPostComment[] =>
                list.map((c) => {
                    if (c.id === commentId) { return { ...c, is_deleted: true, content: null }; }
                    if (c.replies) { return { ...c, replies: markDeleted(c.replies) }; }
                    return c;
                });
            setComments((prev) => markDeleted(prev));
            toast.success(t('social.deleteCommentSuccess'));
        } catch {
            toast.error(t('social.deleteCommentError'));
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-gray-400">{t('common.loading')}</div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-gray-400">{t('social.noPost')}</div>
            </div>
        );
    }

    const totalComments = comments.length + comments.reduce((acc, c) => acc + (c.replies?.length ?? 0), 0);

    return (
        <div className="space-y-5 p-5">
            {/* Back button */}
            <button
                type="button"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
                onClick={() => router.back()}
            >
                <ArrowLeft className="h-4 w-4" />
                {t('social.backToList')}
            </button>

            {/* Post card */}
            <div className="rounded-xl border border-white-light bg-white p-6 shadow-sm dark:border-[#1b2e4b] dark:bg-black">
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                            {post.author.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-dark dark:text-white">{post.author.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{new Date(post.created_at).toLocaleString('tr-TR')}</span>
                                {post.visibility === 'school'
                                    ? <Globe className="h-3 w-3" />
                                    : <Users className="h-3 w-3" />}
                                {post.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                            </div>
                        </div>
                    </div>
                    {post.updated_at && post.updated_at !== post.created_at && (
                        <span className="text-xs text-gray-400">{t('social.updatedAt')} {new Date(post.updated_at).toLocaleString('tr-TR')}</span>
                    )}
                </div>

                {/* Class tags */}
                {post.classes && post.classes.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                        {post.classes.map((cls) => (
                            <span key={cls.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {cls.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Title */}
                {post.title && (
                    <h2 className="mb-2 text-xl font-bold text-dark dark:text-white">{post.title}</h2>
                )}

                {/* Content */}
                {post.content && (
                    <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-dark dark:text-white-light">{post.content}</p>
                )}

                {/* Media */}
                {post.media && post.media.length > 0 && (
                    <div className={`mb-4 grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {post.media.map((m) => (
                            <div key={m.id}>
                                {m.type === 'image' && (
                                    <AuthImg src={m.url} alt={m.original_name} className="max-h-96 w-full rounded-lg object-contain" />
                                )}
                                {m.type === 'video' && (
                                    <video src={m.url} controls className="max-h-96 w-full rounded-lg" />
                                )}
                                {m.type === 'file' && (
                                    <a href={m.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-white-light p-3 hover:bg-gray-50 dark:border-[#1b2e4b] dark:hover:bg-[#1b2e4b]">
                                        <File className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-sm font-medium text-dark dark:text-white">{m.original_name}</p>
                                        </div>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Reactions */}
                <div className="flex items-center gap-4 border-t border-white-light pt-3 dark:border-[#1b2e4b]">
                    <div className="flex items-center gap-2">
                        {(['like', 'heart', 'clap'] as const).map((type) => {
                            const Icon = REACTION_ICONS[type];
                            return <Icon key={type} className="h-4 w-4 text-gray-400" />;
                        })}
                        <span className="text-sm text-gray-500">{post.reactions_count}</span>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                        <MessageCircle className="h-4 w-4" />{totalComments}
                    </span>
                </div>

                {/* Edit history */}
                {post.edit_history && post.edit_history.length > 0 && (
                    <div className="mt-4 rounded-lg border border-white-light p-3 dark:border-[#1b2e4b]">
                        <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-500">
                            <Clock className="h-3 w-3" /> {t('social.editHistory')} ({post.edit_history.length})
                        </p>
                        <div className="space-y-1">
                            {[...post.edit_history].reverse().map((snap, i) => (
                                <div key={i} className="rounded bg-gray-50 px-3 py-1.5 text-xs text-gray-500 dark:bg-[#1b2e4b]">
                                    <span className="font-medium">{new Date(snap.edited_at).toLocaleString('tr-TR')}</span>
                                    {snap.title && <span className="ml-2 font-medium text-dark dark:text-white">{snap.title}</span>}
                                    {snap.content && (
                                        <span className="ml-1 text-gray-400">— {snap.content.slice(0, 100)}{snap.content.length > 100 ? '…' : ''}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Comments */}
            <div className="rounded-xl border border-white-light bg-white p-5 dark:border-[#1b2e4b] dark:bg-black">
                <h3 className="mb-4 font-semibold text-dark dark:text-white">
                    {t('social.commentsTitle')} ({totalComments})
                </h3>

                {/* Comment input */}
                {replyTo && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
                        <span>{t('social.replyingTo')} <strong>{replyTo.name}</strong></span>
                        <button type="button" onClick={() => setReplyTo(null)} className="ml-auto text-gray-400 hover:text-dark">✕</button>
                    </div>
                )}
                <div className="mb-5 flex gap-2">
                    <textarea
                        rows={2}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                        placeholder={t('social.addComment')}
                        className="form-textarea flex-1 resize-none text-sm"
                    />
                    <button
                        type="button"
                        disabled={submitting || !commentText.trim()}
                        onClick={handleSubmitComment}
                        className="btn btn-primary self-end"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>

                {/* Comments list */}
                {commentsLoading ? (
                    <p className="text-center text-sm text-gray-400">{t('common.loading')}</p>
                ) : comments.length === 0 ? (
                    <p className="text-center text-sm text-gray-400">{t('social.noComments')}</p>
                ) : (
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                schoolId={schoolId}
                                postId={post.id}
                                onDelete={handleDeleteComment}
                                onReply={(id, name) => { setReplyTo({ id, name }); setCommentText(''); }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
