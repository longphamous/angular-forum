import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

/**
 * Singleton row storing the lotto schedule configuration.
 * Always uses id = 'default'.
 */
@Entity("lotto_config")
export class LottoConfigEntity {
    @PrimaryColumn({ type: "varchar", length: 20, default: "default" })
    id!: string;

    @Column({ name: "draw_days", type: "jsonb", default: [6] })
    drawDays!: number[];

    @Column({ name: "draw_hour_utc", type: "int", default: 19 })
    drawHourUtc!: number;

    @Column({ name: "draw_minute_utc", type: "int", default: 0 })
    drawMinuteUtc!: number;

    @Column({ name: "base_jackpot", type: "int", default: 1000000 })
    baseJackpot!: number;

    @Column({ name: "rollover_percentage", type: "int", default: 50 })
    rolloverPercentage!: number;

    @Column({ name: "ticket_cost", type: "int", default: 2 })
    ticketCost!: number;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
