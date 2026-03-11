import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "anime", schema: "public", synchronize: false })
export class AnimeEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: number;

    @Column({ type: "text", nullable: true })
    title?: string;

    @Column({ name: "title_synonym", type: "text", nullable: true })
    titleSynonym?: string;

    @Column({ name: "title_english", type: "text", nullable: true })
    titleEnglish?: string;

    @Column({ name: "title_japanese", type: "text", nullable: true })
    titleJapanese?: string;

    @Column({ type: "text", nullable: true })
    picture?: string;

    @Column({ name: "start_day", type: "bigint", nullable: true })
    startDay?: number;

    @Column({ name: "start_month", type: "bigint", nullable: true })
    startMonth?: number;

    @Column({ name: "start_year", type: "bigint", nullable: true })
    startYear?: number;

    @Column({ name: "end_day", type: "bigint", nullable: true })
    endDay?: number;

    @Column({ name: "end_month", type: "bigint", nullable: true })
    endMonth?: number;

    @Column({ name: "end_year", type: "bigint", nullable: true })
    endYear?: number;

    @Column({ type: "text", nullable: true })
    synopsis?: string;

    @Column({ type: "boolean", nullable: true })
    nsfw?: boolean;

    @Column({ type: "text", nullable: true })
    type?: string;

    @Column({ type: "text", nullable: true })
    status?: string;

    @Column({ type: "bigint", nullable: true })
    episode?: number;

    @Column({ name: "episode_duration", type: "bigint", nullable: true })
    episodeDuration?: number;

    @Column({ type: "text", nullable: true })
    season?: string;

    @Column({ name: "season_year", type: "bigint", nullable: true })
    seasonYear?: number;

    @Column({ name: "broadcast_day", type: "text", nullable: true })
    broadcastDay?: string;

    @Column({ name: "broadcast_time", type: "text", nullable: true })
    broadcastTime?: string;

    @Column({ type: "text", nullable: true })
    source?: string;

    @Column({ type: "text", nullable: true })
    rating?: string;

    @Column({ type: "text", nullable: true })
    background?: string;

    @Column({ type: "numeric", nullable: true })
    mean?: number;

    @Column({ type: "bigint", nullable: true })
    rank?: number;

    @Column({ type: "bigint", nullable: true })
    popularity?: number;

    @Column({ type: "bigint", nullable: true })
    member?: number;

    @Column({ type: "bigint", nullable: true })
    voter?: number;

    @Column({ name: "user_watching", type: "bigint", nullable: true })
    userWatching?: number;

    @Column({ name: "user_completed", type: "bigint", nullable: true })
    userCompleted?: number;

    @Column({ name: "user_on_hold", type: "bigint", nullable: true })
    userOnHold?: number;

    @Column({ name: "user_dropped", type: "bigint", nullable: true })
    userDropped?: number;

    @Column({ name: "user_planned", type: "bigint", nullable: true })
    userPlanned?: number;

    @Column({ name: "created_at", type: "timestamptz", nullable: true })
    createdAt?: Date;

    @Column({ name: "updated_at", type: "timestamptz", nullable: true })
    updatedAt?: Date;

    @Column({ name: "deleted_at", type: "timestamptz", nullable: true })
    deletedAt?: Date;
}
