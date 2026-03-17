import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("market_resources")
export class MarketResourceEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    /** Unique slug used in code, e.g. "sakura_petals" */
    @Column({ type: "varchar", length: 80, unique: true })
    slug!: string;

    @Column({ type: "varchar", length: 100 })
    name!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    description!: string | null;

    /** Icon identifier (PrimeIcons class or emoji) */
    @Column({ type: "varchar", length: 60, default: "pi pi-box" })
    icon!: string;

    /** Optional image URL shown in the market table */
    @Column({ name: "image_url", type: "varchar", length: 500, nullable: true })
    imageUrl!: string | null;

    /** Category / group key – resources in the same group influence each other */
    @Column({ name: "group_key", type: "varchar", length: 60 })
    groupKey!: string;

    @Column({ name: "base_price", type: "int" })
    basePrice!: number;

    @Column({ name: "min_price", type: "int" })
    minPrice!: number;

    @Column({ name: "max_price", type: "int" })
    maxPrice!: number;

    @Column({ name: "current_price", type: "int" })
    currentPrice!: number;

    /**
     * How strongly selling this item influences the group.
     * Higher = more volatile. Default 1.0
     */
    @Column({ name: "volatility", type: "real", default: 1.0 })
    volatility!: number;

    /** Total units sold since last price recalculation */
    @Column({ name: "units_sold", type: "int", default: 0 })
    unitsSold!: number;

    /** Total units bought since last price recalculation */
    @Column({ name: "units_bought", type: "int", default: 0 })
    unitsBought!: number;

    /** Whether this resource can be purchased by users */
    @Column({ name: "can_buy", type: "boolean", default: true })
    canBuy!: boolean;

    /** Whether this resource can be sold by users */
    @Column({ name: "can_sell", type: "boolean", default: true })
    canSell!: boolean;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive!: boolean;

    /** Recent price snapshots for sparkline display (max 20 entries) */
    @Column({ name: "price_history", type: "jsonb", default: [] })
    priceHistory!: number[];

    /** Display order within the group */
    @Column({ name: "sort_order", type: "int", default: 0 })
    sortOrder!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
