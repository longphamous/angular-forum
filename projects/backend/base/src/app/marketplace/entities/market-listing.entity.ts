import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export type ListingType = "sell" | "buy" | "trade" | "gift";
export type ListingStatus = "draft" | "pending" | "active" | "sold" | "closed" | "expired" | "archived";

@Entity("market_listings")
export class MarketListingEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
    price!: number | null;

    @Column({ type: "varchar", length: 10, default: "EUR" })
    currency!: string;

    @Column({ type: "varchar", length: 20 })
    type!: ListingType;

    @Column({ type: "varchar", length: 20, default: "pending" })
    status!: ListingStatus;

    @Column({ name: "category_id", type: "uuid" })
    categoryId!: string;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @Column({ type: "text", array: true, default: [] })
    images!: string[];

    @Column({ name: "custom_fields", type: "jsonb", nullable: true })
    customFields!: Record<string, unknown> | null;

    @Column({ type: "text", array: true, default: [] })
    tags!: string[];

    @Column({ name: "expires_at", type: "timestamptz", nullable: true })
    expiresAt!: Date | null;

    @Column({ name: "view_count", type: "int", default: 0 })
    viewCount!: number;

    @Column({ name: "offer_count", type: "int", default: 0 })
    offerCount!: number;

    @Column({ name: "comment_count", type: "int", default: 0 })
    commentCount!: number;

    @Column({ name: "best_offer_id", type: "uuid", nullable: true })
    bestOfferId!: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    @DeleteDateColumn({ name: "deleted_at", type: "timestamptz" })
    deletedAt!: Date | null;
}
