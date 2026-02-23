'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, GraduationCap } from 'lucide-react';

const navLinks = [
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Özellikler', href: '/#features' },
    { label: 'Fiyatlandırma', href: '/pricing' },
    { label: 'Hakkımızda', href: '/about' },
    { label: 'İletişim', href: '/contact' },
];

export default function PublicNavbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md dark:bg-black/80">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold text-dark dark:text-white">iStudy</span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden items-center gap-6 md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-[#515365] hover:text-primary dark:text-[#888ea8] dark:hover:text-primary"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop CTA */}
                <div className="hidden items-center gap-3 md:flex">
                    <Link
                        href="/login"
                        className="btn btn-outline-primary btn-sm"
                    >
                        Giriş Yap
                    </Link>
                    <Link
                        href="/register"
                        className="btn btn-primary btn-sm"
                    >
                        Ücretsiz Başla
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    type="button"
                    className="md:hidden rounded-md p-2 text-dark dark:text-white"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Menüyü aç/kapat"
                >
                    {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-[#ebedf2] bg-white px-4 pb-4 dark:border-[#1b2e4b] dark:bg-black">
                    <nav className="flex flex-col gap-2 pt-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-md px-3 py-2 text-sm font-medium text-[#515365] hover:bg-[#f1f2f3] hover:text-primary dark:text-[#888ea8] dark:hover:bg-[#191e3a]"
                                onClick={() => setMobileOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="mt-3 flex flex-col gap-2 border-t border-[#ebedf2] pt-3 dark:border-[#1b2e4b]">
                            <Link href="/login" className="btn btn-outline-primary" onClick={() => setMobileOpen(false)}>
                                Giriş Yap
                            </Link>
                            <Link href="/register" className="btn btn-primary" onClick={() => setMobileOpen(false)}>
                                Ücretsiz Başla
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
