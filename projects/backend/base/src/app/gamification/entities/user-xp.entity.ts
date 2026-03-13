import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("user_xp")
export class UserXpEntity {
    @PrimaryColumn({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ type: "int", default: 0 })
    xp!: number;

    @Column({ type: "int", default: 1 })
    level!: number;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
