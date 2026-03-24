import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("clips")
export class ClipEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @Column({ length: 255 })
    title!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ name: "video_url", type: "text" })
    videoUrl!: string;

    @Column({ name: "video_media_id", type: "uuid", nullable: true })
    videoMediaId?: string;

    @Column({ name: "thumbnail_url", type: "text", nullable: true })
    thumbnailUrl?: string;

    @Column({ name: "thumbnail_media_id", type: "uuid", nullable: true })
    thumbnailMediaId?: string;

    @Column({ type: "jsonb", default: [] })
    tags!: string[];

    @Column({ name: "view_count", type: "int", default: 0 })
    viewCount!: number;

    @Column({ name: "like_count", type: "int", default: 0 })
    likeCount!: number;

    @Column({ name: "comment_count", type: "int", default: 0 })
    commentCount!: number;

    @Column({ name: "share_count", type: "int", default: 0 })
    shareCount!: number;

    @Column({ type: "int", default: 0 })
    duration!: number;

    @Column({ name: "is_published", type: "boolean", default: false })
    isPublished!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
