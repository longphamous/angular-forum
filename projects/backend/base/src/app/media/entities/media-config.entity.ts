import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export type StorageType = "local" | "s3" | "ftp";

export interface S3Config {
    bucket: string;
    region: string;
    endpoint?: string;
    accessKeyId: string;
    secretAccessKey: string;
    pathPrefix?: string;
    publicBaseUrl?: string;
}

export interface FtpConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    basePath: string;
    publicBaseUrl: string;
    secure: boolean;
}

export interface LocalConfig {
    basePath: string;
    publicUrlPrefix: string;
}

@Entity("media_config")
export class MediaConfigEntity {
    @PrimaryColumn({ type: "varchar", length: 20, default: "default" })
    id!: string;

    @Column({ name: "active_storage", type: "varchar", length: 20, default: "local" })
    activeStorage!: StorageType;

    @Column({ name: "local_config", type: "jsonb", default: { basePath: "uploads/media", publicUrlPrefix: "/uploads/media" } })
    localConfig!: LocalConfig;

    @Column({ name: "s3_config", type: "jsonb", nullable: true })
    s3Config?: S3Config;

    @Column({ name: "ftp_config", type: "jsonb", nullable: true })
    ftpConfig?: FtpConfig;

    @Column({ name: "max_file_size_mb", type: "int", default: 50 })
    maxFileSizeMb!: number;

    @Column({ name: "allowed_mime_types", type: "jsonb", default: ["image/*", "video/*", "audio/*"] })
    allowedMimeTypes!: string[];

    @Column({ name: "enable_image_processing", type: "boolean", default: true })
    enableImageProcessing!: boolean;

    @Column({ name: "enable_video_processing", type: "boolean", default: false })
    enableVideoProcessing!: boolean;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
