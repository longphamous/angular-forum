import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("xp_config")
export class XpConfigEntity {
    @PrimaryColumn({ name: "event_type", length: 50 })
    eventType!: string;

    @Column({ name: "xp_amount", type: "int" })
    xpAmount!: number;

    @Column({ length: 100 })
    label!: string;

    @Column({ nullable: true, length: 255 })
    description?: string;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
