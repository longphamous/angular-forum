export interface Clip {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    title: string;
    description: string | null;
    videoUrl: string;
    thumbnailUrl: string | null;
    tags: string[];
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    duration: number;
    isPublished: boolean;
    isLiked: boolean;
    isFollowing: boolean;
    isOwner: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ClipComment {
    id: string;
    clipId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    content: string;
    parentId: string | null;
    replies: ClipComment[];
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedClips {
    data: Clip[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateClipPayload {
    title: string;
    description?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    tags?: string[];
    duration: number;
    isPublished?: boolean;
}

// ── Stats ────────────────────────────────────────────────────

export interface TrackViewPayload {
    watchDurationMs: number;
    completionPercent: number;
    source: string;
}

export interface ClipStats {
    clipId: string;
    title: string;
    totalViews: number;
    uniqueViewers: number;
    avgWatchDurationMs: number;
    avgCompletionPercent: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    likeRate: number;
    commentRate: number;
    shareRate: number;
    engagementScore: number;
    viewsBySource: Record<string, number>;
    viewsOverTime: { date: string; views: number }[];
    createdAt: string;
}

export interface AuthorStats {
    authorId: string;
    authorName: string;
    totalClips: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgCompletionPercent: number;
    avgEngagementScore: number;
    topClips: { clipId: string; title: string; viewCount: number; engagementScore: number }[];
}

export interface TrendingClip {
    clipId: string;
    title: string;
    authorName: string;
    thumbnailUrl: string | null;
    trendingScore: number;
    recentViews: number;
    recentLikes: number;
    viewCount: number;
    likeCount: number;
}

export interface RecommendationSignals {
    clipId: string;
    engagementScore: number;
    avgCompletionPercent: number;
    likeRate: number;
    commentRate: number;
    shareRate: number;
    trendingScore: number;
    tags: string[];
    duration: number;
    ageHours: number;
}
