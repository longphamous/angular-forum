import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { BoosterPackCardEntity } from "./booster-pack-card.entity";

@Entity("tcg_booster_packs")
export class BoosterPackEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ name: "image_url", type: "text", nullable: true })
    imageUrl!: string | null;

    @Column({ type: "int" })
    price!: number;

    @Column({ name: "cards_per_pack", type: "int", default: 5 })
    cardsPerPack!: number;

    @Column({ type: "varchar", name: "guaranteed_rarity", length: 20, nullable: true })
    guaranteedRarity!: string | null;

    @Column({ length: 100 })
    series!: string;

    @Column({ name: "available_from", type: "timestamptz", nullable: true })
    availableFrom!: Date | null;

    @Column({ name: "available_until", type: "timestamptz", nullable: true })
    availableUntil!: Date | null;

    @Column({ name: "max_purchases_per_user", type: "int", nullable: true })
    maxPurchasesPerUser!: number | null;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive!: boolean;

    @Column({ name: "sort_order", type: "int", default: 0 })
    sortOrder!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    @OneToMany(() => BoosterPackCardEntity, (bpc) => bpc.boosterPack)
    packCards?: BoosterPackCardEntity[];
}
