import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export type MangaListStatus = "reading" | "completed" | "plan_to_read" | "on_hold" | "dropped";

@Entity("user_manga_list")
export class UserMangaListEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "manga_id", type: "integer" })
    mangaId!: number;

    @Column({ length: 20 })
    status!: MangaListStatus;

    @Column({ type: "smallint", nullable: true })
    score?: number;

    @Column({ name: "chapters_read", type: "integer", default: 0 })
    chaptersRead!: number;

    @Column({ name: "volumes_read", type: "integer", default: 0 })
    volumesRead!: number;

    @Column({ type: "text", nullable: true })
    review?: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
