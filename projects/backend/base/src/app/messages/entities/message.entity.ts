import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("messages")
export class MessageEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "conversation_id", type: "uuid", nullable: true })
    conversationId!: string | null;

    @Column({ name: "sender_id", type: "uuid" })
    senderId!: string;

    @Column({ name: "recipient_id", type: "uuid", nullable: true })
    recipientId!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    subject!: string | null;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "is_draft", type: "boolean", default: false })
    isDraft!: boolean;

    @Column({ name: "read_by_user_ids", type: "uuid", array: true, default: [] })
    readByUserIds!: string[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
