export interface Post {
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

export interface PaginatedPosts {
    data: Post[];
    total: number;
    page: number;
    limit: number;
}
