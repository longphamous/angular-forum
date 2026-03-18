import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("market_events")
export class MarketEventEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 150 })
    title!: string;

    @Column({ type: "varchar", length: 500 })
    description!: string;

    /**
     * JSON array of affected resource slugs.
     * Example: ["sakura_petals", "matcha_powder"]
     */
    @Column({ name: "affected_slugs", type: "jsonb" })
    affectedSlugs!: string[];

    /**
     * Price modifier type:
     *  "set_max"  → sets price to max
     *  "set_min"  → sets price to min
     *  "multiply" → multiplies current price by `modifierValue`
     *  "add"      → adds `modifierValue` to current price
     *  "set"      → sets price to exact `modifierValue`
     */
    @Column({ name: "modifier_type", type: "varchar", length: 20 })
    modifierType!: string;

    /** Numeric value used by the modifier (ignored for set_max/set_min) */
    @Column({ name: "modifier_value", type: "real", default: 0 })
    modifierValue!: number;

    /** Probability weight (higher = more likely to be picked). Default 10 */
    @Column({ type: "int", default: 10 })
    weight!: number;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
