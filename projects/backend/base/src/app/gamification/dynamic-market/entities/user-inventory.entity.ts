import { Column, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity("market_user_inventory")
@Unique(["userId", "resourceId"])
export class UserInventoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "resource_id", type: "uuid" })
    resourceId!: string;

    @Column({ type: "int", default: 0 })
    quantity!: number;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
