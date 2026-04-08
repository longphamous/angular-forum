import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("module_config")
export class ModuleConfigEntity {
    @PrimaryColumn({ type: "varchar", length: 100 })
    key!: string;

    @Column({ type: "varchar", length: 255 })
    label!: string;

    @Column({ name: "parent_key", type: "varchar", length: 100, nullable: true })
    parentKey!: string | null;

    @Column({ type: "boolean", default: true })
    enabled!: boolean;

    @Column({ type: "varchar", length: 100, nullable: true })
    icon!: string | null;

    @Column({ name: "sort_order", type: "integer", default: 0 })
    sortOrder!: number;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
