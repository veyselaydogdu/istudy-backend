'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { School, SchoolClass, SocialPost, SocialPostComment } from '@/types';
import {
    Plus, Trash2, Heart, ThumbsUp, Zap, MessageCircle, X,
    Image, Video, File, Pin, Globe, Users, Send, ChevronDown,
} from 'lucide-react';

type PostForm = {
    visibility: 'school' | 'class';
    content: string;
    class_ids: number[];
    is_pinned: boolean;
    media: File[];
};

const emptyForm: PostForm = {
    visibility: 'school',
    content: '',
    class_ids: [],
    is_pinned: false,
    media: [],
};

const REACTION_ICONS = {
    like: ThumbsUp,
    heart: Heart,
    clap: Zap,
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) { return `${bytes} B`; }
    if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)} KB`; }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) { return 'Az önce'; }
    if (mins < 60) { return `${mins} dk önce`; }
    const hours = Math.floor(mins / 60);
    if (hours < 24) { return `${hours} sa önce`; }
    const days = Math.floor(hours / 24);
    return `${days} gün önce`;
}

// ─── PostCard Component ───────────────────────────────────────────────────────

function PostCard({
    post,
    onDelete,
    onReact,
    schoolId,
}: {
    post: SocialPost;
    onDelete: (id: number) => void;
    onReact: (id: number, type: 'like' | 'heart' | 'clap') => void;
    schoolId: string;
}) {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<SocialPostComment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);

    const loadComments = useCallback(async () => {
        setLoadingComments(true);
        try {
            const res = await apiClient.get(`/schools/${schoolId}/social/posts/${post.id}/comments`);
            setComments(res.data?.data ?? []);
        } catch {
            /* sessizce geç */
        } finally {
            setLoadingComments(false);
        }
    }, [schoolId, post.id]);

    const toggleComments = () => {
        if (!showComments && comments.length === 0) {
            loadComments();
        }
        setShowComments((v) => !v);
    };

    const submitComment = async () => {
        if (!commentText.trim()) { return; }
        setSubmittingComment(true);
        try {
            const res = await apiClient.post(
                `/schools/${schoolId}/social/posts/${post.id}/comments`,
                { content: commentText }
            );
            if (res.data?.data) {
                setComments((prev) => [...prev, res.data.data]);
                setCommentText('');
            }
        } catch {
            toast.error('Yorum eklenemedi.');
        } finally {
            setSubmittingComment(false);
        }
    };

    return (
        <div className="rounded-xl border border-white-light bg-white p-5 shadow-sm dark:border-[#1b2e4b] dark:bg-black">
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                        {post.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-dark dark:text-white">{post.author.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{timeAgo(post.created_at)}</span>
                            {post.visibility === 'school' ? (
                                <Globe className="h-3 w-3" />
                            ) : (
                                <Users className="h-3 w-3" />
                            )}
                            {post.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    className="text-gray-400 hover:text-danger"
                    onClick={() => onDelete(post.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            {/* Class tags */}
            {post.classes && post.classes.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                    {post.classes.map((cls) => (
                        <span
                            key={cls.id}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                            {cls.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Content */}
            {post.content && (
                <p className="mb-3 whitespace-pre-wrap text-sm text-dark dark:text-white-light">{post.content}</p>
            )}

            {/* Media */}
            {post.media && post.media.length > 0 && (
                <div className={`mb-3 grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.media.map((m) => (
                        <div key={m.id}>
                            {m.type === 'image' && (
                                <img
                                    src={m.url}
                                    alt={m.original_name}
                                    className="h-48 w-full rounded-lg object-cover"
                                />
                            )}
                            {m.type === 'video' && (
                                <video
                                    src={m.url}
                                    controls
                                    className="h-48 w-full rounded-lg object-cover"
                                />
                            )}
                            {m.type === 'file' && (
                                <a
                                    href={m.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 rounded-lg border border-white-light p-3 hover:bg-gray-50 dark:border-[#1b2e4b] dark:hover:bg-[#1b2e4b]"
                                >
                                    <File className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium text-dark dark:text-white">{m.original_name}</p>
                                        <p className="text-xs text-gray-500">{formatFileSize(m.file_size)}</p>
                                    </div>
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 border-t border-white-light pt-3 dark:border-[#1b2e4b]">
                <div className="flex items-center gap-1">
                    {(['like', 'heart', 'clap'] as const).map((type) => {
                        const Icon = REACTION_ICONS[type];
                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => onReact(post.id, type)}
                                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition hover:bg-gray-100 dark:hover:bg-[#1b2e4b] ${
                                    post.user_reaction === type ? 'text-primary font-semibold' : 'text-gray-500'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                            </button>
                        );
                    })}
                    <span className="ml-1 text-xs text-gray-500">{post.reactions_count}</span>
                </div>
                <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
                    onClick={toggleComments}
                >
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments_count} Yorum</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${showComments ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Comments */}
            {showComments && (
                <div className="mt-3 space-y-2">
                    {loadingComments ? (
                        <p className="text-xs text-gray-400">Yükleniyor...</p>
                    ) : (
                        comments.map((c) => (
                            <div key={c.id} className="flex gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-dark dark:bg-[#1b2e4b] dark:text-white">
                                    {c.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-[#1b2e4b]">
                                    <p className="font-semibold text-dark dark:text-white">{c.user.name}</p>
                                    <p className="text-gray-600 dark:text-gray-300">{c.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <div className="flex gap-2 pt-1">
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { submitComment(); } }}
                            placeholder="Yorum yaz..."
                            className="form-input flex-1 text-sm"
                        />
                        <button
                            type="button"
                            disabled={submittingComment || !commentText.trim()}
                            onClick={submitComment}
                            className="btn btn-primary btn-sm"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SocialPage() {
    const [schools, setSchools] = useState<School[]>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState('');
    const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);

    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<PostForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─ Fetch schools ─────────────────────────────────────────────────────────
    const fetchSchools = useCallback(async () => {
        try {
            const res = await apiClient.get('/schools');
            const data: School[] = res.data?.data ?? [];
            setSchools(data);
            if (data.length > 0) {
                setSelectedSchoolId(String(data[0].id));
            }
        } catch { /* sessizce geç */ }
    }, []);

    // ─ Fetch classes for selected school ─────────────────────────────────────
    const fetchClasses = useCallback(async () => {
        if (!selectedSchoolId) { return; }
        try {
            const res = await apiClient.get(`/schools/${selectedSchoolId}/classes`);
            setSchoolClasses(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
    }, [selectedSchoolId]);

    // ─ Fetch posts ────────────────────────────────────────────────────────────
    const fetchPosts = useCallback(async (pageNum = 1) => {
        if (!selectedSchoolId) { return; }
        setLoading(true);
        try {
            const res = await apiClient.get(`/schools/${selectedSchoolId}/social/posts`, {
                params: { page: pageNum },
            });
            const incoming: SocialPost[] = res.data?.data ?? [];
            if (pageNum === 1) {
                setPosts(incoming);
            } else {
                setPosts((prev) => [...prev, ...incoming]);
            }
            setLastPage(res.data?.meta?.last_page ?? 1);
        } catch {
            toast.error('Paylaşımlar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    }, [selectedSchoolId]);

    useEffect(() => { fetchSchools(); }, [fetchSchools]);
    useEffect(() => {
        setPage(1);
        setPosts([]);
        fetchPosts(1);
        fetchClasses();
    }, [selectedSchoolId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─ File selection ─────────────────────────────────────────────────────────
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setForm((prev) => ({ ...prev, media: [...prev.media, ...files] }));
        const urls = files.map((f) => URL.createObjectURL(f));
        setPreviewUrls((prev) => [...prev, ...urls]);
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(previewUrls[index]);
        setForm((prev) => {
            const m = [...prev.media];
            m.splice(index, 1);
            return { ...prev, media: m };
        });
        setPreviewUrls((prev) => {
            const u = [...prev];
            u.splice(index, 1);
            return u;
        });
    };

    // ─ Submit post ────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!form.content.trim() && form.media.length === 0) {
            toast.error('İçerik veya medya ekleyin.');
            return;
        }
        if (form.visibility === 'class' && form.class_ids.length === 0) {
            toast.error('Sınıfa özel paylaşımda en az bir sınıf seçin.');
            return;
        }

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('visibility', form.visibility);
            if (form.content) { fd.append('content', form.content); }
            fd.append('is_pinned', form.is_pinned ? '1' : '0');
            form.class_ids.forEach((id) => fd.append('class_ids[]', String(id)));
            form.media.forEach((file) => fd.append('media[]', file));

            await apiClient.post(`/schools/${selectedSchoolId}/social/posts`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Paylaşım oluşturuldu.');
            setShowModal(false);
            setForm(emptyForm);
            setPreviewUrls([]);
            fetchPosts(1);
        } catch {
            toast.error('Paylaşım oluşturulamadı.');
        } finally {
            setSaving(false);
        }
    };

    // ─ Delete post ────────────────────────────────────────────────────────────
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: 'Bu paylaşım kalıcı olarak silinecek.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, sil',
            cancelButtonText: 'İptal',
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.delete(`/schools/${selectedSchoolId}/social/posts/${id}`);
            setPosts((prev) => prev.filter((p) => p.id !== id));
            toast.success('Paylaşım silindi.');
        } catch {
            toast.error('Silinemedi.');
        }
    };

    // ─ React to post ─────────────────────────────────────────────────────────
    const handleReact = async (postId: number, type: 'like' | 'heart' | 'clap') => {
        try {
            const res = await apiClient.post(
                `/schools/${selectedSchoolId}/social/posts/${postId}/react`,
                { type }
            );
            const { reactions_count } = res.data?.data ?? {};
            setPosts((prev) =>
                prev.map((p) => {
                    if (p.id !== postId) { return p; }
                    const wasReacting = p.user_reaction === type;
                    return {
                        ...p,
                        reactions_count: reactions_count ?? p.reactions_count,
                        user_reaction: wasReacting ? null : type,
                    };
                })
            );
        } catch { /* sessizce geç */ }
    };

    // ─ Toggle class selection ─────────────────────────────────────────────────
    const toggleClass = (id: number) => {
        setForm((prev) => {
            const ids = prev.class_ids.includes(id)
                ? prev.class_ids.filter((x) => x !== id)
                : [...prev.class_ids, id];
            return { ...prev, class_ids: ids };
        });
    };

    return (
        <div className="space-y-5 p-5">
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-bold text-dark dark:text-white">Sosyal Ağ</h1>
                <div className="flex items-center gap-3">
                    <select
                        className="form-select w-auto"
                        value={selectedSchoolId}
                        onChange={(e) => setSelectedSchoolId(e.target.value)}
                    >
                        {schools.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className="btn btn-primary gap-1"
                        onClick={() => setShowModal(true)}
                        disabled={!selectedSchoolId}
                    >
                        <Plus className="h-4 w-4" />
                        Paylaşım Ekle
                    </button>
                </div>
            </div>

            {/* Feed */}
            {loading && posts.length === 0 ? (
                <div className="py-16 text-center text-gray-400">Yükleniyor...</div>
            ) : posts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white-light p-12 text-center text-gray-400 dark:border-[#1b2e4b]">
                    <MessageCircle className="mx-auto mb-2 h-8 w-8" />
                    <p>Henüz paylaşım yok.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onDelete={handleDelete}
                            onReact={handleReact}
                            schoolId={selectedSchoolId}
                        />
                    ))}
                    {page < lastPage && (
                        <div className="text-center">
                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={() => {
                                    const next = page + 1;
                                    setPage(next);
                                    fetchPosts(next);
                                }}
                                disabled={loading}
                            >
                                Daha Fazla Yükle
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Create Post Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-black">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">Yeni Paylaşım</h2>
                            <button type="button" onClick={() => { setShowModal(false); setForm(emptyForm); setPreviewUrls([]); }}>
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Visibility toggle */}
                        <div className="mb-4 flex gap-2">
                            <button
                                type="button"
                                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm ${
                                    form.visibility === 'school'
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-white-light text-gray-500 dark:border-[#1b2e4b]'
                                }`}
                                onClick={() => setForm((prev) => ({ ...prev, visibility: 'school', class_ids: [] }))}
                            >
                                <Globe className="h-4 w-4" /> Tüm Okul
                            </button>
                            <button
                                type="button"
                                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm ${
                                    form.visibility === 'class'
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-white-light text-gray-500 dark:border-[#1b2e4b]'
                                }`}
                                onClick={() => setForm((prev) => ({ ...prev, visibility: 'class' }))}
                            >
                                <Users className="h-4 w-4" /> Sınıfa Özel
                            </button>
                        </div>

                        {/* Class multi-select */}
                        {form.visibility === 'class' && (
                            <div className="mb-4 max-h-36 overflow-y-auto rounded-lg border border-white-light p-3 dark:border-[#1b2e4b]">
                                {schoolClasses.length === 0 ? (
                                    <p className="text-sm text-gray-400">Sınıf bulunamadı.</p>
                                ) : (
                                    <div className="space-y-1">
                                        {schoolClasses.map((cls) => (
                                            <label key={cls.id} className="flex cursor-pointer items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={form.class_ids.includes(cls.id)}
                                                    onChange={() => toggleClass(cls.id)}
                                                    className="form-checkbox"
                                                />
                                                <span className="text-dark dark:text-white">{cls.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <textarea
                            rows={4}
                            value={form.content}
                            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                            placeholder="Ne paylaşmak istiyorsunuz?"
                            className="form-textarea mb-3 w-full"
                        />

                        {/* Media previews */}
                        {previewUrls.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                                {form.media.map((file, idx) => (
                                    <div key={idx} className="relative">
                                        {file.type.startsWith('image/') ? (
                                            <img
                                                src={previewUrls[idx]}
                                                alt={file.name}
                                                className="h-16 w-16 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#1b2e4b]">
                                                <File className="h-6 w-6 text-gray-500" />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white"
                                            onClick={() => removeFile(idx)}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Bottom toolbar */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm gap-1"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Image className="h-4 w-4" /> Medya
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-white-light px-2 py-1 text-xs dark:border-[#1b2e4b]">
                                    <input
                                        type="checkbox"
                                        checked={form.is_pinned}
                                        onChange={(e) => setForm((prev) => ({ ...prev, is_pinned: e.target.checked }))}
                                        className="form-checkbox"
                                    />
                                    <Pin className="h-3 w-3 text-primary" /> Sabitle
                                </label>
                            </div>
                            <button
                                type="button"
                                className="btn btn-primary gap-1"
                                disabled={saving}
                                onClick={handleSubmit}
                            >
                                {saving ? 'Kaydediliyor...' : 'Paylaş'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
