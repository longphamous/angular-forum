import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("market_transactions")
export class MarketTransactionEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "resource_id", type: "uuid" })
    resourceId!: string;

    @Column({ name: "resource_slug", type: "varchar", length: 80 })
    resourceSlug!: string;

    /** "buy" or "sell" */
    @Column({ type: "varchar", length: 10 })
    action!: string;

    @Column({ type: "int" })
    quantity!: number;

    /** Price per unit at time of transaction */
    @Column({ name: "price_per_unit", type: "int" })
    pricePerUnit!: number;

    /** Total coins spent or received */
    @Column({ name: "total_price", type: "int" })
    totalPrice!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
