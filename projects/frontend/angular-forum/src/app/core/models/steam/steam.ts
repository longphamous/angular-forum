export interface SteamProfile {
    id: string;
    userId: string;
    steamId: string;
    personaName: string;
    avatarUrl: string | null;
    profileUrl: string | null;
    onlineStatus: number;
    currentGame: string | null;
    gameCount: number;
    isPublic: boolean;
    syncFriends: boolean;
    lastSynced: string | null;
}

export interface SteamGame {
    appId: number;
    name: string;
    playtimeForever: number;
    playtimeRecent?: number;
    imgIconUrl: string;
    imgLogoUrl?: string;
}

export interface SteamAchievement {
    apiName: string;
    name: string;
    description: string;
    achieved: boolean;
    unlockTime?: number;
    icon?: string;
}

export interface SteamGameAchievements {
    gameName: string;
    achievements: SteamAchievement[];
    totalAchievements: number;
    unlockedCount: number;
}

export const STEAM_STATUS_LABELS: Record<number, string> = {
    0: "steam.status.offline",
    1: "steam.status.online",
    2: "steam.status.busy",
    3: "steam.status.away",
    4: "steam.status.snooze",
    5: "steam.status.lookingToTrade",
    6: "steam.status.lookingToPlay"
};

export const STEAM_STATUS_COLORS: Record<number, string> = {
    0: "text-color-secondary",
    1: "text-green-500",
    2: "text-red-500",
    3: "text-yellow-500"
};
