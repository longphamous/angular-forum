import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { TicketEntity } from "./ticket.entity";

@Entity("ticket_work_logs")
export class TicketWorkLogEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "ticket_id", type: "uuid" })
    ticketId!: string;

    @ManyToOne(() => TicketEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "ticket_id" })
    ticket?: TicketEntity;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "time_spent_minutes", type: "int" })
    timeSpentMinutes!: number;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ name: "log_date", type: "date" })
    logDate!: Date;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
