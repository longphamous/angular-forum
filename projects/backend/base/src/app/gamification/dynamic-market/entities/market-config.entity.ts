import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export type ScheduleType = "disabled" | "minutely" | "hourly" | "daily" | "weekly";

export interface MarketSchedule {
    type: ScheduleType;
    minutelyInterval: number; // every N minutes (1,2,5,10,15,30,60,120,240)
    hourlyAtMinute: number; // at HH:xx of every hour (0-59)
    dailyTimes: string[]; // e.g. ["08:00", "20:00"]
    weeklyDays: number[]; // 0=Sun,1=Mon,...,6=Sat
    weeklyTime: string; // "HH:MM"
}

export const DEFAULT_SCHEDULE: MarketSchedule = {
    type: "minutely",
    minutelyInterval: 60,
    hourlyAtMinute: 0,
    dailyTimes: ["08:00"],
    weeklyDays: [1],
    weeklyTime: "08:00"
};

@Entity("market_config")
export class MarketConfigEntity {
    @PrimaryColumn({ type: "int" })
    id!: number;

    @Column({ name: "event_chance_percent", type: "int", default: 20 })
    eventChancePercent!: number;

    @Column({ name: "demand_decay_factor", type: "real", default: 0.8 })
    demandDecayFactor!: number;

    @Column({ name: "max_trade_quantity", type: "int", default: 100 })
    maxTradeQuantity!: number;

    @Column({ name: "schedule_config", type: "jsonb", nullable: true })
    schedule!: MarketSchedule | null;

    @Column({ name: "next_update_at", type: "timestamptz", nullable: true })
    nextUpdateAt!: Date | null;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
