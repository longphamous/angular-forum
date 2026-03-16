import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { ChronikEntryEntity } from "./chronik-entry.entity";

@Entity("chronik_comments")
export class ChronikCommentEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "entry_id", type: "varchar" })
    entryId!: string;

    @Column({ name: "author_id", type: "varchar" })
    authorId!: string;

    @Column({ type: "text" })
    content!: string;

    @Column({ name: "parent_id", type: "varchar", nullable: true })
    parentId!: string | null;

    @Column({ name: "like_count", type: "int", default: 0 })
    likeCount!: number;

    @ManyToOne(() => ChronikEntryEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "entry_id" })
    entry!: ChronikEntryEntity;

    @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "author_id" })
    author!: UserEntity;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
