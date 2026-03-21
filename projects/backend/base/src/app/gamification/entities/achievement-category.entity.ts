import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("achievement_categories")
export class AchievementCategoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 50, unique: true })
    key!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ type: "varchar", nullable: true, length: 255 })
    description?: string;

    @Column({ length: 50, default: "pi pi-folder" })
    icon!: string;

    @Column({ type: "int", default: 0 })
    position!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
