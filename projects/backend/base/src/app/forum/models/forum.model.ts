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

export interface ThreadDetailDto extends ThreadDto {
    forumName: string;
    forumSlug: string;
}

// ─── Post ─────────────────────────────────────────────────────────────────────

export interface PostDto {
    id: string;
    threadId: string;
    authorId: string;
    content: string;
    isFirstPost: boolean;
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
