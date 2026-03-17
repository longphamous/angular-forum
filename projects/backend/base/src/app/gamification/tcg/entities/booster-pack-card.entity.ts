import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { BoosterPackEntity } from "./booster-pack.entity";
import { CardEntity } from "./card.entity";

@Entity("tcg_booster_pack_cards")
export class BoosterPackCardEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "booster_pack_id", type: "uuid" })
    boosterPackId!: string;

    @Column({ name: "card_id", type: "uuid" })
    cardId!: string;

    @Column({ name: "drop_weight", type: "int", default: 100 })
    dropWeight!: number;

    @ManyToOne(() => BoosterPackEntity, (bp) => bp.packCards, { onDelete: "CASCADE" })
    @JoinColumn({ name: "booster_pack_id" })
    boosterPack!: BoosterPackEntity;

    @ManyToOne(() => CardEntity, { eager: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "card_id" })
    card!: CardEntity;
}
