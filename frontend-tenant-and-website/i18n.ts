import trLocale from '@/locales/tr.json';
import enLocale from '@/locales/en.json';

export type Locale = 'tr' | 'en';
export type TranslationKey = keyof typeof trLocale;

const locales: Record<Locale, Record<string, string>> = {
    tr: trLocale,
    en: enLocale,
};

export const defaultLocale: Locale = 'tr';
export const availableLocales: { code: Locale; label: string; flag: string }[] = [
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
];

/**
 * Get translation for a given key.
 * Falls back to Turkish if key is not found in current locale.
 * Falls back to key itself if not found in any locale.
 */
export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
    let text = locales[locale]?.[key] ?? locales.tr[key] ?? key;
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
    }
    return text;
}

/**
 * Get stored locale from localStorage (client-side only).
 */
export function getStoredLocale(): Locale {
    if (typeof window === 'undefined') return defaultLocale;
    const stored = localStorage.getItem('locale');
    if (stored === 'en' || stored === 'tr') return stored;
    return defaultLocale;
}

/**
 * Save locale to localStorage.
 */
export function setStoredLocale(locale: Locale): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('locale', locale);
    }
}

// Backward compatibility — keep getTranslation export for existing imports
export const getTranslation = () => ({
    initLocale: (_locale: string) => {},
    t: (key: string) => translate(getStoredLocale(), key),
    i18n: {
        language: getStoredLocale(),
        changeLanguage: async (lang: string) => {
            setStoredLocale(lang as Locale);
        },
    },
});
