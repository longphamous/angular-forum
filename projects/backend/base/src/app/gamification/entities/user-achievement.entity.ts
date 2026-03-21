import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

export type AchievementSource = "auto" | "manual";

@Entity("user_achievements")
@Unique(["userId", "achievementId"])
export class UserAchievementEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "achievement_id", type: "uuid" })
    achievementId!: string;

    @Column({ type: "varchar", length: 10, default: "auto" })
    source!: AchievementSource;

    @Column({ name: "granted_by", type: "uuid", nullable: true })
    grantedBy!: string | null;

    @CreateDateColumn({ name: "earned_at", type: "timestamptz" })
    earnedAt!: Date;
}
