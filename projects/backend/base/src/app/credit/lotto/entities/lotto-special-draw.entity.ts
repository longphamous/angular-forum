import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity("lotto_special_draws")
export class LottoSpecialDrawEntity {
    @PrimaryColumn({ type: "varchar", length: 100 })
    id!: string;

    @Column({ type: "varchar", length: 200 })
    name!: string;

    @Column({ name: "draw_date", type: "timestamptz" })
    drawDate!: Date;

    @Column({ name: "ticket_mode", type: "varchar", length: 20, default: "separate" })
    ticketMode!: "all_current" | "separate";

    @Column({ name: "prize_mode", type: "varchar", length: 20, default: "standard" })
    prizeMode!: "standard" | "custom_jackpot" | "single_class";

    @Column({ name: "custom_jackpot", type: "int", nullable: true })
    customJackpot?: number;

    @Column({ name: "single_prize_class", type: "varchar", length: 20, nullable: true })
    singlePrizeClass?: string;

    @Column({ name: "single_prize_amount", type: "int", nullable: true })
    singlePrizeAmount?: number;

    @Column({ name: "ticket_cost", type: "int", nullable: true })
    ticketCost?: number;

    @Column({ type: "varchar", length: 20, default: "pending" })
    status!: "pending" | "drawn";

    @Column({ name: "winning_numbers", type: "jsonb", nullable: true })
    winningNumbers?: number[];

    @Column({ name: "super_number", type: "int", nullable: true })
    superNumber?: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
