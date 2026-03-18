import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

import { ChronikCommentEntity } from "./chronik-comment.entity";

@Entity("chronik_comment_likes")
@Unique(["commentId", "userId"])
export class ChronikCommentLikeEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "comment_id", type: "varchar" })
    commentId!: string;

    @Column({ name: "user_id", type: "varchar" })
    userId!: string;

    @ManyToOne(() => ChronikCommentEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "comment_id" })
    comment!: ChronikCommentEntity;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
