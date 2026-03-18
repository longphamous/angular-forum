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

    /** Array of option labels, e.g. ["Option A", "Option B", "Option C"] */
    @Column({ type: "jsonb" })
    options!: string[];

    /** Map of optionIndex → vote count, e.g. { "0": 5, "1": 3 } */
    @Column({ type: "jsonb", default: {} })
    votes!: Record<string, number>;

    /** Map of userId → optionIndex they voted for, e.g. { "user-uuid": 0 } */
    @Column({ name: "voter_map", type: "jsonb", default: {} })
    voterMap!: Record<string, number>;

    @Column({ name: "is_multiple_choice", default: false })
    isMultipleChoice!: boolean;

    @Column({ name: "is_closed", default: false })
    isClosed!: boolean;

    @Column({ name: "closes_at", type: "timestamptz", nullable: true })
    closesAt!: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
