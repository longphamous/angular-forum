export type QuestType = "daily" | "weekly" | "monthly" | "story" | "event";
export type QuestRewardType = "xp" | "coins" | "item" | "glory";
export type UserQuestStatus = "active" | "completed" | "claimed";

export interface QuestReward {
    type: QuestRewardType;
    amount: number;
    itemId?: string;
}

export interface Quest {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    questType: QuestType;
    triggerType: string;
    requiredCount: number;
    rewards: QuestReward[];
    gloryReward: number;
    requiredLevel: number | null;
    eventStartsAt: string | null;
    eventEndsAt: string | null;
    eventBannerUrl: string | null;
}

export interface UserQuest {
    id: string;
    quest: Quest;
    progress: number;
    status: UserQuestStatus;
    periodKey: string;
    completedAt: string | null;
    claimedAt: string | null;
}

export interface QuestBoard {
    daily: UserQuest[];
    weekly: UserQuest[];
    monthly: UserQuest[];
    story: UserQuest[];
    events: UserQuest[];
    glory: number;
}

export const QUEST_TYPE_CONFIG: Record<QuestType, { icon: string; color: string; labelKey: string }> = {
    daily: { icon: "pi pi-sun", color: "text-amber-500", labelKey: "quest.types.daily" },
    weekly: { icon: "pi pi-calendar", color: "text-blue-500", labelKey: "quest.types.weekly" },
    monthly: { icon: "pi pi-calendar-plus", color: "text-purple-500", labelKey: "quest.types.monthly" },
    story: { icon: "pi pi-book", color: "text-green-500", labelKey: "quest.types.story" },
    event: { icon: "pi pi-bolt", color: "text-red-500", labelKey: "quest.types.event" }
};

export const REWARD_TYPE_CONFIG: Record<QuestRewardType, { icon: string; color: string }> = {
    xp: { icon: "pi pi-star-fill", color: "text-yellow-500" },
    coins: { icon: "pi pi-wallet", color: "text-amber-500" },
    item: { icon: "pi pi-box", color: "text-blue-500" },
    glory: { icon: "pi pi-crown", color: "text-purple-500" }
};
