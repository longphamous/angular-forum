import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("market_categories")
export class MarketCategoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 100 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ name: "parent_id", type: "uuid", nullable: true })
    parentId!: string | null;

    @Column({ type: "varchar", length: 50, default: "pi pi-tag" })
    icon!: string;

    @Column({ name: "sort_order", type: "int", default: 0 })
    sortOrder!: number;

    @Column({ name: "requires_approval", type: "boolean", default: false })
    requiresApproval!: boolean;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
