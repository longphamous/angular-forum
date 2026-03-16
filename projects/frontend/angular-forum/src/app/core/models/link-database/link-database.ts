export type LinkStatus = "pending" | "active" | "rejected";
export type LinkSortBy = "createdAt" | "viewCount" | "title" | "rating";

export interface LinkCategory {
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
    createdAt: string;
}

export interface LinkEntry {
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
    createdAt: string;
    updatedAt: string;
}

export interface LinkComment {
    id: string;
    linkId: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string | null;
    content: string;
    createdAt: string;
}

export interface LinkListResult {
    items: LinkEntry[];
    total: number;
}

export interface CreateLinkPayload {
    title: string;
    url: string;
    description?: string;
    excerpt?: string;
    previewImageUrl?: string;
    tags?: string[];
    categoryId: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    contactEmail?: string;
    contactPhone?: string;
    customFields?: Record<string, string>;
}

export interface CreateCategoryPayload {
    name: string;
    description?: string;
    iconClass?: string;
    color?: string;
    sortOrder?: number;
    requiresApproval?: boolean;
    defaultSortBy?: LinkSortBy;
}
