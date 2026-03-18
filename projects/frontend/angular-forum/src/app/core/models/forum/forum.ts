export interface Forum {
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
