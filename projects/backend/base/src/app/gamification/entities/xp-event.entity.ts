import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export type XpEventType = "create_thread" | "create_post" | "receive_reaction" | "give_reaction";

@Entity("xp_events")
export class XpEventEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "event_type", length: 50 })
    eventType!: XpEventType;

    @Column({ name: "xp_gained", type: "int" })
    xpGained!: number;

    @Column({ name: "reference_id", type: "varchar", nullable: true, length: 255 })
    referenceId?: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
