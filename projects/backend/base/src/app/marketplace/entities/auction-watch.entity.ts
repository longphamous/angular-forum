import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("auction_watches")
export class AuctionWatchEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "auction_id", type: "uuid" })
    auctionId!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @CreateDateColumn({ name: "added_at", type: "timestamptz" })
    addedAt!: Date;
}
