import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable } from "rxjs";

import { AUCTION_ROUTES } from "../../core/api/auction.routes";
import {
    Auction,
    AuctionBid,
    AuctionsQueryParams,
    AuctionWatchlistItem,
    CreateAuctionPayload,
    PaginatedAuctions,
    PlaceBidPayload
} from "../../core/models/marketplace/auction";

@Injectable({ providedIn: "root" })
export class AuctionFacade {
    private readonly http = inject(HttpClient);

    readonly auctions = signal<Auction[]>([]);
    readonly auctionsTotal = signal(0);
    readonly currentAuction = signal<Auction | null>(null);
    readonly bidHistory = signal<AuctionBid[]>([]);
    readonly myAuctions = signal<Auction[]>([]);
    readonly myBids = signal<AuctionBid[]>([]);
    readonly watchlist = signal<AuctionWatchlistItem[]>([]);
    readonly pendingAuctions = signal<Auction[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    loadAuctions(params: AuctionsQueryParams = {}): void {
        this.loading.set(true);
        this.error.set(null);
        const query = new URLSearchParams();
        if (params.page) query.set("page", String(params.page));
        if (params.limit) query.set("limit", String(params.limit));
        if (params.categoryId) query.set("categoryId", params.categoryId);
        if (params.status) query.set("status", params.status);
        if (params.search) query.set("search", params.search);
        if (params.sort) query.set("sort", params.sort);
        const qs = query.toString();
        const url = `${AUCTION_ROUTES.list}${qs ? "?" + qs : ""}`;
        this.http.get<PaginatedAuctions>(url).subscribe({
            next: (r) => {
                this.auctions.set(r.data);
                this.auctionsTotal.set(r.total);
                this.loading.set(false);
            },
            error: (e: { message: string }) => {
                this.error.set(e.message);
                this.loading.set(false);
            }
        });
    }

    loadAuction(id: string): void {
        this.loading.set(true);
        this.error.set(null);
        this.http.get<Auction>(AUCTION_ROUTES.detail(id)).subscribe({
            next: (a) => {
                this.currentAuction.set(a);
                this.loading.set(false);
            },
            error: (e: { message: string }) => {
                this.error.set(e.message);
                this.loading.set(false);
            }
        });
    }

    loadBidHistory(auctionId: string): void {
        this.http.get<AuctionBid[]>(AUCTION_ROUTES.bids(auctionId)).subscribe({
            next: (b) => this.bidHistory.set(b)
        });
    }

    loadMyAuctions(): void {
        this.http.get<Auction[]>(AUCTION_ROUTES.my).subscribe({
            next: (a) => this.myAuctions.set(a)
        });
    }

    loadMyBids(): void {
        this.http.get<AuctionBid[]>(AUCTION_ROUTES.myBids).subscribe({
            next: (b) => this.myBids.set(b)
        });
    }

    loadWatchlist(): void {
        this.http.get<AuctionWatchlistItem[]>(AUCTION_ROUTES.watchlist).subscribe({
            next: (w) => this.watchlist.set(w)
        });
    }

    createAuction(payload: CreateAuctionPayload): Observable<Auction> {
        return this.http.post<Auction>(AUCTION_ROUTES.create, payload);
    }

    placeBid(auctionId: string, payload: PlaceBidPayload): Observable<AuctionBid> {
        return this.http.post<AuctionBid>(AUCTION_ROUTES.bids(auctionId), payload);
    }

    buyNow(auctionId: string): Observable<Auction> {
        return this.http.post<Auction>(AUCTION_ROUTES.buyNow(auctionId), {});
    }

    toggleWatch(auctionId: string): Observable<{ watched: boolean }> {
        return this.http.post<{ watched: boolean }>(AUCTION_ROUTES.watch(auctionId), {});
    }

    cancelAuction(auctionId: string): Observable<void> {
        return this.http.post<void>(AUCTION_ROUTES.cancel(auctionId), {});
    }

    loadPendingAuctions(): void {
        this.http.get<Auction[]>(AUCTION_ROUTES.admin.pending).subscribe({
            next: (a) => this.pendingAuctions.set(a)
        });
    }

    approveAuction(id: string): Observable<Auction> {
        return this.http.post<Auction>(AUCTION_ROUTES.admin.approve(id), {});
    }

    rejectAuction(id: string, reason: string): Observable<Auction> {
        return this.http.post<Auction>(AUCTION_ROUTES.admin.reject(id), { reason });
    }
}
