import trLocale from '@/locales/tr.json';
import enLocale from '@/locales/en.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const LOCALE_STORAGE_KEY = 'locale';

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
 * Get stored locale from AsyncStorage.
 */
export async function getStoredLocale(): Promise<Locale> {
    try {
        const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        if (stored === 'en' || stored === 'tr') return stored;
    } catch {}
    return defaultLocale;
}

/**
 * Save locale to AsyncStorage.
 */
export async function setStoredLocale(locale: Locale): Promise<void> {
    try {
        await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {}
}
