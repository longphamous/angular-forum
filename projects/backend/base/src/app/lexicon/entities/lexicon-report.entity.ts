import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { LexiconArticleEntity } from "./lexicon-article.entity";

export type LexiconReportStatus = "open" | "resolved" | "dismissed";

@Entity("lexicon_reports")
export class LexiconReportEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "article_id", type: "uuid" })
    articleId!: string;

    @ManyToOne(() => LexiconArticleEntity, { onDelete: "CASCADE" })
    article!: LexiconArticleEntity;

    @Column({ name: "reporter_id", type: "uuid" })
    reporterId!: string;

    @ManyToOne(() => UserEntity)
    reporter!: UserEntity;

    @Column({ type: "text" })
    reason!: string;

    @Column({ type: "enum", enum: ["open", "resolved", "dismissed"], default: "open" })
    status!: LexiconReportStatus;

    @Column({ name: "resolved_by", nullable: true, type: "uuid" })
    resolvedBy!: string | null;

    @Column({ name: "resolved_at", nullable: true, type: "timestamptz" })
    resolvedAt!: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
