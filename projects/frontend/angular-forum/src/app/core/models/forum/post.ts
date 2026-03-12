export interface Post {
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

export interface PaginatedPosts {
    data: Post[];
    total: number;
    page: number;
    limit: number;
}
