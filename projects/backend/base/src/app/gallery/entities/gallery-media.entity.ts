import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export type MediaType = "image" | "video" | "youtube";

@Entity("gallery_media")
export class GalleryMediaEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "album_id", type: "uuid" })
    albumId!: string;

    @Column({ name: "owner_id", type: "uuid" })
    ownerId!: string;

    @Column({ type: "varchar", length: 20, default: "image" })
    type!: MediaType;

    @Column({ type: "text" })
    url!: string;

    @Column({ name: "youtube_id", type: "varchar", length: 20, nullable: true })
    youtubeId!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    title!: string | null;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    filename!: string | null;

    @Column({ name: "mime_type", type: "varchar", length: 100, nullable: true })
    mimeType!: string | null;

    @Column({ name: "file_size", type: "bigint", nullable: true })
    fileSize!: number | null;

    @Column({ type: "int", nullable: true })
    width!: number | null;

    @Column({ type: "int", nullable: true })
    height!: number | null;

    @Column({ name: "taken_at", type: "timestamptz", nullable: true })
    takenAt!: Date | null;

    @Column({ type: "decimal", precision: 9, scale: 6, nullable: true })
    latitude!: number | null;

    @Column({ type: "decimal", precision: 9, scale: 6, nullable: true })
    longitude!: number | null;

    @Column({ name: "sort_order", type: "int", default: 0 })
    sortOrder!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
