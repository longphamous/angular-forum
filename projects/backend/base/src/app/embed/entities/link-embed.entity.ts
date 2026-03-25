import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("link_embeds")
export class LinkEmbedEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index({ unique: true })
    @Column({ type: "text" })
    url!: string;

    @Column({ type: "varchar", length: 500, nullable: true })
    title!: string | null;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ name: "image_url", type: "text", nullable: true })
    imageUrl!: string | null;

    @Column({ name: "site_name", type: "varchar", length: 255, nullable: true })
    siteName!: string | null;

    @Column({ name: "favicon_url", type: "text", nullable: true })
    faviconUrl!: string | null;

    @Column({ name: "fetched_at", type: "timestamptz" })
    fetchedAt!: Date;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
