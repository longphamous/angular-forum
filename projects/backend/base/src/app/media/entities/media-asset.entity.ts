import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export type MediaAccessLevel = "public" | "members_only" | "private" | "unlisted";
export type StorageBackend = "local" | "s3" | "ftp" | "external";

@Entity("media_assets")
export class MediaAssetEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "owner_id", type: "uuid" })
    ownerId!: string;

    @Column({ name: "original_filename", length: 500 })
    originalFilename!: string;

    @Column({ name: "mime_type", length: 100 })
    mimeType!: string;

    @Column({ name: "file_size", type: "bigint" })
    fileSize!: number;

    @Column({ type: "int", nullable: true })
    width?: number;

    @Column({ type: "int", nullable: true })
    height?: number;

    @Column({ type: "int", nullable: true })
    duration?: number;

    @Column({ length: 64, nullable: true })
    checksum?: string;

    @Column({ name: "source_module", length: 50 })
    sourceModule!: string;

    @Column({ length: 50, nullable: true })
    category?: string;

    @Column({ name: "access_level", type: "varchar", length: 20, default: "public" })
    accessLevel!: MediaAccessLevel;

    @Column({ name: "storage_backend", type: "varchar", length: 20, default: "local" })
    storageBackend!: StorageBackend;

    @Column({ name: "storage_path", type: "text" })
    storagePath!: string;

    @Column({ name: "alt_text", length: 500, nullable: true })
    altText?: string;

    @Column({ type: "jsonb", default: [] })
    tags!: string[];

    @Column({ type: "jsonb", nullable: true })
    metadata?: Record<string, unknown>;

    @Column({ name: "is_processed", type: "boolean", default: false })
    isProcessed!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
    deletedAt?: Date;
}
