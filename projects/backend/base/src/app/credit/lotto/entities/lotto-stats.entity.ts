import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

/**
 * Singleton row storing aggregated lotto statistics.
 * Updated after each draw (regular or special) — never recomputed from scratch.
 */
@Entity("lotto_stats")
export class LottoStatsEntity {
    @PrimaryColumn({ type: "varchar", length: 20, default: "default" })
    id!: string;

    @Column({ name: "total_draws", type: "int", default: 0 })
    totalDraws!: number;

    @Column({ name: "total_tickets_sold", type: "int", default: 0 })
    totalTicketsSold!: number;

    @Column({ name: "total_prize_paid", type: "bigint", default: 0 })
    totalPrizePaid!: number;

    @Column({ name: "biggest_jackpot", type: "int", default: 0 })
    biggestJackpot!: number;

    /** JSON map of number (1–49) → frequency count across all draws. */
    @Column({ name: "number_frequency", type: "jsonb", default: {} })
    numberFrequency!: Record<string, number>;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
