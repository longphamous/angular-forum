import type { AuctionStatus } from "../entities/auction.entity";
import type { MarketListingDto } from "./marketplace.model";

export interface AuctionDto {
    id: string;
    listingId: string;
    listing: MarketListingDto;
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

export interface AuctionBidDto {
    id: string;
    auctionId: string;
    bidderId: string;
    bidderName: string;
    bidderAvatarUrl: string | null;
    amount: number;
    isAutoBid: boolean;
    createdAt: string;
}

export interface AuctionWatchlistDto {
    auctionId: string;
    auction: AuctionDto;
    addedAt: string;
}

export interface PaginatedAuctionResult {
    data: AuctionDto[];
    total: number;
    page: number;
    limit: number;
}
