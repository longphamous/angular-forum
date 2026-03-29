import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { TicketEntity } from "./ticket.entity";

@Entity("ticket_attachments")
export class TicketAttachmentEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "ticket_id", type: "uuid" })
    ticketId!: string;

    @ManyToOne(() => TicketEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "ticket_id" })
    ticket?: TicketEntity;

    @Column({ name: "file_name", length: 500 })
    fileName!: string;

    @Column({ name: "file_path", length: 1000 })
    filePath!: string;

    @Column({ name: "file_size", type: "int", default: 0 })
    fileSize!: number;

    @Column({ name: "mime_type", length: 100, nullable: true })
    mimeType?: string;

    @Column({ name: "uploaded_by", type: "uuid" })
    uploadedBy!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
