import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { LinkSortBy } from "../models/link-database.model";

@Entity("link_categories")
export class LinkCategoryEntity {
    @PrimaryGeneratedColumn("uuid") id!: string;
    @Column({ length: 100 }) name!: string;
    @Column({ unique: true, length: 120 }) slug!: string;
    @Column({ type: "text", nullable: true }) description!: string | null;
    @Column({ name: "icon_class", type: "varchar", length: 50, nullable: true }) iconClass!: string | null;
    @Column({ type: "varchar", length: 20, nullable: true }) color!: string | null;
    @Column({ name: "sort_order", default: 0 }) sortOrder!: number;
    @Column({ name: "requires_approval", default: false }) requiresApproval!: boolean;
    @Column({ name: "default_sort_by", length: 20, default: "createdAt" }) defaultSortBy!: LinkSortBy;
    @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt!: Date;
}
