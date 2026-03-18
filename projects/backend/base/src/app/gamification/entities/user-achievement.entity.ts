import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("user_achievements")
@Unique(["userId", "achievementId"])
export class UserAchievementEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "achievement_id", type: "uuid" })
    achievementId!: string;

    @CreateDateColumn({ name: "earned_at", type: "timestamptz" })
    earnedAt!: Date;
}
