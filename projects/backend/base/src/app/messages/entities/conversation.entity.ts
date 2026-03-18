import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("conversations")
export class ConversationEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "participant_ids", type: "uuid", array: true })
    participantIds!: string[];

    @Column({ type: "varchar", length: 255, nullable: true })
    subject!: string | null;

    @Column({ name: "last_message_preview", type: "varchar", length: 500, nullable: true })
    lastMessagePreview!: string | null;

    @Column({ name: "last_message_at", type: "timestamptz", nullable: true })
    lastMessageAt!: Date | null;

    @Column({ name: "initiated_by_user_id", type: "uuid" })
    initiatedByUserId!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
