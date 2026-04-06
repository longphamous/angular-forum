import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";

import { HASHTAG_ROUTES } from "../../core/api/hashtag.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type { Hashtag, HashtagSearchResponse } from "../../core/models/hashtag/hashtag";

@Injectable({ providedIn: "root" })
export class HashtagFacade {
    readonly trending: Signal<Hashtag[]>;
    readonly searchResult: Signal<HashtagSearchResponse | null>;
    readonly autocompleteResults: Signal<Hashtag[]>;
    readonly loading: Signal<boolean>;

    private readonly _trending = signal<Hashtag[]>([]);
    private readonly _searchResult = signal<HashtagSearchResponse | null>(null);
    private readonly _autocompleteResults = signal<Hashtag[]>([]);
    private readonly _loading = signal(false);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.trending = this._trending.asReadonly();
        this.searchResult = this._searchResult.asReadonly();
        this.autocompleteResults = this._autocompleteResults.asReadonly();
        this.loading = this._loading.asReadonly();
    }

    loadTrending(limit = 20): void {
        const params = new HttpParams().set("limit", limit);
        this.http.get<Hashtag[]>(`${this.apiConfig.baseUrl}${HASHTAG_ROUTES.trending()}`, { params }).subscribe({
            next: (tags) => this._trending.set(tags),
            error: () => this._trending.set([])
        });
    }

    searchByTag(tag: string, limit = 50, offset = 0): void {
        this._loading.set(true);
        this._searchResult.set(null);
        const params = new HttpParams().set("limit", limit).set("offset", offset);
        this.http
            .get<HashtagSearchResponse>(`${this.apiConfig.baseUrl}${HASHTAG_ROUTES.search(tag)}`, { params })
            .subscribe({
                next: (res) => {
                    this._searchResult.set(res);
                    this._loading.set(false);
                },
                error: () => {
                    this._searchResult.set(null);
                    this._loading.set(false);
                }
            });
    }

    autocomplete(query: string): void {
        if (query.length < 2) {
            this._autocompleteResults.set([]);
            return;
        }
        const params = new HttpParams().set("q", query).set("limit", 10);
        this.http.get<Hashtag[]>(`${this.apiConfig.baseUrl}${HASHTAG_ROUTES.autocomplete()}`, { params }).subscribe({
            next: (tags) => this._autocompleteResults.set(tags),
            error: () => this._autocompleteResults.set([])
        });
    }
}
