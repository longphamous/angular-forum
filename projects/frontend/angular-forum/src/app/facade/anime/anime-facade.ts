import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { map, Observable } from "rxjs";

import { ANIME_ROUTES } from "../../core/api/anime.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import {
    Anime,
    AnimeFilter,
    AnimeListEntry,
    AnimeListEntryPayload,
    PaginatedAnime
} from "../../core/models/anime/anime";

interface AnimeV2Response {
    id: number;
    url?: string;
    title?: string;
    titleEnglish?: string;
    titleJapanese?: string;
    titleSynonyms?: string[];
    images?: { jpg?: { imageUrl?: string; smallImageUrl?: string; largeImageUrl?: string } };
    synopsis?: string;
    background?: string;
    type?: string;
    source?: string;
    episodes?: number;
    status?: string;
    airing?: boolean;
    score?: number;
    scoredBy?: number;
    rank?: number;
    popularity?: number;
    members?: number;
    favorites?: number;
    season?: string;
    year?: number;
    rating?: string;
    duration?: string;
    broadcast?: { day?: string; time?: string };
    aired?: { from?: string; to?: string };
    createdAt?: string;
    genres?: string[];
    studios?: Array<{ malId: number; name: string }>;
    producers?: Array<{ malId: number; name: string }>;
    relatedEntries?: Array<{ malId: number; relation: string; type: string; name?: string; picture?: string }>;
    [key: string]: unknown;
}

function parseDateParts(isoDate?: string): { year?: number; month?: number; day?: number } {
    if (!isoDate) return {};
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return {};
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function parseDurationMinutes(duration?: string): number | undefined {
    if (!duration) return undefined;
    const match = duration.match(/(\d+)\s*min/);
    return match ? Number(match[1]) : undefined;
}

function mapV2ToAnime(v2: AnimeV2Response): Anime {
    const airedFrom = parseDateParts(v2.aired?.from);
    const airedTo = parseDateParts(v2.aired?.to);
    return {
        id: v2.id,
        title: v2.title,
        titleEnglish: v2.titleEnglish,
        titleJapanese: v2.titleJapanese,
        titleSynonym: v2.titleSynonyms?.join(", "),
        picture: v2.images?.jpg?.largeImageUrl ?? v2.images?.jpg?.imageUrl,
        synopsis: v2.synopsis,
        type: v2.type,
        status: v2.status,
        episode: v2.episodes,
        episodeDuration: parseDurationMinutes(v2.duration),
        season: v2.season,
        seasonYear: v2.year,
        source: v2.source,
        rating: v2.rating,
        mean: v2.score != null ? Number(v2.score) : undefined,
        rank: v2.rank,
        popularity: v2.popularity,
        member: v2.members,
        voter: v2.scoredBy,
        startYear: airedFrom.year,
        startMonth: airedFrom.month,
        startDay: airedFrom.day,
        endYear: airedTo.year,
        endMonth: airedTo.month,
        endDay: airedTo.day,
        broadcastDay: v2.broadcast?.day,
        broadcastTime: v2.broadcast?.time,
        createdAt: v2.createdAt,
        genres: v2.genres,
        studios: v2.studios?.map((s) => ({ id: s.malId, name: s.name })),
        relatedAnime: v2.relatedEntries
            ?.filter((r) => r.type === "anime")
            .map((r) => ({
                animeId: r.malId,
                relation: r.relation,
                title: r.name,
                titleEnglish: r.name,
                picture: r.picture
            }))
    };
}

function mapPaginatedV2(res: { data: AnimeV2Response[]; total: number; page: number; limit: number }): PaginatedAnime {
    return { data: res.data.map(mapV2ToAnime), total: res.total, page: res.page, limit: res.limit };
}

@Injectable({ providedIn: "root" })
export class AnimeFacade {
    readonly animeList: Signal<Anime[]>;
    readonly currentAnime: Signal<Anime | null>;
    readonly detailLoading: Signal<boolean>;
    readonly error: Signal<string | null>;
    readonly genres: Signal<string[]>;
    readonly listLoading: Signal<boolean>;
    readonly loading: Signal<boolean>;
    readonly total: Signal<number>;
    readonly userList: Signal<AnimeListEntry[]>;

    private readonly _animeList = signal<Anime[]>([]);
    private readonly _currentAnime = signal<Anime | null>(null);
    private readonly _detailLoading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly _genres = signal<string[]>([]);
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
        this.genres = this._genres.asReadonly();
        this.listLoading = this._listLoading.asReadonly();
        this.loading = this._loading.asReadonly();
        this.total = this._total.asReadonly();
        this.userList = this._userList.asReadonly();
    }

    loadPage(page: number, limit: number): void {
        this._loading.set(true);
        this._error.set(null);

        const params = new HttpParams().set("page", page).set("limit", limit);

        this.http
            .get<{ data: AnimeV2Response[]; total: number; page: number; limit: number }>(
                `${this.apiConfig.baseUrl}${ANIME_ROUTES.list()}`,
                { params }
            )
            .pipe(map(mapPaginatedV2))
            .subscribe({
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
        if (filters.seasonYear != null) params = params.set("year", filters.seasonYear);
        if (filters.startYear != null) params = params.set("minYear", filters.startYear);
        if (filters.endYear != null) params = params.set("maxYear", filters.endYear);
        if (filters.source) params = params.set("source", filters.source);
        if (filters.rating) params = params.set("rating", filters.rating);
        if (filters.minEpisodes != null) params = params.set("minEpisodes", filters.minEpisodes);
        if (filters.maxEpisodes != null) params = params.set("maxEpisodes", filters.maxEpisodes);
        if (filters.minScore != null) params = params.set("minScore", filters.minScore);
        if (filters.maxScore != null) params = params.set("maxScore", filters.maxScore);
        if (filters.genre) params = params.set("genre", filters.genre);
        if (filters.newerThanDays != null) params = params.set("newerThanDays", filters.newerThanDays);
        if (filters.sortBy) params = params.set("sortBy", this.mapSortField(filters.sortBy));
        if (filters.sortOrder) params = params.set("sortOrder", filters.sortOrder);

        this.http
            .get<{ data: AnimeV2Response[]; total: number; page: number; limit: number }>(
                `${this.apiConfig.baseUrl}${ANIME_ROUTES.list()}`,
                { params }
            )
            .pipe(map(mapPaginatedV2))
            .subscribe({
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

        this.http
            .get<AnimeV2Response>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.detail(id)}`)
            .pipe(map(mapV2ToAnime))
            .subscribe({
                next: (anime) => {
                    this._currentAnime.set(anime);
                    this._detailLoading.set(false);
                },
                error: () => {
                    this._detailLoading.set(false);
                }
            });
    }

    private mapSortField(field: string): string {
        const v1ToV2: Record<string, string> = {
            mean: "score",
            episode: "episodes",
            seasonYear: "year",
            startYear: "year",
            member: "members",
            voter: "favorites"
        };
        return v1ToV2[field] ?? field;
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

    loadGenres(): void {
        if (this._genres().length > 0) return;
        this.http.get<string[]>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.genres()}`).subscribe({
            next: (genres) => this._genres.set(genres),
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            error: () => {}
        });
    }
}
