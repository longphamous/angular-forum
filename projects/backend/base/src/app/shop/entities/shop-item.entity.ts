import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("shop_items")
export class ShopItemEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ type: "int" })
    price!: number;

    @Column({ name: "image_url", type: "varchar", length: 500, nullable: true })
    imageUrl!: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    icon!: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    category!: string | null;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive!: boolean;

    @Column({ type: "int", nullable: true })
    stock!: number | null;

    @Column({ name: "max_per_user", type: "int", nullable: true })
    maxPerUser!: number | null;

    @Column({ name: "sort_order", type: "int", default: 0 })
    sortOrder!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
