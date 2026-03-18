import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { Observable } from "rxjs";

import { FEED_ROUTES } from "../../core/api/feed.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { FeaturedThread, FeedSort, HotThread, PaginatedFeed, ThreadSearchResult } from "../../core/models/feed/feed";

@Injectable({ providedIn: "root" })
export class FeedFacade {
    readonly featured: Signal<FeaturedThread[]>;
    readonly feedItems: Signal<HotThread[]>;
    readonly feedTotal: Signal<number>;
    readonly loading: Signal<boolean>;
    readonly feedLoading: Signal<boolean>;
    readonly hasMore: Signal<boolean>;
    readonly error: Signal<string | null>;

    private readonly _featured = signal<FeaturedThread[]>([]);
    private readonly _feedItems = signal<HotThread[]>([]);
    private readonly _feedTotal = signal(0);
    private readonly _loading = signal(false);
    private readonly _feedLoading = signal(false);
    private readonly _hasMore = signal(true);
    private readonly _error = signal<string | null>(null);

    private currentPage = 1;
    private readonly pageSize = 20;
    private currentSort: FeedSort = "hot";

    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.featured = this._featured.asReadonly();
        this.feedItems = this._feedItems.asReadonly();
        this.feedTotal = this._feedTotal.asReadonly();
        this.loading = this._loading.asReadonly();
        this.feedLoading = this._feedLoading.asReadonly();
        this.hasMore = this._hasMore.asReadonly();
        this.error = this._error.asReadonly();
    }

    loadFeatured(): void {
        this._loading.set(true);
        this.http.get<FeaturedThread[]>(`${this.apiConfig.baseUrl}${FEED_ROUTES.featured()}`).subscribe({
            next: (items) => {
                this._featured.set(items);
                this._loading.set(false);
            },
            error: () => {
                this._loading.set(false);
            }
        });
    }

    loadFeed(sort: FeedSort = "hot"): void {
        this.currentSort = sort;
        this.currentPage = 1;
        this._feedItems.set([]);
        this._hasMore.set(true);
        this._feedLoading.set(true);
        this._error.set(null);

        const params = new HttpParams().set("page", 1).set("limit", this.pageSize).set("sort", sort);

        this.http.get<PaginatedFeed>(`${this.apiConfig.baseUrl}${FEED_ROUTES.hot()}`, { params }).subscribe({
            next: (res) => {
                this._feedItems.set(res.data);
                this._feedTotal.set(res.total);
                this._hasMore.set(res.data.length === this.pageSize && res.total > this.pageSize);
                this._feedLoading.set(false);
            },
            error: () => {
                this._error.set("Fehler beim Laden des Feeds.");
                this._feedLoading.set(false);
            }
        });
    }

    loadMore(): void {
        if (this._feedLoading() || !this._hasMore()) return;

        this.currentPage += 1;
        this._feedLoading.set(true);

        const params = new HttpParams()
            .set("page", this.currentPage)
            .set("limit", this.pageSize)
            .set("sort", this.currentSort);

        this.http.get<PaginatedFeed>(`${this.apiConfig.baseUrl}${FEED_ROUTES.hot()}`, { params }).subscribe({
            next: (res) => {
                this._feedItems.update((items) => [...items, ...res.data]);
                this._feedTotal.set(res.total);
                this._hasMore.set(res.data.length === this.pageSize);
                this._feedLoading.set(false);
            },
            error: () => {
                this._feedLoading.set(false);
            }
        });
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    getAdminFeatured(): Observable<FeaturedThread[]> {
        return this.http.get<FeaturedThread[]>(`${this.apiConfig.baseUrl}${FEED_ROUTES.admin.featured()}`);
    }

    searchThreads(q: string): Observable<ThreadSearchResult[]> {
        const params = new HttpParams().set("q", q);
        return this.http.get<ThreadSearchResult[]>(`${this.apiConfig.baseUrl}${FEED_ROUTES.admin.searchThreads()}`, {
            params
        });
    }

    addFeatured(threadId: string, position?: number): Observable<FeaturedThread> {
        return this.http.post<FeaturedThread>(`${this.apiConfig.baseUrl}${FEED_ROUTES.admin.featured()}`, {
            threadId,
            position
        });
    }

    updateFeatured(id: string, data: { position?: number; isActive?: boolean }): Observable<FeaturedThread> {
        return this.http.patch<FeaturedThread>(`${this.apiConfig.baseUrl}${FEED_ROUTES.admin.featuredById(id)}`, data);
    }

    removeFeatured(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.apiConfig.baseUrl}${FEED_ROUTES.admin.featuredById(id)}`);
    }
}
