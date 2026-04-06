import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * Maps to the `manga` table in the animedb database.
 * Read-only entity — synchronize is disabled.
 */
@Entity({ name: "manga", schema: "public", synchronize: false })
export class MangaEntity {
    @PrimaryColumn({ name: "mal_id", type: "integer" })
    malId!: number;

    @Column({ type: "text", nullable: true })
    url?: string;

    @Column({ type: "text", nullable: true })
    title?: string;

    @Column({ name: "title_english", type: "text", nullable: true })
    titleEnglish?: string;

    @Column({ name: "title_japanese", type: "text", nullable: true })
    titleJapanese?: string;

    @Column({ type: "text", nullable: true })
    type?: string;

    @Column({ type: "integer", nullable: true })
    chapters?: number;

    @Column({ type: "integer", nullable: true })
    volumes?: number;

    @Column({ type: "text", nullable: true })
    status?: string;

    @Column({ type: "boolean", nullable: true })
    publishing?: boolean;

    @Column({ type: "numeric", precision: 4, scale: 2, nullable: true })
    score?: number;

    @Column({ name: "scored_by", type: "integer", nullable: true })
    scoredBy?: number;

    @Column({ type: "integer", nullable: true })
    rank?: number;

    @Column({ type: "integer", nullable: true })
    popularity?: number;

    @Column({ type: "integer", nullable: true })
    members?: number;

    @Column({ type: "integer", nullable: true })
    favorites?: number;

    @Column({ type: "text", nullable: true })
    synopsis?: string;

    @Column({ name: "raw_json", type: "jsonb" })
    rawJson!: Record<string, unknown>;

    @Column({ name: "created_at", type: "timestamptz", nullable: true })
    createdAt?: Date;

    @Column({ name: "updated_at", type: "timestamptz", nullable: true })
    updatedAt?: Date;
}
