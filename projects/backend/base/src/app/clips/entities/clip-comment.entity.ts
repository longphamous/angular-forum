import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("clip_comments")
export class ClipCommentEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "clip_id", type: "uuid" })
    clipId!: string;

    @Column({ name: "author_id", type: "uuid" })
    authorId!: string;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "parent_id", type: "uuid", nullable: true })
    parentId?: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
