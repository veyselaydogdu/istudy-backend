// i18n stub — iStudy Admin uses Turkish UI with no runtime i18n
export const getTranslation = () => ({
    initLocale: (_locale: string) => {},
    t: (key: string) => key,
    i18n: {
        language: 'tr',
        changeLanguage: async (_lang: string) => {},
    },
});
