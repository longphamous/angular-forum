export type ListingType = "sell" | "buy" | "trade" | "gift" | "auction";
export type ListingStatus = "draft" | "pending" | "active" | "sold" | "closed" | "expired" | "archived";
export type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn" | "countered";
export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";

export interface MarketCategory {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    icon: string;
    sortOrder: number;
    requiresApproval: boolean;
    isActive: boolean;
    children?: MarketCategory[];
}

export interface MarketListing {
    id: string;
    title: string;
    description: string;
    price: number | null;
    currency: string;
    type: ListingType;
    status: ListingStatus;
    categoryId: string;
    categoryName: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string | null;
    images: string[];
    customFields: Record<string, unknown> | null;
    tags: string[];
    expiresAt: string | null;
    viewCount: number;
    offerCount: number;
    commentCount: number;
    bestOfferId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface MarketOffer {
    id: string;
    listingId: string;
    senderId: string;
    senderName: string;
    senderAvatarUrl: string | null;
    amount: number | null;
    message: string;
    status: OfferStatus;
    counterAmount: number | null;
    counterMessage: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface MarketComment {
    id: string;
    listingId: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string | null;
    content: string;
    parentId: string | null;
    isEdited: boolean;
    replies?: MarketComment[];
    createdAt: string;
    updatedAt: string;
}

export interface MarketRating {
    id: string;
    listingId: string;
    offerId: string;
    raterId: string;
    raterName: string;
    raterAvatarUrl: string | null;
    ratedUserId: string;
    score: number;
    text: string | null;
    reply: string | null;
    createdAt: string;
}

export interface MarketReport {
    id: string;
    listingId: string;
    listingTitle: string;
    reporterId: string;
    reason: string;
    status: ReportStatus;
    moderatorNote: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedListings {
    data: MarketListing[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateListingPayload {
    title: string;
    description: string;
    price?: number | null;
    currency?: string;
    type: ListingType;
    categoryId: string;
    images?: string[];
    tags?: string[];
    expiresAt?: string | null;
}

export interface SendOfferPayload {
    amount?: number | null;
    message: string;
}

export interface CounterOfferPayload {
    counterAmount?: number | null;
    counterMessage: string;
}
