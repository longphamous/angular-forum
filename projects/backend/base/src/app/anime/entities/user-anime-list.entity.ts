import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export type AnimeListStatus = "watching" | "completed" | "plan_to_watch" | "on_hold" | "dropped";

@Entity("user_anime_list")
export class UserAnimeListEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "anime_id", type: "integer" })
    animeId!: number;

    @Column({ length: 20 })
    status!: AnimeListStatus;

    @Column({ type: "smallint", nullable: true })
    score?: number;

    @Column({ name: "episodes_watched", type: "integer", default: 0 })
    episodesWatched!: number;

    @Column({ type: "text", nullable: true })
    review?: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
