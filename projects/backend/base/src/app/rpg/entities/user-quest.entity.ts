import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

import { QuestEntity } from "./quest.entity";

export type UserQuestStatus = "active" | "completed" | "claimed";

@Entity("user_quests")
@Unique(["userId", "questId", "periodKey"])
export class UserQuestEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "quest_id", type: "uuid" })
    questId!: string;

    @ManyToOne(() => QuestEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "quest_id" })
    quest!: QuestEntity;

    /** Progress towards required_count */
    @Column({ type: "int", default: 0 })
    progress!: number;

    @Column({ type: "varchar", length: 20, default: "active" })
    status!: UserQuestStatus;

    /**
     * Period key for recurring quests, e.g. "2026-04-04" for daily,
     * "2026-W14" for weekly, "2026-04" for monthly.
     * Story/event quests use "once".
     */
    @Column({ name: "period_key", type: "varchar", length: 20 })
    periodKey!: string;

    @Column({ name: "completed_at", type: "timestamptz", nullable: true })
    completedAt!: Date | null;

    @Column({ name: "claimed_at", type: "timestamptz", nullable: true })
    claimedAt!: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
