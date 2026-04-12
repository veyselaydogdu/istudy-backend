import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { availableLocales, type Locale } from '@/lib/i18n';
import { AppColors } from '@/constants/theme';

/**
 * Language switcher component for the mobile app.
 * Renders horizontal flag buttons to switch locale.
 *
 * Usage: <LanguageSwitcher />
 */
export default function LanguageSwitcher() {
    const { locale, switchLocale, t } = useTranslation();

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{t('profile.language')}</Text>
            <View style={styles.options}>
                {availableLocales.map((loc) => (
                    <TouchableOpacity
                        key={loc.code}
                        style={[
                            styles.button,
                            locale === loc.code && styles.activeButton,
                        ]}
                        onPress={() => switchLocale(loc.code)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.flag}>{loc.flag}</Text>
                        <Text style={[
                            styles.buttonText,
                            locale === loc.code && styles.activeText,
                        ]}>
                            {loc.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: AppColors.onSurface,
        marginBottom: 8,
    },
    options: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: AppColors.surfaceContainer,
        gap: 6,
    },
    activeButton: {
        backgroundColor: AppColors.primaryContainer,
        borderWidth: 1,
        borderColor: AppColors.primary,
    },
    flag: {
        fontSize: 18,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '500',
        color: AppColors.onSurface,
    },
    activeText: {
        color: AppColors.primary,
        fontWeight: '700',
    },
});
