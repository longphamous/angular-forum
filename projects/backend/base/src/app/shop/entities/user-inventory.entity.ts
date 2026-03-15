import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("user_inventory")
export class UserInventoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "item_id", type: "uuid" })
    itemId!: string;

    @Column({ type: "int", default: 1 })
    quantity!: number;

    @CreateDateColumn({ name: "purchased_at", type: "timestamptz" })
    purchasedAt!: Date;
}
