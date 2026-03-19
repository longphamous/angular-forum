import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export type LogLevel = "info" | "warn" | "error";

export type LogCategory =
    | "auth"
    | "user"
    | "forum"
    | "credit"
    | "shop"
    | "marketplace"
    | "gamification"
    | "tcg"
    | "lotto"
    | "gallery"
    | "blog"
    | "admin"
    | "system";

@Entity("admin_logs")
export class AdminLogEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 10 })
    level!: LogLevel;

    @Column({ type: "varchar", length: 50 })
    category!: LogCategory;

    @Column({ type: "varchar", length: 100 })
    action!: string;

    @Column({ type: "varchar", length: 1000 })
    message!: string;

    @Column({ name: "user_id", type: "uuid", nullable: true })
    userId!: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    username!: string | null;

    @Column({ name: "target_id", type: "varchar", length: 255, nullable: true })
    targetId!: string | null;

    @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
    ipAddress!: string | null;

    @Column({ type: "jsonb", nullable: true })
    metadata!: Record<string, unknown> | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
