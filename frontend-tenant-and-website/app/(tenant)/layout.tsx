'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ContentAnimation from '@/components/layouts/content-animation';
import Footer from '@/components/layouts/footer';
import Header from '@/components/layouts/header';
import MainContainer from '@/components/layouts/main-container';
import Overlay from '@/components/layouts/overlay';
import ScrollToTop from '@/components/layouts/scroll-to-top';
import Setting from '@/components/layouts/setting';
import Sidebar from '@/components/layouts/sidebar';
import { Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('tenant_token');
        if (!token) {
            router.push('/login');
            return;
        }

        apiClient
            .get('/auth/me')
            .then((res) => {
                const user = res.data?.data;
                if (!user?.has_active_subscription) {
                    router.push('/subscription/select-plan');
                } else {
                    setIsAuthenticated(true);
                }
            })
            .catch(() => {
                localStorage.removeItem('tenant_token');
                router.push('/login');
            });
    }, [router]);

    if (!isAuthenticated) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#fafafa] dark:bg-[#060818]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <Overlay />
            <ScrollToTop />
            <Setting />

            <MainContainer>
                <Sidebar />
                <div className="main-content flex min-h-screen flex-col">
                    <Header />
                    <ContentAnimation>{children}</ContentAnimation>
                    <Footer />
                </div>
            </MainContainer>
        </>
    );
}
