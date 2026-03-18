export type AchievementRarity = "bronze" | "silver" | "gold" | "platinum";

export interface Achievement {
    id: string;
    key: string;
    name: string;
    description?: string;
    icon: string;
    rarity: AchievementRarity;
    triggerType: string;
    triggerValue: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserAchievement extends Achievement {
    earnedAt: string;
}
