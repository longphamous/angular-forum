import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

import { ChronikEntryEntity } from "./chronik-entry.entity";

@Entity("chronik_hidden")
@Unique(["userId", "entryId"])
export class ChronikHiddenEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "varchar" })
    userId!: string;

    @Column({ name: "entry_id", type: "varchar" })
    entryId!: string;

    @ManyToOne(() => ChronikEntryEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "entry_id" })
    entry!: ChronikEntryEntity;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
