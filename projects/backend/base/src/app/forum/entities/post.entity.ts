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

import { ForumPostReactionEntity } from "./post-reaction.entity";
import { ForumThreadEntity } from "./thread.entity";

@Entity("forum_posts")
export class ForumPostEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "thread_id" })
    threadId!: string;

    @ManyToOne(() => ForumThreadEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "thread_id" })
    thread!: ForumThreadEntity;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "is_first_post", default: false })
    isFirstPost!: boolean;

    @Column({ name: "is_edited", default: false })
    isEdited!: boolean;

    @Column({ name: "edited_at", nullable: true, type: "timestamptz" })
    editedAt?: Date;

    @Column({ name: "edit_count", default: 0 })
    editCount!: number;

    @Column({ name: "reaction_count", default: 0 })
    reactionCount!: number;

    @Column({ name: "edit_reason", type: "varchar", length: 300, nullable: true })
    editReason!: string | null;

    /** Array of { content, editedBy, editedAt, reason } snapshots before each edit. */
    @Column({ name: "edit_history", type: "jsonb", default: [] })
    editHistory!: { content: string; editedBy: string; editedAt: string; reason: string | null }[];

    @Column({ name: "is_best_answer", default: false })
    isBestAnswer!: boolean;

    @Column({ name: "is_highlighted", default: false })
    isHighlighted!: boolean;

    @Column({ name: "highlighted_by", type: "uuid", nullable: true })
    highlightedBy?: string;

    @Column({ name: "is_official", default: false })
    isOfficial!: boolean;

    @Column({ name: "knowledge_source", type: "text", nullable: true })
    knowledgeSource?: string;

    @OneToMany(() => ForumPostReactionEntity, (reaction) => reaction.post)
    reactions!: ForumPostReactionEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    @DeleteDateColumn({ name: "deleted_at", type: "timestamptz" })
    deletedAt?: Date;
}
