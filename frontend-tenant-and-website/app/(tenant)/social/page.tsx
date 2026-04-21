'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import AuthImg from '@/components/AuthImg';
import { School, SchoolClass, SocialPost } from '@/types';
import {
    Plus, Trash2, X, Image, File, Pin, Globe, Users, Pencil, Clock, Eye,
    Heart, ThumbsUp, Zap, MessageCircle,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type PostForm = {
    title: string;
    visibility: 'school' | 'class';
    content: string;
    class_ids: number[];
    is_pinned: boolean;
    media: File[];
};

const emptyForm: PostForm = {
    title: '',
    visibility: 'school',
    content: '',
    class_ids: [],
    is_pinned: false,
    media: [],
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) { return `${bytes} B`; }
    if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)} KB`; }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SocialPage() {
    const { t } = useTranslation();
    const router = useRouter();
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

    const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
    const [editForm, setEditForm] = useState<Omit<PostForm, 'media'>>(emptyForm);
    const [editSaving, setEditSaving] = useState(false);

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

    const fetchClasses = useCallback(async () => {
        if (!selectedSchoolId) { return; }
        try {
            const res = await apiClient.get(`/schools/${selectedSchoolId}/classes`);
            setSchoolClasses(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
    }, [selectedSchoolId]);

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
            toast.error(t('social.loadCommentError'));
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
            toast.error(t('social.contentRequired'));
            return;
        }
        if (form.visibility === 'class' && form.class_ids.length === 0) {
            toast.error(t('social.classRequired'));
            return;
        }

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('visibility', form.visibility);
            if (form.title) { fd.append('title', form.title); }
            if (form.content) { fd.append('content', form.content); }
            fd.append('is_pinned', form.is_pinned ? '1' : '0');
            form.class_ids.forEach((id) => fd.append('class_ids[]', String(id)));
            form.media.forEach((file) => fd.append('media[]', file));

            await apiClient.post(`/schools/${selectedSchoolId}/social/posts`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success(t('social.postSuccess'));
            setShowModal(false);
            setForm(emptyForm);
            setPreviewUrls([]);
            fetchPosts(1);
        } catch {
            toast.error(t('social.postError'));
        } finally {
            setSaving(false);
        }
    };

    // ─ Delete post ────────────────────────────────────────────────────────────
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: t('social.deletePostTitle'),
            text: t('social.deletePostText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('swal.confirmDelete'),
            cancelButtonText: t('swal.cancel'),
        });
        if (!result.isConfirmed) { return; }
        try {
            await apiClient.delete(`/schools/${selectedSchoolId}/social/posts/${id}`);
            setPosts((prev) => prev.filter((p) => p.id !== id));
            toast.success(t('social.deletePostSuccess'));
        } catch {
            toast.error(t('social.deletePostError'));
        }
    };

    // ─ Edit post ─────────────────────────────────────────────────────────────
    const openEditModal = (post: SocialPost) => {
        setEditingPost(post);
        setEditForm({
            title: post.title ?? '',
            visibility: post.visibility,
            content: post.content ?? '',
            class_ids: post.classes?.map((c) => c.id) ?? [],
            is_pinned: post.is_pinned,
            media: [],
        });
    };

    const handleEditSubmit = async () => {
        if (!editingPost) { return; }
        setEditSaving(true);
        try {
            const res = await apiClient.put(
                `/schools/${selectedSchoolId}/social/posts/${editingPost.id}`,
                {
                    title: editForm.title || null,
                    visibility: editForm.visibility,
                    content: editForm.content || null,
                    class_ids: editForm.class_ids,
                    is_pinned: editForm.is_pinned,
                }
            );
            const updated: SocialPost = res.data?.data;
            if (updated) {
                setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
            }
            toast.success(t('social.editSuccess'));
            setEditingPost(null);
        } catch {
            toast.error(t('social.editError'));
        } finally {
            setEditSaving(false);
        }
    };

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
                <h1 className="text-xl font-bold text-dark dark:text-white">{t('social.title')}</h1>
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
                        {t('social.newPostBtn')}
                    </button>
                </div>
            </div>

            {/* List table */}
            <div className="table-responsive">
                <table className="table-hover table">
                    <thead>
                        <tr>
                            <th className="w-16">{t('social.tableMedia')}</th>
                            <th>{t('social.tableTitle')}</th>
                            <th>{t('social.tableContent')}</th>
                            <th className="text-center">{t('social.tableStats')}</th>
                            <th>{t('social.tableVisibility')}</th>
                            <th>{t('social.tableDate')}</th>
                            <th className="text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && posts.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-10 text-center text-gray-400">{t('common.loading')}</td>
                            </tr>
                        ) : posts.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-10 text-center text-gray-400">{t('social.noPost')}</td>
                            </tr>
                        ) : posts.map((post) => (
                            <tr key={post.id}>
                                {/* Thumbnail */}
                                <td>
                                    {post.media && post.media.length > 0 && post.media[0].type === 'image' ? (
                                        <AuthImg
                                            src={post.media[0].url}
                                            alt=""
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    ) : post.media && post.media.length > 0 ? (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#1b2e4b]">
                                            <File className="h-5 w-5 text-gray-400" />
                                        </div>
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#1b2e4b]">
                                            <Image className="h-5 w-5 text-gray-300" />
                                        </div>
                                    )}
                                </td>

                                {/* Title */}
                                <td>
                                    <div className="flex items-center gap-1">
                                        {post.is_pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
                                        <span className="font-medium text-dark dark:text-white">
                                            {post.title || <span className="text-gray-400 italic">{t('social.noTitle')}</span>}
                                        </span>
                                    </div>
                                    {post.edit_history && post.edit_history.length > 0 && (
                                        <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                                            <Clock className="h-3 w-3" />
                                            {post.edit_history.length}x {t('social.edited')}
                                        </span>
                                    )}
                                </td>

                                {/* Content preview */}
                                <td className="max-w-xs">
                                    <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                                        {post.content
                                            ? post.content.slice(0, 200) + (post.content.length > 200 ? '…' : '')
                                            : <span className="italic">{t('social.noContent')}</span>}
                                    </p>
                                    {post.classes && post.classes.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {post.classes.map((cls) => (
                                                <span key={cls.id} className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                                                    {cls.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </td>

                                {/* Stats */}
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <ThumbsUp className="h-3 w-3" />{post.reactions_count}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageCircle className="h-3 w-3" />{post.comments_count}
                                        </span>
                                    </div>
                                </td>

                                {/* Visibility */}
                                <td>
                                    {post.visibility === 'school' ? (
                                        <span className="flex items-center gap-1 text-xs text-blue-500">
                                            <Globe className="h-3 w-3" />{t('social.visibilitySchool')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs text-purple-500">
                                            <Users className="h-3 w-3" />{t('social.visibilityClass')}
                                        </span>
                                    )}
                                </td>

                                {/* Dates */}
                                <td className="text-xs text-gray-500 dark:text-gray-400">
                                    <div>{new Date(post.created_at).toLocaleDateString('tr-TR')}</div>
                                    {post.updated_at && post.updated_at !== post.created_at && (
                                        <div className="text-gray-400">{t('social.updatedAt')} {new Date(post.updated_at).toLocaleDateString('tr-TR')}</div>
                                    )}
                                </td>

                                {/* Actions */}
                                <td>
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            type="button"
                                            title={t('social.viewDetail')}
                                            className="btn btn-outline-primary btn-sm p-1.5"
                                            onClick={() => router.push(`/social/${post.id}?school=${selectedSchoolId}`)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            title={t('common.edit')}
                                            className="btn btn-outline-warning btn-sm p-1.5"
                                            onClick={() => openEditModal(post)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            title={t('common.delete')}
                                            className="btn btn-outline-danger btn-sm p-1.5"
                                            onClick={() => handleDelete(post.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Load more */}
            {page < lastPage && (
                <div className="text-center">
                    <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => { const next = page + 1; setPage(next); fetchPosts(next); }}
                        disabled={loading}
                    >
                        {t('common.loadMore')}
                    </button>
                </div>
            )}

            {/* Edit Post Modal */}
            {editingPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-black">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('social.editPostTitle')}</h2>
                            <button type="button" onClick={() => setEditingPost(null)}>
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="mb-4 flex gap-2">
                            <button
                                type="button"
                                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm ${editForm.visibility === 'school' ? 'border-primary bg-primary/10 text-primary' : 'border-white-light text-gray-500 dark:border-[#1b2e4b]'}`}
                                onClick={() => setEditForm((prev) => ({ ...prev, visibility: 'school', class_ids: [] }))}
                            >
                                <Globe className="h-4 w-4" /> {t('social.visibilitySchool')}
                            </button>
                            <button
                                type="button"
                                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm ${editForm.visibility === 'class' ? 'border-primary bg-primary/10 text-primary' : 'border-white-light text-gray-500 dark:border-[#1b2e4b]'}`}
                                onClick={() => setEditForm((prev) => ({ ...prev, visibility: 'class' }))}
                            >
                                <Users className="h-4 w-4" /> {t('social.visibilityClass')}
                            </button>
                        </div>

                        {editForm.visibility === 'class' && (
                            <div className="mb-4 max-h-36 overflow-y-auto rounded-lg border border-white-light p-3 dark:border-[#1b2e4b]">
                                {schoolClasses.map((cls) => (
                                    <label key={cls.id} className="flex cursor-pointer items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={editForm.class_ids.includes(cls.id)}
                                            onChange={() => setEditForm((prev) => {
                                                const ids = prev.class_ids.includes(cls.id)
                                                    ? prev.class_ids.filter((x) => x !== cls.id)
                                                    : [...prev.class_ids, cls.id];
                                                return { ...prev, class_ids: ids };
                                            })}
                                            className="form-checkbox"
                                        />
                                        <span className="text-dark dark:text-white">{cls.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="mb-3">
                            <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value.slice(0, 100) }))}
                                placeholder={t('social.titlePlaceholder')}
                                maxLength={100}
                                className="form-input w-full"
                            />
                            <p className="mt-1 text-right text-xs text-gray-400">{editForm.title.length}/100</p>
                        </div>

                        <textarea
                            rows={4}
                            value={editForm.content}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                            placeholder={t('social.contentPlaceholder')}
                            className="form-textarea mb-3 w-full"
                        />

                        {editingPost.edit_history && editingPost.edit_history.length > 0 && (
                            <div className="mb-3 rounded-lg border border-white-light p-3 dark:border-[#1b2e4b]">
                                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-500">
                                    <Clock className="h-3 w-3" /> {t('social.editHistory')} ({editingPost.edit_history.length})
                                </p>
                                <div className="max-h-28 space-y-1 overflow-y-auto">
                                    {[...editingPost.edit_history].reverse().map((snap, i) => (
                                        <div key={i} className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-500 dark:bg-[#1b2e4b]">
                                            <span className="font-medium">{new Date(snap.edited_at).toLocaleString('tr-TR')}</span>
                                            {snap.title && <span className="ml-2 text-dark dark:text-white">{snap.title}</span>}
                                            {snap.content && <span className="ml-1 text-gray-400">— {snap.content.slice(0, 60)}{snap.content.length > 60 ? '…' : ''}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-white-light px-2 py-1 text-xs dark:border-[#1b2e4b]">
                                <input
                                    type="checkbox"
                                    checked={editForm.is_pinned}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, is_pinned: e.target.checked }))}
                                    className="form-checkbox"
                                />
                                <Pin className="h-3 w-3 text-primary" /> {t('social.pinLabel')}
                            </label>
                            <div className="flex gap-2">
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setEditingPost(null)}>
                                    {t('common.cancel')}
                                </button>
                                <button type="button" className="btn btn-primary btn-sm" disabled={editSaving} onClick={handleEditSubmit}>
                                    {editSaving ? t('common.saving') : t('social.saveBtn')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Post Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-black">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{t('social.newPostTitle')}</h2>
                            <button type="button" onClick={() => { setShowModal(false); setForm(emptyForm); setPreviewUrls([]); }}>
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="mb-4 flex gap-2">
                            <button
                                type="button"
                                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm ${form.visibility === 'school' ? 'border-primary bg-primary/10 text-primary' : 'border-white-light text-gray-500 dark:border-[#1b2e4b]'}`}
                                onClick={() => setForm((prev) => ({ ...prev, visibility: 'school', class_ids: [] }))}
                            >
                                <Globe className="h-4 w-4" /> {t('social.visibilitySchool')}
                            </button>
                            <button
                                type="button"
                                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm ${form.visibility === 'class' ? 'border-primary bg-primary/10 text-primary' : 'border-white-light text-gray-500 dark:border-[#1b2e4b]'}`}
                                onClick={() => setForm((prev) => ({ ...prev, visibility: 'class' }))}
                            >
                                <Users className="h-4 w-4" /> {t('social.visibilityClass')}
                            </button>
                        </div>

                        {form.visibility === 'class' && (
                            <div className="mb-4 max-h-36 overflow-y-auto rounded-lg border border-white-light p-3 dark:border-[#1b2e4b]">
                                {schoolClasses.length === 0 ? (
                                    <p className="text-sm text-gray-400">{t('social.classRequired')}</p>
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

                        <div className="mb-3">
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value.slice(0, 100) }))}
                                placeholder={t('social.titlePlaceholder')}
                                maxLength={100}
                                className="form-input w-full"
                            />
                            <p className="mt-1 text-right text-xs text-gray-400">{form.title.length}/100</p>
                        </div>

                        <textarea
                            rows={4}
                            value={form.content}
                            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                            placeholder={t('social.contentPlaceholder')}
                            className="form-textarea mb-3 w-full"
                        />

                        {previewUrls.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                                {form.media.map((file, idx) => (
                                    <div key={idx} className="relative">
                                        {file.type.startsWith('image/') ? (
                                            <img src={previewUrls[idx]} alt={file.name} className="h-16 w-16 rounded-lg object-cover" />
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

                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <button type="button" className="btn btn-outline-secondary btn-sm gap-1" onClick={() => fileInputRef.current?.click()}>
                                    <Image className="h-4 w-4" /> {t('social.mediaLabel')}
                                </button>
                                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFileSelect} />
                                <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-white-light px-2 py-1 text-xs dark:border-[#1b2e4b]">
                                    <input
                                        type="checkbox"
                                        checked={form.is_pinned}
                                        onChange={(e) => setForm((prev) => ({ ...prev, is_pinned: e.target.checked }))}
                                        className="form-checkbox"
                                    />
                                    <Pin className="h-3 w-3 text-primary" /> {t('social.pinLabel')}
                                </label>
                            </div>
                            <button type="button" className="btn btn-primary gap-1" disabled={saving} onClick={handleSubmit}>
                                {saving ? t('social.posting') : t('social.postBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
