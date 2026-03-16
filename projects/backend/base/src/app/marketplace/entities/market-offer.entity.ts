import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn" | "countered";

@Entity("market_offers")
export class MarketOfferEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "listing_id", type: "uuid" })
    listingId!: string;

    @Column({ name: "sender_id", type: "uuid" })
    senderId!: string;

    @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
    amount!: number | null;

    @Column({ type: "text" })
    message!: string;

    @Column({ type: "varchar", length: 20, default: "pending" })
    status!: OfferStatus;

    @Column({ name: "counter_amount", type: "decimal", precision: 12, scale: 2, nullable: true })
    counterAmount!: number | null;

    @Column({ name: "counter_message", type: "text", nullable: true })
    counterMessage!: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
