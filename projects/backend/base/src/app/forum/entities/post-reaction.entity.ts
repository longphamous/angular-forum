import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

import { ForumPostEntity } from "./post.entity";

export type ReactionType = "like" | "heart" | "laugh" | "sad" | "angry" | "wow";

@Entity("forum_post_reactions")
@Unique(["postId", "userId"])
export class ForumPostReactionEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "post_id" })
    postId!: string;

    @ManyToOne(() => ForumPostEntity, (post) => post.reactions, { onDelete: "CASCADE" })
    @JoinColumn({ name: "post_id" })
    post!: ForumPostEntity;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "reaction_type", type: "varchar", length: 20 })
    reactionType!: ReactionType;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
