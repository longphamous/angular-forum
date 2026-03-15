export type BlogType = "personal" | "editorial" | "news" | "diary";
export type BlogStatus = "draft" | "published" | "archived";

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    type: BlogType;
    status: BlogStatus;
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    categoryId: string | null;
    categoryName: string | null;
    categoryColor: string | null;
    coverImageUrl: string | null;
    tags: string[];
    viewCount: number;
    commentCount: number;
    allowComments: boolean;
    isOwner: boolean;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    postCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface BlogComment {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    content: string;
    parentId: string | null;
    replies: BlogComment[];
    createdAt: string;
    updatedAt: string;
}

export interface BlogPostDetail extends BlogPost {
    comments: BlogComment[];
}

export interface CreateBlogPostPayload {
    title: string;
    content: string;
    excerpt?: string;
    type: BlogType;
    status: BlogStatus;
    categoryId?: string;
    coverImageUrl?: string;
    tags?: string[];
    allowComments?: boolean;
}
