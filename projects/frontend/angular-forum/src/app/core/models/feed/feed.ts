export type FeedSort = "hot" | "new" | "top";

export interface FeaturedThread {
    id: string;
    threadId: string;
    position: number;
    isActive: boolean;
    title: string;
    slug: string;
    tags: string[];
    viewCount: number;
    replyCount: number;
    authorId: string;
    authorName: string;
    authorAvatarUrl?: string;
    authorLevel: number;
    authorLevelName: string;
    forumId: string;
    forumName: string;
    createdAt: string;
    lastPostAt?: string;
}

export interface HotThread {
    id: string;
    forumId: string;
    forumName: string;
    title: string;
    slug: string;
    tags: string[];
    isPinned: boolean;
    isLocked: boolean;
    authorId: string;
    authorName: string;
    authorAvatarUrl?: string;
    authorLevel: number;
    authorLevelName: string;
    viewCount: number;
    replyCount: number;
    hotScore: number;
    excerpt?: string;
    previewImageUrl?: string;
    createdAt: string;
    lastPostAt?: string;
}

export interface PaginatedFeed {
    data: HotThread[];
    total: number;
    page: number;
    limit: number;
}

export interface ThreadSearchResult {
    id: string;
    title: string;
    forumName: string;
    viewCount: number;
    replyCount: number;
}
