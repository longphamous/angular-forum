import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("chronik_following")
@Unique(["followerId", "followingId"])
export class ChronikFollowingEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "follower_id", type: "varchar" })
    followerId!: string;

    @Column({ name: "following_id", type: "varchar" })
    followingId!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
