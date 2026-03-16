import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("market_event_log")
export class MarketEventLogEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "event_id", type: "uuid", nullable: true })
    eventId!: string | null;

    @Column({ type: "varchar", length: 150 })
    title!: string;

    @Column({ type: "varchar", length: 500 })
    description!: string;

    /** JSON snapshot of price changes: { slug: { before, after } } */
    @Column({ name: "price_changes", type: "jsonb", default: {} })
    priceChanges!: Record<string, { before: number; after: number }>;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
