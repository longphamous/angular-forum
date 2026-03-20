import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { LexiconArticleEntity } from "./lexicon-article.entity";

@Entity("lexicon_article_versions")
@Unique(["articleId", "versionNumber"])
export class LexiconArticleVersionEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "article_id", type: "uuid" })
    articleId!: string;

    @ManyToOne(() => LexiconArticleEntity, (a) => a.versions, { onDelete: "CASCADE" })
    article!: LexiconArticleEntity;

    @Column({ name: "version_number" })
    versionNumber!: number;

    @Column({ length: 255 })
    title!: string;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "custom_field_values", type: "jsonb", default: {} })
    customFieldValues!: Record<string, unknown>;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @ManyToOne(() => UserEntity)
    author!: UserEntity;

    @Column({ name: "change_summary", nullable: true, type: "varchar", length: 500 })
    changeSummary!: string | null;

    @Column({ name: "is_protected", default: false })
    isProtected!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
