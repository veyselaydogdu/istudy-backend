import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { translate, getStoredLocale, setStoredLocale, defaultLocale, type Locale } from '@/lib/i18n';

type I18nContextType = {
    locale: Locale;
    t: (key: string, params?: Record<string, string | number>) => string;
    switchLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextType>({
    locale: defaultLocale,
    t: (key: string) => key,
    switchLocale: () => {},
});

/**
 * I18n Provider — wraps the app to provide translations.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>(defaultLocale);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        getStoredLocale().then((stored) => {
            setLocale(stored);
            setIsReady(true);
        });
    }, []);

    const t = useCallback(
        (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
        [locale]
    );

    const switchLocale = useCallback(
        (newLocale: Locale) => {
            setLocale(newLocale);
            setStoredLocale(newLocale);
        },
        []
    );

    // Don't render children until locale is loaded from storage
    if (!isReady) return null;

    return (
        <I18nContext.Provider value={{ locale, t, switchLocale }}>
            {children}
        </I18nContext.Provider>
    );
}

/**
 * Custom hook for translations in React Native.
 *
 * Usage:
 *   const { t, locale, switchLocale } = useTranslation();
 *   t('common.save') → "Kaydet" or "Save"
 */
export function useTranslation() {
    return useContext(I18nContext);
}
