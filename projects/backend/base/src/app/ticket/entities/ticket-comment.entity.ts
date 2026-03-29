import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { TicketEntity } from "./ticket.entity";

@Entity("ticket_comments")
export class TicketCommentEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "ticket_id", type: "uuid" })
    ticketId!: string;

    @ManyToOne(() => TicketEntity, (t) => t.comments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "ticket_id" })
    ticket!: TicketEntity;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @Column({ type: "text" })
    content!: string;

    /** Internal notes are only visible to staff/admins, not the ticket author */
    @Column({ name: "is_internal", default: false })
    isInternal!: boolean;

    /** If this comment changed the ticket status */
    @Column({ name: "status_change", type: "varchar", length: 20, nullable: true })
    statusChange?: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
