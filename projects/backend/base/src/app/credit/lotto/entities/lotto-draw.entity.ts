import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity("lotto_draws")
export class LottoDrawEntity {
    @PrimaryColumn({ type: "varchar", length: 100 })
    id!: string;

    @Column({ name: "draw_date", type: "timestamptz" })
    drawDate!: Date;

    @Column({ name: "winning_numbers", type: "jsonb", default: [] })
    winningNumbers!: number[];

    @Column({ name: "super_number", type: "int", default: -1 })
    superNumber!: number;

    @Column({ type: "int", default: 0 })
    jackpot!: number;

    @Column({ type: "varchar", length: 20, default: "pending" })
    status!: "pending" | "drawn";

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
