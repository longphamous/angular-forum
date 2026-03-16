import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { LinkStatus } from "../models/link-database.model";
import { LinkCategoryEntity } from "./link-category.entity";

@Entity("link_entries")
export class LinkEntryEntity {
    @PrimaryGeneratedColumn("uuid") id!: string;
    @Column({ length: 255 }) title!: string;
    @Column({ type: "text" }) url!: string;
    @Column({ type: "text", nullable: true }) description!: string | null;
    @Column({ type: "text", nullable: true }) excerpt!: string | null;
    @Column({ name: "preview_image_url", type: "text", nullable: true }) previewImageUrl!: string | null;
    @Column({ type: "jsonb", default: [] }) tags!: string[];
    @Column({ length: 20, default: "active" }) status!: LinkStatus;
    @Column({ name: "view_count", default: 0 }) viewCount!: number;
    @Column({ type: "numeric", precision: 3, scale: 2, default: 0 }) rating!: number;
    @Column({ name: "rating_count", default: 0 }) ratingCount!: number;
    @Column({ name: "category_id", type: "uuid" }) categoryId!: string;
    @ManyToOne(() => LinkCategoryEntity) category!: LinkCategoryEntity;
    @Column({ name: "author_id", type: "uuid" }) authorId!: string;
    @ManyToOne(() => UserEntity) author!: UserEntity;
    @Column({ name: "assigned_to_id", type: "uuid", nullable: true }) assignedToId!: string | null;
    @ManyToOne(() => UserEntity, { nullable: true }) assignedTo!: UserEntity | null;
    @Column({ type: "text", nullable: true }) address!: string | null;
    @Column({ type: "numeric", precision: 10, scale: 7, nullable: true }) latitude!: number | null;
    @Column({ type: "numeric", precision: 10, scale: 7, nullable: true }) longitude!: number | null;
    @Column({ name: "contact_email", length: 255, nullable: true }) contactEmail!: string | null;
    @Column({ name: "contact_phone", length: 50, nullable: true }) contactPhone!: string | null;
    @Column({ name: "custom_fields", type: "jsonb", nullable: true }) customFields!: Record<string, string> | null;
    @Column({ name: "comment_count", default: 0 }) commentCount!: number;
    @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt!: Date;
}
