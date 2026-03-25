import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export type StorageBackendType = "local" | "ftp" | "s3";

export interface FtpConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    basePath: string;
    secure: boolean;
    publicUrlPrefix: string;
}

export interface S3Config {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicUrlPrefix: string;
    forcePathStyle: boolean;
}

@Entity("media_storage_config")
export class StorageConfigEntity {
    @PrimaryColumn({ type: "varchar", length: 20, default: "default" })
    id!: string;

    @Column({ name: "active_backend", type: "varchar", length: 20, default: "local" })
    activeBackend!: StorageBackendType;

    @Column({ name: "local_base_path", type: "text", default: "uploads/media" })
    localBasePath!: string;

    @Column({ name: "local_public_url_prefix", type: "varchar", length: 500, default: "/uploads/media" })
    localPublicUrlPrefix!: string;

    @Column({ name: "ftp_config", type: "jsonb", nullable: true })
    ftpConfig?: FtpConfig;

    @Column({ name: "s3_config", type: "jsonb", nullable: true })
    s3Config?: S3Config;

    @Column({ name: "max_file_size_mb", type: "int", default: 50 })
    maxFileSizeMb!: number;

    @Column({
        name: "allowed_image_types",
        type: "jsonb",
        default: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"]
    })
    allowedImageTypes!: string[];

    @Column({ name: "allowed_video_types", type: "jsonb", default: ["video/mp4", "video/webm", "video/quicktime"] })
    allowedVideoTypes!: string[];

    @Column({ name: "auto_generate_variants", type: "boolean", default: true })
    autoGenerateVariants!: boolean;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
