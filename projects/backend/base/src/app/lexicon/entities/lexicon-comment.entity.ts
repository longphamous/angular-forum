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
import { LexiconArticleEntity } from "./lexicon-article.entity";

@Entity("lexicon_comments")
export class LexiconCommentEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "article_id", type: "uuid" })
    articleId!: string;

    @ManyToOne(() => LexiconArticleEntity, (a) => a.comments, { onDelete: "CASCADE" })
    article!: LexiconArticleEntity;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @ManyToOne(() => UserEntity)
    author!: UserEntity;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "parent_id", nullable: true, type: "uuid" })
    parentId!: string | null;

    @ManyToOne(() => LexiconCommentEntity, (c) => c.replies, { nullable: true, onDelete: "CASCADE" })
    parent!: LexiconCommentEntity | null;

    @OneToMany(() => LexiconCommentEntity, (c) => c.parent)
    replies!: LexiconCommentEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
