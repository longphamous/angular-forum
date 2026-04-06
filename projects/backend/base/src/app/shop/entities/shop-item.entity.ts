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

    @Column({ name: "image_media_id", type: "uuid", nullable: true })
    imageMediaId?: string;

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

    // ── RPG Equipment fields ──────────────────────────────────────────────────

    @Column({ name: "is_equipment", type: "boolean", default: false })
    isEquipment!: boolean;

    @Column({ name: "equipment_slot", type: "varchar", length: 30, nullable: true })
    equipmentSlot!: string | null;

    @Column({ name: "stat_bonuses", type: "jsonb", nullable: true })
    statBonuses!: Record<string, number> | null;

    @Column({ name: "required_level", type: "int", nullable: true })
    requiredLevel!: number | null;

    @Column({ name: "rarity", type: "varchar", length: 20, nullable: true })
    rarity!: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
