import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("market_ratings")
export class MarketRatingEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "listing_id", type: "uuid" })
    listingId!: string;

    @Column({ name: "offer_id", type: "uuid" })
    offerId!: string;

    @Column({ name: "rater_id", type: "uuid" })
    raterId!: string;

    @Column({ name: "rated_user_id", type: "uuid" })
    ratedUserId!: string;

    @Column({ type: "int" })
    score!: number;

    @Column({ type: "text", nullable: true })
    text!: string | null;

    @Column({ type: "text", nullable: true })
    reply!: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
