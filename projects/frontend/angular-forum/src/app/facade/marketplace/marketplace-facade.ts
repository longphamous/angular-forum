import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable } from "rxjs";

import { MARKETPLACE_ROUTES } from "../../core/api/marketplace.routes";
import {
    CounterOfferPayload,
    CreateListingPayload,
    MarketCategory,
    MarketComment,
    MarketListing,
    MarketOffer,
    MarketRating,
    MarketReport,
    PaginatedListings,
    SendOfferPayload
} from "../../core/models/marketplace/marketplace";

@Injectable({ providedIn: "root" })
export class MarketplaceFacade {
    private readonly http = inject(HttpClient);

    readonly categories = signal<MarketCategory[]>([]);
    readonly listings = signal<MarketListing[]>([]);
    readonly listingsTotal = signal(0);
    readonly currentListing = signal<MarketListing | null>(null);
    readonly comments = signal<MarketComment[]>([]);
    readonly offers = signal<MarketOffer[]>([]);
    readonly ratings = signal<MarketRating[]>([]);
    readonly myListings = signal<MarketListing[]>([]);
    readonly myOffers = signal<MarketOffer[]>([]);
    readonly pendingListings = signal<MarketListing[]>([]);
    readonly pendingReports = signal<MarketReport[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    loadCategories(): void {
        this.loading.set(true);
        this.http.get<MarketCategory[]>(MARKETPLACE_ROUTES.categories).subscribe({
            next: (cats) => {
                this.categories.set(cats);
                this.loading.set(false);
            },
            error: (e: { message: string }) => {
                this.error.set(e.message);
                this.loading.set(false);
            }
        });
    }

    loadListings(
        params: { page?: number; limit?: number; categoryId?: string; type?: string; search?: string } = {}
    ): void {
        this.loading.set(true);
        this.error.set(null);
        const query = new URLSearchParams();
        if (params.page) query.set("page", String(params.page));
        if (params.limit) query.set("limit", String(params.limit));
        if (params.categoryId) query.set("categoryId", params.categoryId);
        if (params.type) query.set("type", params.type);
        if (params.search) query.set("search", params.search);
        const qs = query.toString();
        const url = `${MARKETPLACE_ROUTES.listings.list}${qs ? "?" + qs : ""}`;
        this.http.get<PaginatedListings>(url).subscribe({
            next: (r) => {
                this.listings.set(r.data);
                this.listingsTotal.set(r.total);
                this.loading.set(false);
            },
            error: (e: { message: string }) => {
                this.error.set(e.message);
                this.loading.set(false);
            }
        });
    }

    loadMyListings(): void {
        this.http.get<MarketListing[]>(MARKETPLACE_ROUTES.listings.my).subscribe({
            next: (l) => this.myListings.set(l)
        });
    }

    loadMyOffers(): void {
        this.http.get<MarketOffer[]>(MARKETPLACE_ROUTES.listings.myOffers).subscribe({
            next: (o) => this.myOffers.set(o)
        });
    }

    loadListing(id: string): void {
        this.loading.set(true);
        this.error.set(null);
        this.http.get<MarketListing>(MARKETPLACE_ROUTES.listings.detail(id)).subscribe({
            next: (l) => {
                this.currentListing.set(l);
                this.loading.set(false);
            },
            error: (e: { message: string }) => {
                this.error.set(e.message);
                this.loading.set(false);
            }
        });
    }

    createListing(payload: CreateListingPayload): Observable<MarketListing> {
        return this.http.post<MarketListing>(MARKETPLACE_ROUTES.listings.list, payload);
    }

    updateListing(id: string, payload: Partial<CreateListingPayload>): Observable<MarketListing> {
        return this.http.patch<MarketListing>(MARKETPLACE_ROUTES.listings.detail(id), payload);
    }

    deleteListing(id: string): Observable<void> {
        return this.http.delete<void>(MARKETPLACE_ROUTES.listings.detail(id));
    }

    closeListing(id: string): Observable<MarketListing> {
        return this.http.post<MarketListing>(MARKETPLACE_ROUTES.listings.close(id), {});
    }

    loadOffers(listingId: string): void {
        this.http.get<MarketOffer[]>(MARKETPLACE_ROUTES.listings.offers(listingId)).subscribe({
            next: (o) => this.offers.set(o)
        });
    }

    sendOffer(listingId: string, payload: SendOfferPayload): Observable<MarketOffer> {
        return this.http.post<MarketOffer>(MARKETPLACE_ROUTES.listings.offers(listingId), payload);
    }

    updateOffer(listingId: string, offerId: string, payload: SendOfferPayload): Observable<MarketOffer> {
        return this.http.patch<MarketOffer>(MARKETPLACE_ROUTES.listings.offer(listingId, offerId), payload);
    }

    acceptOffer(listingId: string, offerId: string): Observable<MarketOffer> {
        return this.http.post<MarketOffer>(MARKETPLACE_ROUTES.listings.offerAccept(listingId, offerId), {});
    }

    rejectOffer(listingId: string, offerId: string): Observable<MarketOffer> {
        return this.http.post<MarketOffer>(MARKETPLACE_ROUTES.listings.offerReject(listingId, offerId), {});
    }

    counterOffer(listingId: string, offerId: string, payload: CounterOfferPayload): Observable<MarketOffer> {
        return this.http.post<MarketOffer>(MARKETPLACE_ROUTES.listings.offerCounter(listingId, offerId), payload);
    }

    withdrawOffer(listingId: string, offerId: string): Observable<void> {
        return this.http.delete<void>(MARKETPLACE_ROUTES.listings.offer(listingId, offerId));
    }

    loadComments(listingId: string): void {
        this.http.get<MarketComment[]>(MARKETPLACE_ROUTES.listings.comments(listingId)).subscribe({
            next: (c) => this.comments.set(c)
        });
    }

    addComment(listingId: string, content: string, parentId?: string | null): Observable<MarketComment> {
        return this.http.post<MarketComment>(MARKETPLACE_ROUTES.listings.comments(listingId), { content, parentId });
    }

    deleteComment(listingId: string, commentId: string): Observable<void> {
        return this.http.delete<void>(MARKETPLACE_ROUTES.listings.comment(listingId, commentId));
    }

    loadRatings(listingId: string): void {
        this.http.get<MarketRating[]>(MARKETPLACE_ROUTES.listings.ratings(listingId)).subscribe({
            next: (r) => this.ratings.set(r)
        });
    }

    submitRating(
        listingId: string,
        payload: { offerId: string; ratedUserId: string; score: number; text?: string }
    ): Observable<MarketRating> {
        return this.http.post<MarketRating>(MARKETPLACE_ROUTES.listings.ratings(listingId), payload);
    }

    reportListing(listingId: string, reason: string): Observable<void> {
        return this.http.post<void>(MARKETPLACE_ROUTES.listings.report(listingId), { reason });
    }

    loadPendingListings(): void {
        this.http.get<MarketListing[]>(MARKETPLACE_ROUTES.admin.pending).subscribe({
            next: (l) => this.pendingListings.set(l)
        });
    }

    approveListing(id: string): Observable<MarketListing> {
        return this.http.post<MarketListing>(MARKETPLACE_ROUTES.admin.approve(id), {});
    }

    rejectListingAdmin(id: string, reason: string): Observable<MarketListing> {
        return this.http.post<MarketListing>(MARKETPLACE_ROUTES.admin.reject(id), { reason });
    }

    loadPendingReports(): void {
        this.http.get<MarketReport[]>(MARKETPLACE_ROUTES.admin.reports).subscribe({
            next: (r) => this.pendingReports.set(r)
        });
    }

    actionReport(id: string, status: string, moderatorNote?: string): Observable<MarketReport> {
        return this.http.patch<MarketReport>(MARKETPLACE_ROUTES.admin.actionReport(id), { status, moderatorNote });
    }
}
