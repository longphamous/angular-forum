import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("clip_follows")
@Unique(["followerId", "followingId"])
export class ClipFollowEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "follower_id", type: "uuid" })
    followerId!: string;

    @Column({ name: "following_id", type: "uuid" })
    followingId!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
