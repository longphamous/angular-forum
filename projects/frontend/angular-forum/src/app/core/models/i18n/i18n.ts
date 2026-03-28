export interface I18nSettings {
    id: string;
    multiLanguageEnabled: boolean;
    defaultLocale: string;
    availableLocales: string[];
    updatedAt: string;
}

export interface TranslationOverride {
    id: string;
    key: string;
    locale: string;
    value: string;
    createdAt: string;
    updatedAt: string;
}

export interface UpsertTranslationPayload {
    key: string;
    locale: string;
    value: string;
}

export interface TranslationRow {
    key: string;
    values: Record<string, string>;
    overrideIds: Record<string, string>;
    hasOverride: boolean;
}
