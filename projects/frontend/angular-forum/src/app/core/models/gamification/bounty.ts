export interface WantedPoster {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bounty: number;
    rank: number;
    epithet: string;
    breakdown: BountyBreakdown;
    calculatedAt: string;
}

export interface BountyBreakdown {
    coins: number;
    xp: number;
    posts: number;
    threads: number;
    reactions: number;
    achievements: number;
    lexicon: number;
    blog: number;
    gallery: number;
    clans: number;
    tickets: number;
}

export interface BountyLeaderboard {
    data: WantedPoster[];
    total: number;
}
