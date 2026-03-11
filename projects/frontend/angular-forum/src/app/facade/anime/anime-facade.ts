import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";

import { Anime, AnimeFilter, PaginatedAnime } from "../../core/models/anime/anime";

@Injectable({ providedIn: "root" })
export class AnimeFacade {
    readonly animeList: Signal<Anime[]>;
    readonly total: Signal<number>;
    readonly loading: Signal<boolean>;
    readonly error: Signal<string | null>;

    private readonly _animeList = signal<Anime[]>([]);
    private readonly _total = signal(0);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly http = inject(HttpClient);

    constructor() {
        this.animeList = this._animeList.asReadonly();
        this.total = this._total.asReadonly();
        this.loading = this._loading.asReadonly();
        this.error = this._error.asReadonly();
    }

    loadPage(page: number, limit: number): void {
        this._loading.set(true);
        this._error.set(null);

        const params = new HttpParams().set("page", page).set("limit", limit);

        this.http.get<PaginatedAnime>("/api/anime", { params }).subscribe({
            next: (res) => {
                this._animeList.set(res.data);
                this._total.set(res.total);
                this._loading.set(false);
            },
            error: () => {
                this._error.set("Failed to load anime data. Please try again.");
                this._loading.set(false);
            }
        });
    }

    loadWithFilters(page: number, limit: number, filters: AnimeFilter = {}): void {
        this._loading.set(true);
        this._error.set(null);

        let params = new HttpParams().set("page", page).set("limit", limit);

        if (filters.search) params = params.set("search", filters.search);
        if (filters.type) params = params.set("type", filters.type);
        if (filters.status) params = params.set("status", filters.status);
        if (filters.season) params = params.set("season", filters.season);
        if (filters.seasonYear != null) params = params.set("seasonYear", filters.seasonYear);
        if (filters.startYear != null) params = params.set("startYear", filters.startYear);
        if (filters.endYear != null) params = params.set("endYear", filters.endYear);
        if (filters.source) params = params.set("source", filters.source);
        if (filters.rating) params = params.set("rating", filters.rating);
        if (filters.nsfw != null) params = params.set("nsfw", String(filters.nsfw));
        if (filters.minEpisodes != null) params = params.set("minEpisodes", filters.minEpisodes);
        if (filters.maxEpisodes != null) params = params.set("maxEpisodes", filters.maxEpisodes);
        if (filters.minScore != null) params = params.set("minScore", filters.minScore);
        if (filters.maxScore != null) params = params.set("maxScore", filters.maxScore);
        if (filters.sortBy) params = params.set("sortBy", filters.sortBy);
        if (filters.sortOrder) params = params.set("sortOrder", filters.sortOrder);

        this.http.get<PaginatedAnime>("/api/anime", { params }).subscribe({
            next: (res) => {
                this._animeList.set(res.data);
                this._total.set(res.total);
                this._loading.set(false);
            },
            error: () => {
                this._error.set("Failed to load anime data. Please try again.");
                this._loading.set(false);
            }
        });
    }
}
