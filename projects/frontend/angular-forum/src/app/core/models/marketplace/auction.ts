import { MarketListing } from "./marketplace";

export type AuctionStatus = "scheduled" | "active" | "ended" | "cancelled";
export type BidStatus = "active" | "outbid" | "winning" | "won" | "lost";

export interface Auction {
    id: string;
    listingId: string;
    listing: MarketListing;
    startPrice: number;
    currentPrice: number;
    buyNowPrice: number | null;
    currency: string;
    bidIncrement: number;
    startTime: string;
    endTime: string;
    originalEndTime: string;
    status: AuctionStatus;
    bidCount: number;
    highestBidderId: string | null;
    highestBidderName: string | null;
    watcherCount: number;
    isWatched: boolean;
    hasUserBid: boolean;
    userMaxBid: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface AuctionBid {
    id: string;
    auctionId: string;
    bidderId: string;
    bidderName: string;
    bidderAvatarUrl: string | null;
    amount: number;
    isAutoBid: boolean;
    createdAt: string;
}

export interface AuctionWatchlistItem {
    auctionId: string;
    auction: Auction;
    addedAt: string;
}

export interface PaginatedAuctions {
    data: Auction[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateAuctionPayload {
    title: string;
    description: string;
    categoryId: string;
    startPrice: number;
    buyNowPrice?: number | null;
    currency?: string;
    bidIncrement?: number;
    durationHours: number;
    images?: string[];
    tags?: string[];
}

export interface PlaceBidPayload {
    amount: number;
    maxAutoBid?: number | null;
}

export interface AuctionsQueryParams {
    page?: number;
    limit?: number;
    categoryId?: string;
    status?: AuctionStatus;
    search?: string;
    sort?: "ending-soon" | "newly-listed" | "price-asc" | "price-desc" | "most-bids";
}
