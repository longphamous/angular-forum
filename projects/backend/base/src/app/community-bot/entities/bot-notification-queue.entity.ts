import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("community_bot_queue")
export class BotNotificationQueueEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "bot_id", type: "uuid", nullable: true })
    botId!: string | null;

    @Column({ name: "bot_name", type: "varchar", length: 100 })
    botName!: string;

    @Column({ type: "varchar", length: 50 })
    type!: "notification" | "message";

    @Column({ type: "jsonb" })
    payload!: Record<string, unknown>;

    @Column({ type: "varchar", length: 20, default: "pending" })
    status!: "pending" | "processing" | "done" | "failed";

    @Column({ type: "integer", default: 0 })
    retries!: number;

    @Column({ name: "error_message", type: "text", nullable: true })
    errorMessage!: string | null;

    @Column({ name: "processed_at", type: "timestamptz", nullable: true })
    processedAt!: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
