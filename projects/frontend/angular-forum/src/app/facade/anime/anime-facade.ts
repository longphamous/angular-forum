import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { Observable } from "rxjs";

import { ANIME_ROUTES } from "../../core/api/anime.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import {
    Anime,
    AnimeFilter,
    AnimeListEntry,
    AnimeListEntryPayload,
    PaginatedAnime
} from "../../core/models/anime/anime";

@Injectable({ providedIn: "root" })
export class AnimeFacade {
    readonly animeList: Signal<Anime[]>;
    readonly currentAnime: Signal<Anime | null>;
    readonly detailLoading: Signal<boolean>;
    readonly error: Signal<string | null>;
    readonly listLoading: Signal<boolean>;
    readonly loading: Signal<boolean>;
    readonly total: Signal<number>;
    readonly userList: Signal<AnimeListEntry[]>;

    private readonly _animeList = signal<Anime[]>([]);
    private readonly _currentAnime = signal<Anime | null>(null);
    private readonly _detailLoading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly _listLoading = signal(false);
    private readonly _loading = signal(false);
    private readonly _total = signal(0);
    private readonly _userList = signal<AnimeListEntry[]>([]);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly http = inject(HttpClient);

    constructor() {
        this.animeList = this._animeList.asReadonly();
        this.currentAnime = this._currentAnime.asReadonly();
        this.detailLoading = this._detailLoading.asReadonly();
        this.error = this._error.asReadonly();
        this.listLoading = this._listLoading.asReadonly();
        this.loading = this._loading.asReadonly();
        this.total = this._total.asReadonly();
        this.userList = this._userList.asReadonly();
    }

    loadPage(page: number, limit: number): void {
        this._loading.set(true);
        this._error.set(null);

        const params = new HttpParams().set("page", page).set("limit", limit);

        this.http.get<PaginatedAnime>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.list()}`, { params }).subscribe({
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

        this.http.get<PaginatedAnime>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.list()}`, { params }).subscribe({
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

    loadById(id: number): void {
        this._detailLoading.set(true);
        this._currentAnime.set(null);

        this.http.get<Anime>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.detail(id)}`).subscribe({
            next: (anime) => {
                this._currentAnime.set(anime);
                this._detailLoading.set(false);
            },
            error: () => {
                this._detailLoading.set(false);
            }
        });
    }

    loadUserList(): void {
        this._listLoading.set(true);

        this.http.get<AnimeListEntry[]>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.myList()}`).subscribe({
            next: (entries) => {
                this._userList.set(entries);
                this._listLoading.set(false);
            },
            error: () => {
                this._listLoading.set(false);
            }
        });
    }

    saveListEntry(payload: AnimeListEntryPayload): Observable<AnimeListEntry> {
        return this.http.post<AnimeListEntry>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.myList()}`, payload);
    }

    removeFromList(animeId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.myList()}/${animeId}`);
    }

    loadPublicUserList(userId: string): Observable<AnimeListEntry[]> {
        return this.http.get<AnimeListEntry[]>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.publicList(userId)}`);
    }

    updateUserListLocally(entry: AnimeListEntry): void {
        this._userList.update((list) => {
            const idx = list.findIndex((e) => e.animeId === entry.animeId);
            if (idx >= 0) {
                const updated = [...list];
                updated[idx] = entry;
                return updated;
            }
            return [entry, ...list];
        });
    }

    removeFromUserListLocally(animeId: number): void {
        this._userList.update((list) => list.filter((e) => e.animeId !== animeId));
    }
}
