import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { Toaster } from 'sonner';
import ProviderComponent from '@/components/layouts/provider-component';
import 'react-perfect-scrollbar/dist/css/styles.css';
import '../styles/globals.css';

const nunito = Nunito({
    weight: ['400', '500', '600', '700', '800'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-nunito',
});

export const metadata: Metadata = {
    title: {
        template: '%s | iStudy',
        default: 'iStudy - Anaokulu Yönetim Platformu',
    },
    description: 'iStudy ile anaokuluunuzu kolayca yönetin.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="tr">
            <body className={nunito.variable}>
                <ProviderComponent>
                    {children}
                    <Toaster richColors position="top-right" />
                </ProviderComponent>
            </body>
        </html>
    );
}
