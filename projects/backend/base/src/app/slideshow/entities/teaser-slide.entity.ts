import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export interface SlideTranslation {
    title?: string;
    description?: string;
}

@Entity("teaser_slides")
export class TeaserSlideEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    /** Per-language overrides: { "en": { title, description }, "de": { ... } } */
    @Column({ type: "jsonb", nullable: true })
    translations!: Record<string, SlideTranslation> | null;

    @Column({ name: "image_url", type: "varchar", length: 500 })
    imageUrl!: string;

    @Column({ name: "link_url", type: "varchar", length: 500, nullable: true })
    linkUrl!: string | null;

    @Column({ name: "link_label", type: "varchar", length: 100, nullable: true })
    linkLabel!: string | null;

    /** If true, clicking the whole slide navigates to linkUrl (not just the button) */
    @Column({ name: "link_full_slide", type: "boolean", default: false })
    linkFullSlide!: boolean;

    /** "overlay" = dark gradient, "glass" = frosted glass box */
    @Column({ name: "text_style", type: "varchar", length: 20, default: "overlay" })
    textStyle!: string;

    /** "left" | "center" */
    @Column({ name: "text_align", type: "varchar", length: 10, default: "left" })
    textAlign!: string;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive!: boolean;

    @Column({ name: "sort_order", type: "int", default: 0 })
    sortOrder!: number;

    @Column({ name: "valid_from", type: "timestamptz", nullable: true })
    validFrom!: Date | null;

    @Column({ name: "valid_until", type: "timestamptz", nullable: true })
    validUntil!: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
