import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export type QuestType = "daily" | "weekly" | "monthly" | "story" | "event";
export type QuestRewardType = "xp" | "coins" | "item" | "glory";
export type QuestTrigger =
    | "create_post"
    | "create_thread"
    | "give_reaction"
    | "receive_reaction"
    | "login"
    | "buy_item"
    | "equip_item"
    | "allocate_points"
    | "upload_gallery"
    | "create_blog_post"
    | "create_clip"
    | "win_lotto"
    | "send_message"
    | "add_friend"
    | "custom";

export interface QuestReward {
    type: QuestRewardType;
    amount: number;
    itemId?: string;
}

@Entity("quests")
export class QuestEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 200 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    icon!: string | null;

    @Column({ name: "quest_type", type: "varchar", length: 20 })
    questType!: QuestType;

    @Column({ name: "trigger_type", type: "varchar", length: 50 })
    triggerType!: QuestTrigger;

    @Column({ name: "required_count", type: "int", default: 1 })
    requiredCount!: number;

    @Column({ type: "jsonb" })
    rewards!: QuestReward[];

    @Column({ name: "glory_reward", type: "int", default: 0 })
    gloryReward!: number;

    @Column({ name: "required_level", type: "int", nullable: true })
    requiredLevel!: number | null;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive!: boolean;

    @Column({ name: "sort_order", type: "int", default: 0 })
    sortOrder!: number;

    // ── Event-specific fields ─────────────────────────────────────────────────

    @Column({ name: "event_starts_at", type: "timestamptz", nullable: true })
    eventStartsAt!: Date | null;

    @Column({ name: "event_ends_at", type: "timestamptz", nullable: true })
    eventEndsAt!: Date | null;

    @Column({ name: "event_banner_url", type: "varchar", length: 500, nullable: true })
    eventBannerUrl!: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
