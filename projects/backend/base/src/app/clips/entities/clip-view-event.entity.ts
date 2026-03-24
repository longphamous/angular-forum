import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("clip_view_events")
@Index("idx_clip_view_events_clip", ["clipId"])
@Index("idx_clip_view_events_user", ["userId"])
@Index("idx_clip_view_events_created", ["createdAt"])
export class ClipViewEventEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "clip_id", type: "uuid" })
    clipId!: string;

    @Column({ name: "user_id", type: "uuid", nullable: true })
    userId?: string;

    @Column({ name: "watch_duration_ms", type: "int", default: 0 })
    watchDurationMs!: number;

    @Column({ name: "completion_percent", type: "smallint", default: 0 })
    completionPercent!: number;

    @Column({ type: "varchar", length: 32, default: "feed" })
    source!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
