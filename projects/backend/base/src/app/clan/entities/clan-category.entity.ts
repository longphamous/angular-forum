import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { ClanEntity } from "./clan.entity";

@Entity("clan_categories")
export class ClanCategoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    icon?: string;

    @Column({ type: "int", default: 0 })
    position!: number;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @OneToMany(() => ClanEntity, (c) => c.category)
    clans?: ClanEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
