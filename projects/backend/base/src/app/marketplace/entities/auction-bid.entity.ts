import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("auction_bids")
export class AuctionBidEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "auction_id", type: "uuid" })
    auctionId!: string;

    @Column({ name: "bidder_id", type: "uuid" })
    bidderId!: string;

    @Column({ type: "decimal", precision: 12, scale: 2 })
    amount!: number;

    @Column({ name: "max_auto_bid", type: "decimal", precision: 12, scale: 2, nullable: true })
    maxAutoBid!: number | null;

    @Column({ name: "is_auto_bid", type: "boolean", default: false })
    isAutoBid!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
