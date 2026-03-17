import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { CardEntity } from "./card.entity";

@Entity("tcg_card_listings")
export class CardListingEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "card_id", type: "uuid" })
    cardId!: string;

    @Column({ type: "int" })
    price!: number;

    @Column({ type: "int", default: 1 })
    quantity!: number;

    @Column({ length: 20, default: "active" })
    status!: "active" | "sold" | "cancelled";

    @Column({ name: "buyer_id", type: "uuid", nullable: true })
    buyerId!: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    @ManyToOne(() => CardEntity, { eager: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "card_id" })
    card!: CardEntity;
}
