import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { ForumCategoryEntity } from "./category.entity";

@Entity("forums")
export class ForumEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "category_id" })
    categoryId!: string;

    @ManyToOne(() => ForumCategoryEntity, (category) => category.forums, { onDelete: "CASCADE" })
    @JoinColumn({ name: "category_id" })
    category!: ForumCategoryEntity;

    @Column({ length: 150 })
    name!: string;

    @Column({ unique: true, length: 200 })
    slug!: string;

    @Column({ nullable: true, type: "text" })
    description?: string;

    @Column({ default: 0 })
    position!: number;

    @Column({ name: "is_locked", default: false })
    isLocked!: boolean;

    @Column({ name: "is_private", default: false })
    isPrivate!: boolean;

    @Column({ name: "thread_count", default: 0 })
    threadCount!: number;

    @Column({ name: "post_count", default: 0 })
    postCount!: number;

    @Column({ name: "last_post_at", nullable: true, type: "timestamptz" })
    lastPostAt?: Date;

    @Column({ name: "last_post_by_user_id", nullable: true, type: "uuid" })
    lastPostByUserId?: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
