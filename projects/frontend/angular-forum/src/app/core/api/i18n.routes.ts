export const I18N_ROUTES = {
    settings: () => "/i18n/settings",
    overrides: () => "/i18n/overrides",
    overridesByLocale: (locale: string) => `/i18n/overrides/${locale}`,
    overridesBulk: () => "/i18n/overrides/bulk",
    overrideDetail: (id: string) => `/i18n/overrides/${id}`
} as const;
