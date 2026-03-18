import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { ForumThreadEntity } from "./thread.entity";

@Entity("forum_polls")
export class ForumPollEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "thread_id", type: "uuid", unique: true })
    threadId!: string;

    @OneToOne(() => ForumThreadEntity)
    @JoinColumn({ name: "thread_id" })
    thread!: ForumThreadEntity;

    @Column({ length: 300 })
    question!: string;

    /** Array of option objects with text and optional image URL. */
    @Column({ type: "jsonb" })
    options!: { text: string; imageUrl?: string }[];

    /** Map of optionIndex → vote count, e.g. { "0": 5, "1": 3 } */
    @Column({ type: "jsonb", default: {} })
    votes!: Record<string, number>;

    /** Map of userId → optionIndex they voted for, e.g. { "user-uuid": 0 } */
    @Column({ name: "voter_map", type: "jsonb", default: {} })
    voterMap!: Record<string, number>;

    /** Who created the poll — needed for permission checks on editing. */
    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @Column({ name: "is_multiple_choice", default: false })
    isMultipleChoice!: boolean;

    /** If true, voter identities are hidden (voterMap is not exposed). */
    @Column({ name: "is_anonymous", default: false })
    isAnonymous!: boolean;

    /** If true (and not anonymous), show who voted for what in the results. */
    @Column({ name: "show_voter_names", default: false })
    showVoterNames!: boolean;

    @Column({ name: "allow_vote_change", default: true })
    allowVoteChange!: boolean;

    /** Deadline until which votes can be changed. Null = always changeable (if allowVoteChange is true). */
    @Column({ name: "vote_change_deadline", type: "timestamptz", nullable: true })
    voteChangeDeadline!: Date | null;

    @Column({ name: "is_closed", default: false })
    isClosed!: boolean;

    @Column({ name: "closes_at", type: "timestamptz", nullable: true })
    closesAt!: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
