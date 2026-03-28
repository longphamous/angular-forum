import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { TicketEntity } from "./ticket.entity";

export type TicketActivityAction = "created" | "updated" | "status_changed" | "commented" | "linked" | "unlinked";

@Entity("ticket_activity_log")
export class TicketActivityLogEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "ticket_id", type: "uuid" })
    ticketId!: string;

    @ManyToOne(() => TicketEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "ticket_id" })
    ticket?: TicketEntity;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    field?: string;

    @Column({ name: "old_value", type: "text", nullable: true })
    oldValue?: string;

    @Column({ name: "new_value", type: "text", nullable: true })
    newValue?: string;

    @Column({ type: "varchar", length: 30 })
    action!: TicketActivityAction;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
