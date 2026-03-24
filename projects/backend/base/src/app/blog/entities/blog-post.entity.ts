import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { BlogCategoryEntity } from "./blog-category.entity";
import { BlogCommentEntity } from "./blog-comment.entity";

export type BlogType = "personal" | "editorial" | "news" | "diary";
export type BlogStatus = "draft" | "published" | "archived";

@Entity("blog_posts")
export class BlogPostEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 255 })
    title!: string;

    @Column({ unique: true, length: 255 })
    slug!: string;

    @Column({ type: "text" })
    content!: string;

    @Column({ nullable: true, type: "text" })
    excerpt!: string | null;

    @Column({ type: "enum", enum: ["personal", "editorial", "news", "diary"], default: "personal" })
    type!: BlogType;

    @Column({ type: "enum", enum: ["draft", "published", "archived"], default: "draft" })
    status!: BlogStatus;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @ManyToOne(() => UserEntity)
    author!: UserEntity;

    @Column({ name: "category_id", nullable: true, type: "uuid" })
    categoryId!: string | null;

    @ManyToOne(() => BlogCategoryEntity, { nullable: true })
    category!: BlogCategoryEntity | null;

    @Column({ name: "cover_image_url", nullable: true, type: "text" })
    coverImageUrl!: string | null;

    @Column({ name: "cover_image_media_id", type: "uuid", nullable: true })
    coverImageMediaId?: string;

    @Column({ type: "jsonb", default: [] })
    tags!: string[];

    @Column({ name: "view_count", default: 0 })
    viewCount!: number;

    @Column({ name: "allow_comments", default: true })
    allowComments!: boolean;

    @Column({ name: "published_at", nullable: true, type: "timestamptz" })
    publishedAt!: Date | null;

    @OneToMany(() => BlogCommentEntity, (c) => c.post)
    comments!: BlogCommentEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
