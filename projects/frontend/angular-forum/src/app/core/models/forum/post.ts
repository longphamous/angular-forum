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
    authorGender?: string;
    content: string;
    isFirstPost: boolean;
    isBestAnswer: boolean;
    isHighlighted: boolean;
    highlightedBy?: string;
    isOfficial: boolean;
    knowledgeSource?: string;
    isEdited: boolean;
    editedAt?: string;
    editCount: number;
    editReason?: string;
    editHistory?: PostEditHistoryEntry[];
    reactionCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface PostEditHistoryEntry {
    content: string;
    editedBy: string;
    editedAt: string;
    reason: string | null;
}

export interface PaginatedPosts {
    data: Post[];
    total: number;
    page: number;
    limit: number;
}
