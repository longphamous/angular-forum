import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

/**
 * Singleton row holding system-wide i18n settings.
 * Uses a fixed primary key so only one row ever exists.
 */
@Entity("i18n_settings")
export class I18nSettingsEntity {
    @PrimaryColumn({ type: "varchar", length: 50, default: "global" })
    id: string = "global";

    /** Whether multi-language mode is active system-wide */
    @Column({ name: "multi_language_enabled", type: "boolean", default: false })
    multiLanguageEnabled!: boolean;

    /** The default locale used when multi-language is disabled */
    @Column({ name: "default_locale", type: "varchar", length: 10, default: "en" })
    defaultLocale!: string;

    /** Available locales when multi-language is enabled, stored as JSON array */
    @Column({ name: "available_locales", type: "jsonb", default: '["en", "de"]' })
    availableLocales!: string[];

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
