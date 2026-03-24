import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("media_variants")
@Unique(["assetId", "variantKey"])
export class MediaVariantEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "asset_id", type: "uuid" })
    assetId!: string;

    @Column({ name: "variant_key", length: 50 })
    variantKey!: string;

    @Column({ name: "mime_type", length: 100 })
    mimeType!: string;

    @Column({ name: "file_size", type: "bigint" })
    fileSize!: number;

    @Column({ type: "int", nullable: true })
    width?: number;

    @Column({ type: "int", nullable: true })
    height?: number;

    @Column({ name: "storage_path", type: "text" })
    storagePath!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
