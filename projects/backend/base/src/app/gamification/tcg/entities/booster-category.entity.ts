import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { BoosterPackEntity } from "./booster-pack.entity";

@Entity("tcg_booster_categories")
export class BoosterCategoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    icon!: string | null;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive!: boolean;

    @Column({ name: "sort_order", type: "int", default: 0 })
    sortOrder!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    @OneToMany(() => BoosterPackEntity, (bp) => bp.category)
    boosterPacks?: BoosterPackEntity[];
}
