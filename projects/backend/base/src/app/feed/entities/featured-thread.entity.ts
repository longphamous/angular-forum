import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("featured_threads")
export class FeaturedThreadEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "thread_id", type: "uuid" })
    threadId!: string;

    @Column({ default: 0 })
    position!: number;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
