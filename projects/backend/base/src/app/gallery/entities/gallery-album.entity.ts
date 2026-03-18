import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export type AlbumAccess = "public" | "members_only" | "private";

@Entity("gallery_albums")
export class GalleryAlbumEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    category!: string | null;

    @Column({ name: "cover_media_id", type: "uuid", nullable: true })
    coverMediaId!: string | null;

    @Column({ name: "owner_id", type: "uuid" })
    ownerId!: string;

    @Column({ name: "access_level", type: "varchar", length: 20, default: "public" })
    accessLevel!: AlbumAccess;

    @Column({ type: "varchar", length: 255, nullable: true })
    password!: string | null;

    @Column({ name: "watermark_enabled", type: "boolean", default: false })
    watermarkEnabled!: boolean;

    @Column({ name: "allow_comments", type: "boolean", default: true })
    allowComments!: boolean;

    @Column({ name: "allow_ratings", type: "boolean", default: true })
    allowRatings!: boolean;

    @Column({ name: "allow_download", type: "boolean", default: true })
    allowDownload!: boolean;

    @Column({ type: "jsonb", default: [] })
    tags!: string[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
