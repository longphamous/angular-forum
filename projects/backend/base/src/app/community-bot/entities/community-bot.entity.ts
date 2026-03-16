import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { ActionConfig, BotAction, BotCondition, BotTrigger, TriggerConfig } from "../models/bot.model";

@Entity("community_bots")
export class CommunityBotEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 100 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ type: "boolean", default: true })
    enabled!: boolean;

    @Column({ name: "test_mode", type: "boolean", default: false })
    testMode!: boolean;

    @Column({ type: "varchar", length: 50 })
    trigger!: BotTrigger;

    @Column({ name: "trigger_config", type: "jsonb", nullable: true })
    triggerConfig!: TriggerConfig | null;

    @Column({ type: "jsonb", nullable: true })
    conditions!: BotCondition[] | null;

    @Column({ type: "varchar", length: 50 })
    action!: BotAction;

    @Column({ name: "action_config", type: "jsonb", nullable: true })
    actionConfig!: ActionConfig | null;

    @Column({ type: "varchar", length: 10, default: "auto" })
    language!: string;

    @Column({ name: "last_run_at", type: "timestamptz", nullable: true })
    lastRunAt!: Date | null;

    @Column({ name: "run_count", type: "integer", default: 0 })
    runCount!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
