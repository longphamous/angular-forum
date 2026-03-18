export interface Thread {
    id: string;
    forumId: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl?: string;
    authorLevel: number;
    authorLevelName: string;
    title: string;
    slug: string;
    tags: string[];
    isPinned: boolean;
    isLocked: boolean;
    isSticky: boolean;
    viewCount: number;
    replyCount: number;
    lastPostAt?: string;
    lastPostByUserId?: string;
    bestAnswerPostId?: string;
    hasPoll?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedThreads {
    data: Thread[];
    total: number;
    page: number;
    limit: number;
}
