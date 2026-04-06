export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    xp: number;
    level: number;
    levelName: string;
    xpProgressPercent: number;
}

export interface LeaderboardResponse {
    data: LeaderboardEntry[];
    total: number;
}
