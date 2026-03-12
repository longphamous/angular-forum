export interface Thread {
    id: string;
    forumId: string;
    authorId: string;
    title: string;
    slug: string;
    isPinned: boolean;
    isLocked: boolean;
    isSticky: boolean;
    viewCount: number;
    replyCount: number;
    lastPostAt?: string;
    lastPostByUserId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedThreads {
    data: Thread[];
    total: number;
    page: number;
    limit: number;
}
