import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export type ActivityType =
    | "thread_created"
    | "post_created"
    | "blog_published"
    | "achievement_unlocked"
    | "level_up"
    | "friend_added"
    | "profile_updated"
    | "lexicon_published";

@Entity("activities")
export class ActivityEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ type: "varchar", length: 50 })
    type!: ActivityType;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "varchar", length: 500, nullable: true })
    description!: string | null;

    @Column({ type: "varchar", length: 500, nullable: true })
    link!: string | null;

    @Column({ type: "jsonb", nullable: true })
    metadata!: Record<string, unknown> | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
