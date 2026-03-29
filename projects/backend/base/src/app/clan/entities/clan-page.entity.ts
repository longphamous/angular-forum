import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { ClanEntity } from "./clan.entity";

@Entity("clan_pages")
export class ClanPageEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "clan_id", type: "uuid" })
    clanId!: string;

    @ManyToOne(() => ClanEntity, (c) => c.pages, { onDelete: "CASCADE" })
    @JoinColumn({ name: "clan_id" })
    clan!: ClanEntity;

    @Column({ length: 200 })
    title!: string;

    @Column({ type: "varchar", length: 200 })
    slug!: string;

    @Column({ type: "text", nullable: true })
    content?: string;

    @Column({ type: "int", default: 0 })
    position!: number;

    @Column({ name: "is_published", default: true })
    isPublished!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
