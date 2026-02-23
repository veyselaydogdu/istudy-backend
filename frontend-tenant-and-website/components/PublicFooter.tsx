import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

const footerLinks = {
    Ürün: [
        { label: 'Özellikler', href: '/#features' },
        { label: 'Fiyatlandırma', href: '/pricing' },
        { label: 'Demo', href: '/contact' },
    ],
    Şirket: [
        { label: 'Hakkımızda', href: '/about' },
        { label: 'İletişim', href: '/contact' },
    ],
    Hesap: [
        { label: 'Giriş Yap', href: '/login' },
        { label: 'Kayıt Ol', href: '/register' },
    ],
};

export default function PublicFooter() {
    return (
        <footer className="bg-dark py-12 text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            <span className="text-xl font-bold">iStudy</span>
                        </Link>
                        <p className="mt-4 text-sm text-[#888ea8]">
                            Anaokuluunuzu kolayca yönetin. Çocuklar, öğretmenler, veliler — hepsi tek platformda.
                        </p>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#888ea8]">
                                {title}
                            </h3>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-[#888ea8] hover:text-white transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 border-t border-[#1b2e4b] pt-8 text-center text-sm text-[#888ea8]">
                    <p>© {new Date().getFullYear()} iStudy. Tüm hakları saklıdır.</p>
                </div>
            </div>
        </footer>
    );
}
