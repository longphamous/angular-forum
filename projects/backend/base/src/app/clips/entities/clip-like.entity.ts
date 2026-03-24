import { CreateDateColumn, Entity, PrimaryGeneratedColumn, Column, Unique } from "typeorm";

@Entity("clip_likes")
@Unique(["clipId", "userId"])
export class ClipLikeEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "clip_id", type: "uuid" })
    clipId!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
