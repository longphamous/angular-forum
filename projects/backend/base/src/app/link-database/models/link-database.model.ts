export type LinkStatus = "pending" | "active" | "rejected";
export type LinkSortBy = "createdAt" | "viewCount" | "title" | "rating";
export type ScreenshotProvider = "none" | "thumbnail_ws" | "thum_io";

export interface LinkCategoryDto {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    iconClass: string | null;
    color: string | null;
    sortOrder: number;
    requiresApproval: boolean;
    defaultSortBy: LinkSortBy;
    linkCount: number;
    createdAt: Date;
}

export interface LinkEntryDto {
    id: string;
    title: string;
    url: string;
    description: string | null;
    excerpt: string | null;
    previewImageUrl: string | null;
    tags: string[];
    status: LinkStatus;
    viewCount: number;
    rating: number;
    ratingCount: number;
    userRating?: number;
    categoryId: string;
    categoryName: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string | null;
    assignedToId: string | null;
    assignedToName: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    contactEmail: string | null;
    contactPhone: string | null;
    customFields: Record<string, string> | null;
    commentCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface LinkCommentDto {
    id: string;
    linkId: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string | null;
    content: string;
    createdAt: Date;
}

export interface LinkListResult {
    items: LinkEntryDto[];
    total: number;
}

export interface LinkDatabaseSettings {
    screenshotProvider: ScreenshotProvider;
    screenshotApiKey: string;
    allowUserSubmissions: boolean;
    requireApprovalDefault: boolean;
    itemsPerPage: number;
}
