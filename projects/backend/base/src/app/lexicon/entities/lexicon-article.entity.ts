import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { LexiconArticleVersionEntity } from "./lexicon-article-version.entity";
import { LexiconCategoryEntity } from "./lexicon-category.entity";
import { LexiconCommentEntity } from "./lexicon-comment.entity";

export type LexiconArticleStatus = "draft" | "pending" | "published" | "rejected" | "archived";

@Entity("lexicon_articles")
export class LexiconArticleEntity {
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

    @Column({ length: 5, default: "de" })
    language!: string;

    @Column({
        type: "enum",
        enum: ["draft", "pending", "published", "rejected", "archived"],
        default: "draft"
    })
    status!: LexiconArticleStatus;

    @Column({ type: "jsonb", default: [] })
    tags!: string[];

    @Column({ name: "custom_field_values", type: "jsonb", default: {} })
    customFieldValues!: Record<string, unknown>;

    @Column({ name: "cover_image_url", nullable: true, type: "text" })
    coverImageUrl!: string | null;

    @Column({ name: "cover_image_media_id", type: "uuid", nullable: true })
    coverImageMediaId?: string;

    @Column({ name: "view_count", default: 0 })
    viewCount!: number;

    @Column({ name: "is_locked", default: false })
    isLocked!: boolean;

    @Column({ name: "allow_comments", default: true })
    allowComments!: boolean;

    @Column({ name: "published_at", nullable: true, type: "timestamptz" })
    publishedAt!: Date | null;

    @Column({ name: "category_id", type: "uuid" })
    categoryId!: string;

    @ManyToOne(() => LexiconCategoryEntity, { nullable: false })
    @JoinColumn({ name: "category_id" })
    category!: LexiconCategoryEntity;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: "author_id" })
    author!: UserEntity;

    @Column({ name: "linked_article_id", nullable: true, type: "uuid" })
    linkedArticleId!: string | null;

    @ManyToOne(() => LexiconArticleEntity, { nullable: true })
    @JoinColumn({ name: "linked_article_id" })
    linkedArticle!: LexiconArticleEntity | null;

    @OneToMany(() => LexiconArticleVersionEntity, (v) => v.article)
    versions!: LexiconArticleVersionEntity[];

    @OneToMany(() => LexiconCommentEntity, (c) => c.article)
    comments!: LexiconCommentEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    @DeleteDateColumn({ name: "deleted_at", type: "timestamptz" })
    deletedAt!: Date | null;
}
