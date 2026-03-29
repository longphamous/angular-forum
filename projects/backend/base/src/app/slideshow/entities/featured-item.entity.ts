import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export type FeaturedSection = "featured" | "discount" | "event";
export type FeaturedSourceType = "shop" | "booster" | "marketplace" | "custom";

@Entity("featured_items")
export class FeaturedItemEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 30, default: "featured" })
    section!: FeaturedSection;

    @Column({ name: "source_type", type: "varchar", length: 30, default: "custom" })
    sourceType!: FeaturedSourceType;

    @Column({ name: "source_id", type: "uuid", nullable: true })
    sourceId!: string | null;

    @Column({ type: "varchar", length: 200 })
    title!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ name: "image_url", type: "varchar", length: 500, nullable: true })
    imageUrl!: string | null;

    @Column({ name: "link_url", type: "varchar", length: 500, nullable: true })
    linkUrl!: string | null;

    @Column({ name: "badge_text", type: "varchar", length: 50, nullable: true })
    badgeText!: string | null;

    @Column({ name: "badge_color", type: "varchar", length: 20, default: "#EF4444" })
    badgeColor!: string;

    @Column({ name: "original_price", type: "int", nullable: true })
    originalPrice!: number | null;

    @Column({ name: "discount_price", type: "int", nullable: true })
    discountPrice!: number | null;

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
}
