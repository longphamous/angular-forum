import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity("lotto_tickets")
export class LottoTicketEntity {
    @PrimaryColumn({ type: "varchar", length: 100 })
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    /** Array of fields, each field is an array of 6 numbers. Max 12 fields per ticket. */
    @Column({ type: "jsonb" })
    fields!: number[][];

    @Column({ name: "super_number", type: "int" })
    superNumber!: number;

    @Column({ name: "draw_id", type: "varchar", length: 100 })
    drawId!: string;

    @Column({ type: "int" })
    cost!: number;

    @Column({ name: "repeat_weeks", type: "int", nullable: true })
    repeatWeeks?: number;

    @CreateDateColumn({ name: "purchased_at", type: "timestamptz" })
    purchasedAt!: Date;
}
