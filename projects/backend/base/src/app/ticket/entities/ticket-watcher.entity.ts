import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { TicketEntity } from "./ticket.entity";

@Entity("ticket_watchers")
export class TicketWatcherEntity {
    @PrimaryColumn({ name: "ticket_id", type: "uuid" })
    ticketId!: string;

    @ManyToOne(() => TicketEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "ticket_id" })
    ticket?: TicketEntity;

    @PrimaryColumn({ name: "user_id", type: "uuid" })
    userId!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
