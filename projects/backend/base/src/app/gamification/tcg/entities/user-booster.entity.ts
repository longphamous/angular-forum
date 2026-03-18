import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { BoosterPackEntity } from "./booster-pack.entity";

@Entity("tcg_user_boosters")
export class UserBoosterEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "booster_pack_id", type: "uuid" })
    boosterPackId!: string;

    @Column({ name: "is_opened", type: "boolean", default: false })
    isOpened!: boolean;

    @CreateDateColumn({ name: "purchased_at", type: "timestamptz" })
    purchasedAt!: Date;

    @Column({ name: "opened_at", type: "timestamptz", nullable: true })
    openedAt!: Date | null;

    @ManyToOne(() => BoosterPackEntity, { eager: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "booster_pack_id" })
    boosterPack!: BoosterPackEntity;
}
