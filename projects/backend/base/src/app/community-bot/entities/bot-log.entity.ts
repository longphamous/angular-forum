import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("community_bot_logs")
export class BotLogEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "bot_id", type: "uuid", nullable: true })
    botId!: string | null;

    @Column({ name: "bot_name", type: "varchar", length: 100 })
    botName!: string;

    @Column({ type: "varchar", length: 50 })
    trigger!: string;

    @Column({ type: "varchar", length: 50 })
    action!: string;

    @Column({ type: "varchar", length: 20 })
    status!: "success" | "failed" | "test" | "skipped";

    @Column({ name: "target_user_id", type: "uuid", nullable: true })
    targetUserId!: string | null;

    @Column({ name: "target_user_name", type: "varchar", length: 100, nullable: true })
    targetUserName!: string | null;

    @Column({ type: "text", nullable: true })
    message!: string | null;

    @Column({ type: "jsonb", nullable: true })
    details!: Record<string, unknown> | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
