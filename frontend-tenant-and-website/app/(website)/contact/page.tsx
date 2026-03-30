'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';

const schema = z.object({
    name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta girin'),
    subject: z.string().min(3, 'Konu en az 3 karakter olmalıdır'),
    message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır'),
});

type FormValues = z.infer<typeof schema>;

export default function ContactPage() {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormValues) => {
        try {
            await apiClient.post('/contact', data);
            toast.success('Mesajınız alındı! En kısa sürede geri döneceğiz.');
            reset();
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message = axiosError.response?.data?.message || 'Gönderim sırasında bir hata oluştu.';
            toast.error('Hata', { description: message });
        }
    };

    return (
        <section className="py-20">
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold text-dark dark:text-white">İletişim</h1>
                    <p className="mt-4 text-lg text-[#515365] dark:text-[#888ea8]">
                        Sorularınız için bize ulaşın, hemen yanıt verelim
                    </p>
                </div>

                <div className="panel">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-dark dark:text-white-light">Ad Soyad</label>
                            <input
                                type="text"
                                className="form-input mt-1"
                                placeholder="Adınız ve soyadınız"
                                {...register('name')}
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-dark dark:text-white-light">E-posta</label>
                            <input
                                type="email"
                                className="form-input mt-1"
                                placeholder="ornek@kurum.com"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-dark dark:text-white-light">Konu</label>
                            <input
                                type="text"
                                className="form-input mt-1"
                                placeholder="Mesajınızın konusu"
                                {...register('subject')}
                            />
                            {errors.subject && (
                                <p className="mt-1 text-xs text-danger">{errors.subject.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-dark dark:text-white-light">Mesaj</label>
                            <textarea
                                className="form-input mt-1 min-h-[120px]"
                                placeholder="Mesajınızı buraya yazın..."
                                {...register('message')}
                            />
                            {errors.message && (
                                <p className="mt-1 text-xs text-danger">{errors.message.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
