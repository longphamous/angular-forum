import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { HashtagUsageEntity } from "./hashtag-usage.entity";

@Entity("hashtags")
export class HashtagEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 100, unique: true })
    name!: string;

    @Column({ name: "usage_count", type: "int", default: 0 })
    usageCount!: number;

    @OneToMany(() => HashtagUsageEntity, (usage) => usage.hashtag)
    usages!: HashtagUsageEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
