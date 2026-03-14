import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("achievements")
export class AchievementEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 50, unique: true })
    key!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ nullable: true, length: 255 })
    description?: string;

    @Column({ length: 50 })
    icon!: string;

    @Column({ length: 20, default: "bronze" })
    rarity!: string;

    @Column({ name: "trigger_type", length: 50 })
    triggerType!: string;

    @Column({ name: "trigger_value", type: "int" })
    triggerValue!: number;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
