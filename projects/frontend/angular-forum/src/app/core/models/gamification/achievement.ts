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
    xpReward?: number;
    category?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserAchievement extends Achievement {
    earnedAt: string;
}

export interface AchievementProgress extends Achievement {
    earned: boolean;
    earnedAt: string | null;
    currentValue: number;
    progressPercent: number;
}

export const RARITY_STYLES: Record<AchievementRarity, { bg: string; text: string; border: string }> = {
    bronze: { bg: "bg-orange-50 dark:bg-orange-950", text: "text-orange-600", border: "border-orange-300" },
    silver: { bg: "bg-gray-50 dark:bg-gray-900", text: "text-gray-500", border: "border-gray-300" },
    gold: { bg: "bg-yellow-50 dark:bg-yellow-950", text: "text-yellow-600", border: "border-yellow-400" },
    platinum: { bg: "bg-cyan-50 dark:bg-cyan-950", text: "text-cyan-600", border: "border-cyan-400" }
};
