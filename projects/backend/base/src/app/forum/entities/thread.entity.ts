import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { ForumEntity } from "./forum.entity";

@Entity("forum_threads")
export class ForumThreadEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "forum_id" })
    forumId!: string;

    @ManyToOne(() => ForumEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "forum_id" })
    forum!: ForumEntity;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @Column({ length: 200 })
    title!: string;

    @Column({ unique: true, length: 250 })
    slug!: string;

    @Column({ name: "is_pinned", default: false })
    isPinned!: boolean;

    @Column({ name: "is_locked", default: false })
    isLocked!: boolean;

    @Column({ name: "is_sticky", default: false })
    isSticky!: boolean;

    @Column({ name: "view_count", default: 0 })
    viewCount!: number;

    @Column({ name: "reply_count", default: 0 })
    replyCount!: number;

    @Column({ type: "simple-json", nullable: true })
    tags?: string[];

    @Column({ name: "last_post_at", nullable: true, type: "timestamptz" })
    lastPostAt?: Date;

    @Column({ name: "last_post_by_user_id", nullable: true, type: "uuid" })
    lastPostByUserId?: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    @DeleteDateColumn({ name: "deleted_at", type: "timestamptz" })
    deletedAt?: Date;
}
