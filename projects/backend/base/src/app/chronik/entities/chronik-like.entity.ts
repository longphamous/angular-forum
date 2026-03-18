import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

import { ChronikEntryEntity } from "./chronik-entry.entity";

@Entity("chronik_likes")
@Unique(["entryId", "userId"])
export class ChronikLikeEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "entry_id", type: "varchar" })
    entryId!: string;

    @Column({ name: "user_id", type: "varchar" })
    userId!: string;

    @ManyToOne(() => ChronikEntryEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "entry_id" })
    entry!: ChronikEntryEntity;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
