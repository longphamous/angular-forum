import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { ForumEntity } from "./forum.entity";

@Entity("forum_categories")
export class ForumCategoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 100 })
    name!: string;

    @Column({ unique: true, length: 120 })
    slug!: string;

    @Column({ nullable: true, type: "text" })
    description?: string;

    @Column({ default: 0 })
    position!: number;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @OneToMany(() => ForumEntity, (forum) => forum.category)
    forums!: ForumEntity[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
