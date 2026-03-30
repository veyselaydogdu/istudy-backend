'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { User } from '@/types';

const profileSchema = z.object({
    name: z.string().min(2, 'Ad en az 2 karakter olmalıdır.'),
    email: z.string().email('Geçerli bir e-posta giriniz.'),
    phone: z.string().optional(),
});

const passwordSchema = z
    .object({
        current_password: z.string().min(1, 'Mevcut şifrenizi girin.'),
        password: z.string().min(8, 'Yeni şifre en az 8 karakter olmalıdır.'),
        password_confirmation: z.string(),
    })
    .refine((d) => d.password === d.password_confirmation, {
        message: 'Şifreler eşleşmiyor.',
        path: ['password_confirmation'],
    });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
    });

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
    });

    useEffect(() => {
        apiClient.get('/auth/me').then((res) => {
            if (res.data?.data) {
                const u = res.data.data as User;
                setUser(u);
                profileForm.reset({
                    name: u.name,
                    email: u.email,
                    phone: u.phone ?? '',
                });
            }
        }).catch(() => {
            toast.error('Profil bilgileri yüklenemedi.');
        }).finally(() => setLoadingProfile(false));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const onProfileSubmit = async (data: ProfileFormValues) => {
        try {
            const res = await apiClient.put('/auth/me', data);
            if (res.data?.data) {
                setUser(res.data.data);
            }
            toast.success('Profil güncellendi!');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Güncelleme başarısız.');
        }
    };

    const onPasswordSubmit = async (data: PasswordFormValues) => {
        try {
            await apiClient.post('/auth/change-password', data);
            toast.success('Şifre başarıyla değiştirildi!');
            passwordForm.reset();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Şifre değiştirme başarısız.');
        }
    };

    if (loadingProfile) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-dark dark:text-white">Profil</h1>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Profile form */}
                <div className="panel">
                    <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">Profil Bilgileri</h2>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-dark dark:text-white-light">Ad Soyad</label>
                            <input
                                type="text"
                                className="form-input mt-1"
                                {...profileForm.register('name')}
                            />
                            {profileForm.formState.errors.name && (
                                <p className="mt-1 text-xs text-danger">{profileForm.formState.errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark dark:text-white-light">E-posta</label>
                            <input
                                type="email"
                                className="form-input mt-1"
                                {...profileForm.register('email')}
                            />
                            {profileForm.formState.errors.email && (
                                <p className="mt-1 text-xs text-danger">{profileForm.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark dark:text-white-light">Telefon</label>
                            <input
                                type="text"
                                className="form-input mt-1"
                                {...profileForm.register('phone')}
                            />
                        </div>

                        {user?.tenant && (
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Kurum</label>
                                <input
                                    type="text"
                                    className="form-input mt-1 bg-[#f1f2f3] dark:bg-[#1b2e4b]"
                                    value={user.tenant.name}
                                    readOnly
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={profileForm.formState.isSubmitting}
                        >
                            {profileForm.formState.isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </form>
                </div>

                {/* Password form */}
                <div className="panel">
                    <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">Şifre Değiştir</h2>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-dark dark:text-white-light">Mevcut Şifre</label>
                            <input
                                type="password"
                                className="form-input mt-1"
                                {...passwordForm.register('current_password')}
                            />
                            {passwordForm.formState.errors.current_password && (
                                <p className="mt-1 text-xs text-danger">{passwordForm.formState.errors.current_password.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark dark:text-white-light">Yeni Şifre</label>
                            <input
                                type="password"
                                className="form-input mt-1"
                                {...passwordForm.register('password')}
                            />
                            {passwordForm.formState.errors.password && (
                                <p className="mt-1 text-xs text-danger">{passwordForm.formState.errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark dark:text-white-light">Yeni Şifre Tekrar</label>
                            <input
                                type="password"
                                className="form-input mt-1"
                                {...passwordForm.register('password_confirmation')}
                            />
                            {passwordForm.formState.errors.password_confirmation && (
                                <p className="mt-1 text-xs text-danger">{passwordForm.formState.errors.password_confirmation.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={passwordForm.formState.isSubmitting}
                        >
                            {passwordForm.formState.isSubmitting ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
