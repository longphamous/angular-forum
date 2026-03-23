export type LexiconArticleStatus = "draft" | "pending" | "published" | "rejected" | "archived";

export interface LexiconCustomField {
    key: string;
    label: string;
    type: "text" | "number" | "date" | "select" | "boolean" | "url";
    required: boolean;
    options?: string[];
    validationPattern?: string;
}

export interface LexiconCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    position: number;
    isActive: boolean;
    customFields: LexiconCustomField[];
    articleCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface LexiconContributor {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    versionCount: number;
}

export interface LexiconArticle {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    language: string;
    categoryId: string;
    categoryName: string | null;
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    status: LexiconArticleStatus;
    tags: string[];
    customFieldValues: Record<string, unknown>;
    coverImageUrl: string | null;
    viewCount: number;
    commentCount: number;
    versionCount: number;
    isLocked: boolean;
    allowComments: boolean;
    linkedArticleId: string | null;
    linkedArticleSlug?: string | null;
    isOwner: boolean;
    contributors?: LexiconContributor[];
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    comments?: LexiconComment[];
}

export interface LexiconArticleVersion {
    id: string;
    versionNumber: number;
    title: string;
    content?: string;
    customFieldValues?: Record<string, unknown>;
    authorId: string;
    authorName: string;
    changeSummary: string | null;
    isProtected: boolean;
    createdAt: string;
}

export interface LexiconComment {
    id: string;
    articleId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    content: string;
    parentId: string | null;
    replies: LexiconComment[];
    createdAt: string;
    updatedAt: string;
}

export interface LexiconTerms {
    id: string;
    language: string;
    content: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface LexiconReport {
    id: string;
    articleId: string;
    articleTitle: string;
    articleSlug: string | null;
    reporterId: string;
    reporterName: string;
    reason: string;
    status: "open" | "resolved" | "dismissed";
    createdAt: string;
}

export interface LexiconDetectedTerm {
    term: string;
    slug: string;
    articleId: string;
}

export interface PaginatedArticles {
    data: LexiconArticle[];
    total: number;
}

export interface CreateArticlePayload {
    title: string;
    content: string;
    categoryId: string;
    language?: string;
    excerpt?: string;
    tags?: string[];
    customFieldValues?: Record<string, unknown>;
    linkedArticleId?: string;
    coverImageUrl?: string;
    allowComments?: boolean;
    status?: LexiconArticleStatus;
    changeSummary?: string;
}

export interface CreateCategoryPayload {
    name: string;
    description?: string;
    parentId?: string;
    position?: number;
    customFields?: LexiconCustomField[];
}
