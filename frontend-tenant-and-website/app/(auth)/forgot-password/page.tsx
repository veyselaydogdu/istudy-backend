'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { Loader2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

const forgotSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [sent, setSent] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotFormValues>({
        resolver: zodResolver(forgotSchema),
    });

    const onSubmit = async (data: ForgotFormValues) => {
        setIsLoading(true);
        try {
            await apiClient.post('/auth/forgot-password', { email: data.email });
            setSent(true);
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message = axiosError.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyiniz.';
            toast.error('Hata', { description: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="absolute inset-0">
                <Image src="/assets/images/auth/bg-gradient.png" alt="background" fill className="object-cover" priority />
            </div>

            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <Image src="/assets/images/auth/coming-soon-object1.png" alt="" width={300} height={893} className="absolute left-0 top-1/2 h-full max-h-[893px] w-auto -translate-y-1/2 object-contain" />
                <Image src="/assets/images/auth/coming-soon-object3.png" alt="" width={300} height={300} className="absolute right-0 top-0 h-[300px] w-auto object-contain" />
                <Image src="/assets/images/auth/polygon-object.svg" alt="" width={120} height={120} className="absolute bottom-0 end-[28%]" />

                <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                    <div className="relative flex flex-col justify-center rounded-md bg-white/60 px-6 py-20 backdrop-blur-lg dark:bg-black/50 lg:min-h-[480px]">
                        <div className="mx-auto w-full max-w-[440px]">
                            {sent ? (
                                <div className="text-center">
                                    <div className="mb-4 flex justify-center">
                                        <CheckCircle2 className="h-16 w-16 text-success" />
                                    </div>
                                    <h1 className="mb-2 text-2xl font-extrabold text-primary">E-posta Gönderildi</h1>
                                    <p className="mb-6 text-sm text-white-dark">
                                        Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Gelen kutunuzu ve spam klasörünüzü kontrol ediniz.
                                    </p>
                                    <Link
                                        href="/login"
                                        className="font-semibold text-primary hover:underline"
                                    >
                                        ← Giriş sayfasına dön
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-8">
                                        <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">
                                            Şifremi Unuttum
                                        </h1>
                                        <p className="text-base font-bold leading-normal text-white-dark">
                                            E-posta adresinizi girin, sıfırlama bağlantısı gönderelim.
                                        </p>
                                    </div>

                                    <form className="space-y-5 dark:text-white" onSubmit={handleSubmit(onSubmit)}>
                                        <div className={errors.email ? 'has-error' : ''}>
                                            <label htmlFor="email">E-posta</label>
                                            <input
                                                id="email"
                                                type="email"
                                                placeholder="kurum@istudy.com"
                                                className="form-input"
                                                {...register('email')}
                                                disabled={isLoading}
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn btn-gradient w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Gönderiliyor...
                                                </span>
                                            ) : (
                                                'Sıfırlama Bağlantısı Gönder'
                                            )}
                                        </button>
                                    </form>

                                    <p className="mt-6 text-center text-sm text-white-dark">
                                        <Link href="/login" className="font-semibold text-primary hover:underline">
                                            ← Giriş sayfasına dön
                                        </Link>
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
