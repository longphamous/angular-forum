import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export type NotificationType =
    | "new_message"
    | "thread_reply"
    | "post_like"
    | "achievement_unlocked"
    | "coins_received"
    | "xp_gained"
    | "mention"
    | "system";

@Entity("notifications")
export class NotificationEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ type: "varchar", length: 50 })
    type!: NotificationType;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "varchar", length: 500 })
    body!: string;

    @Column({ type: "varchar", length: 500, nullable: true })
    link!: string | null;

    @Column({ name: "is_read", type: "boolean", default: false })
    isRead!: boolean;

    @Column({ type: "jsonb", nullable: true })
    metadata!: Record<string, unknown> | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
