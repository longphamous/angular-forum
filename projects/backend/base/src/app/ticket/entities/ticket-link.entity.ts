import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { TicketEntity } from "./ticket.entity";

export type TicketLinkType = "blocks" | "is_blocked_by" | "relates_to" | "duplicates";

@Entity("ticket_links")
export class TicketLinkEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "source_ticket_id", type: "uuid" })
    sourceTicketId!: string;

    @ManyToOne(() => TicketEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "source_ticket_id" })
    sourceTicket?: TicketEntity;

    @Column({ name: "target_ticket_id", type: "uuid" })
    targetTicketId!: string;

    @ManyToOne(() => TicketEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "target_ticket_id" })
    targetTicket?: TicketEntity;

    @Column({ name: "link_type", type: "varchar", length: 30 })
    linkType!: TicketLinkType;

    @Column({ name: "created_by", type: "uuid" })
    createdBy!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
