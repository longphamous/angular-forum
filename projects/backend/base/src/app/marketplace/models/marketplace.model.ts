import { ListingStatus, ListingType } from "../entities/market-listing.entity";
import { OfferStatus } from "../entities/market-offer.entity";
import { ReportStatus } from "../entities/market-report.entity";

export interface MarketCategoryDto {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    icon: string;
    sortOrder: number;
    requiresApproval: boolean;
    isActive: boolean;
    children?: MarketCategoryDto[];
}

export interface MarketListingDto {
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

export interface MarketOfferDto {
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

export interface MarketCommentDto {
    id: string;
    listingId: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string | null;
    content: string;
    parentId: string | null;
    isEdited: boolean;
    replies?: MarketCommentDto[];
    createdAt: string;
    updatedAt: string;
}

export interface MarketRatingDto {
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

export interface MarketReportDto {
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

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateListingDto {
    title: string;
    description: string;
    price?: number | null;
    currency?: string;
    type: ListingType;
    categoryId: string;
    images?: string[];
    tags?: string[];
    expiresAt?: string | null;
    customFields?: Record<string, unknown> | null;
}

export interface UpdateListingDto {
    title?: string;
    description?: string;
    price?: number | null;
    currency?: string;
    categoryId?: string;
    images?: string[];
    tags?: string[];
    expiresAt?: string | null;
    customFields?: Record<string, unknown> | null;
}

export interface CreateOfferDto {
    amount?: number | null;
    message: string;
}

export interface CounterOfferDto {
    counterAmount?: number | null;
    counterMessage: string;
}

export interface CreateCommentDto {
    content: string;
    parentId?: string | null;
}

export interface CreateRatingDto {
    offerId: string;
    ratedUserId: string;
    score: number;
    text?: string | null;
}

export interface ReportListingDto {
    reason: string;
}

export interface ActionReportDto {
    status: ReportStatus;
    moderatorNote?: string | null;
}

export interface ListingsQueryDto {
    categoryId?: string;
    type?: ListingType;
    status?: ListingStatus;
    search?: string;
    page?: number;
    limit?: number;
}
