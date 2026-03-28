import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

/**
 * Stores admin-managed translation overrides.
 * Each row represents one translation value for a specific key + locale combination.
 */
@Entity("translation_overrides")
@Unique("UQ_translation_key_locale", ["key", "locale"])
export class TranslationOverrideEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    /** Dot-notation translation key, e.g. "login.title" */
    @Column({ type: "varchar", length: 500 })
    key!: string;

    /** Locale code, e.g. "en", "de" */
    @Column({ type: "varchar", length: 10 })
    locale!: string;

    /** The overridden translation value */
    @Column({ type: "text" })
    value!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
