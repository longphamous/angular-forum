import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

import { CardEntity } from "./card.entity";

@Entity("tcg_user_cards")
@Unique(["userId", "cardId"])
export class UserCardEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "card_id", type: "uuid" })
    cardId!: string;

    @Column({ type: "int", default: 1 })
    quantity!: number;

    @CreateDateColumn({ name: "first_obtained_at", type: "timestamptz" })
    firstObtainedAt!: Date;

    @Column({ name: "is_favorite", type: "boolean", default: false })
    isFavorite!: boolean;

    @ManyToOne(() => CardEntity, { eager: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "card_id" })
    card!: CardEntity;
}
