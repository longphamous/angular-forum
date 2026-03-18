export type { ReactionType } from "../entities/post-reaction.entity";

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface CategoryDto {
    id: string;
    name: string;
    slug: string;
    description?: string;
    position: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryDetailDto extends CategoryDto {
    forums: ForumDto[];
}

// ─── Forum ────────────────────────────────────────────────────────────────────

export interface ForumDto {
    id: string;
    categoryId: string;
    name: string;
    slug: string;
    description?: string;
    position: number;
    isLocked: boolean;
    isPrivate: boolean;
    threadCount: number;
    postCount: number;
    lastPostAt?: string;
    lastPostByUserId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ForumDetailDto extends ForumDto {
    categoryName: string;
    categorySlug: string;
}

// ─── Thread ───────────────────────────────────────────────────────────────────

export interface ThreadDto {
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

export interface ThreadDetailDto extends ThreadDto {
    forumName: string;
    forumSlug: string;
}

// ─── Post ─────────────────────────────────────────────────────────────────────

export interface PostDto {
    id: string;
    threadId: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    authorPostCount: number;
    authorAvatarUrl?: string;
    authorSignature?: string;
    authorLevel: number;
    authorLevelName: string;
    authorBalance?: number;
    content: string;
    isFirstPost: boolean;
    isBestAnswer: boolean;
    isEdited: boolean;
    editedAt?: string;
    editCount: number;
    reactionCount: number;
    createdAt: string;
    updatedAt: string;
}

// ─── Reaction ─────────────────────────────────────────────────────────────────

export interface ReactionDto {
    id: string;
    postId: string;
    userId: string;
    reactionType: string;
    createdAt: string;
}

// ─── Poll ────────────────────────────────────────────────────────────────────

export interface PollDto {
    id: string;
    threadId: string;
    question: string;
    options: PollOptionDto[];
    totalVotes: number;
    isMultipleChoice: boolean;
    isClosed: boolean;
    closesAt: string | null;
    myVote: number | null;
    createdAt: string;
}

export interface PollOptionDto {
    index: number;
    text: string;
    votes: number;
    percentage: number;
}
