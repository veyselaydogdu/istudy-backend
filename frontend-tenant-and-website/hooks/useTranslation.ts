import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { IRootState } from '@/store';
import { toggleLocale } from '@/store/themeConfigSlice';
import { translate, type Locale } from '@/i18n';

/**
 * Custom hook for translations.
 * Reads locale from Redux store (synced with localStorage).
 *
 * Usage:
 *   const { t, locale, switchLocale } = useTranslation();
 *   t('common.save') → "Kaydet" or "Save"
 */
export function useTranslation() {
    const locale = useSelector((state: IRootState) => state.themeConfig.locale) as Locale;
    const dispatch = useDispatch();

    const t = useCallback(
        (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
        [locale]
    );

    const switchLocale = useCallback(
        (newLocale: Locale) => {
            dispatch(toggleLocale(newLocale));
        },
        [dispatch]
    );

    return { t, locale, switchLocale };
}
