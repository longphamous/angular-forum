import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export type AuctionStatus = "scheduled" | "active" | "ended" | "cancelled";

@Entity("auctions")
export class AuctionEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "listing_id", type: "uuid" })
    listingId!: string;

    @Column({ name: "start_price", type: "decimal", precision: 12, scale: 2 })
    startPrice!: number;

    @Column({ name: "current_price", type: "decimal", precision: 12, scale: 2 })
    currentPrice!: number;

    @Column({ name: "buy_now_price", type: "decimal", precision: 12, scale: 2, nullable: true })
    buyNowPrice!: number | null;

    @Column({ type: "varchar", length: 10, default: "EUR" })
    currency!: string;

    @Column({ name: "bid_increment", type: "decimal", precision: 12, scale: 2, default: 1.0 })
    bidIncrement!: number;

    @Column({ name: "start_time", type: "timestamptz" })
    startTime!: Date;

    @Column({ name: "end_time", type: "timestamptz" })
    endTime!: Date;

    @Column({ name: "original_end_time", type: "timestamptz" })
    originalEndTime!: Date;

    @Column({ type: "varchar", length: 20, default: "scheduled" })
    status!: AuctionStatus;

    @Column({ name: "bid_count", type: "int", default: 0 })
    bidCount!: number;

    @Column({ name: "highest_bidder_id", type: "uuid", nullable: true })
    highestBidderId!: string | null;

    @Column({ name: "watcher_count", type: "int", default: 0 })
    watcherCount!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
