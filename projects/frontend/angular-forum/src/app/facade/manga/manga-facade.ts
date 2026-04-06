import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { map, Observable } from "rxjs";

import { MANGA_ROUTES } from "../../core/api/manga.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import {
    Manga,
    MangaFilter,
    MangaListEntry,
    MangaListEntryPayload,
    PaginatedManga
} from "../../core/models/manga/manga";

interface MangaV2Response {
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
    chapters?: number;
    volumes?: number;
    status?: string;
    publishing?: boolean;
    score?: number;
    scoredBy?: number;
    rank?: number;
    popularity?: number;
    members?: number;
    favorites?: number;
    published?: { from?: string; to?: string; string?: string };
    createdAt?: string;
    genres?: string[];
    authors?: Array<{ name: string; role?: string }>;
    serializations?: string[];
    relatedEntries?: Array<{ malId: number; relation: string; type: string; name?: string; picture?: string }>;
    [key: string]: unknown;
}

function mapV2ToManga(v2: MangaV2Response): Manga {
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
        chapters: v2.chapters,
        volumes: v2.volumes,
        publishing: v2.publishing,
        score: v2.score != null ? Number(v2.score) : undefined,
        scoredBy: v2.scoredBy,
        rank: v2.rank,
        popularity: v2.popularity,
        members: v2.members,
        favorites: v2.favorites,
        serializations: v2.serializations,
        publishedFrom: v2.published?.from,
        publishedTo: v2.published?.to,
        publishedString: v2.published?.string,
        createdAt: v2.createdAt,
        genres: v2.genres,
        authors: v2.authors,
        relatedManga: v2.relatedEntries
            ?.filter((r) => r.type === "manga")
            .map((r) => ({
                mangaId: r.malId,
                relation: r.relation,
                title: r.name,
                titleEnglish: r.name,
                picture: r.picture
            }))
    };
}

function mapPaginatedV2(res: {
    data: MangaV2Response[];
    total: number;
    page: number;
    limit: number;
}): PaginatedManga {
    return { data: res.data.map(mapV2ToManga), total: res.total, page: res.page, limit: res.limit };
}

@Injectable({ providedIn: "root" })
export class MangaFacade {
    readonly mangaList: Signal<Manga[]>;
    readonly currentManga: Signal<Manga | null>;
    readonly detailLoading: Signal<boolean>;
    readonly error: Signal<string | null>;
    readonly genres: Signal<string[]>;
    readonly listLoading: Signal<boolean>;
    readonly loading: Signal<boolean>;
    readonly total: Signal<number>;
    readonly userList: Signal<MangaListEntry[]>;

    private readonly _mangaList = signal<Manga[]>([]);
    private readonly _currentManga = signal<Manga | null>(null);
    private readonly _detailLoading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly _genres = signal<string[]>([]);
    private readonly _listLoading = signal(false);
    private readonly _loading = signal(false);
    private readonly _total = signal(0);
    private readonly _userList = signal<MangaListEntry[]>([]);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly http = inject(HttpClient);

    constructor() {
        this.mangaList = this._mangaList.asReadonly();
        this.currentManga = this._currentManga.asReadonly();
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
            .get<{ data: MangaV2Response[]; total: number; page: number; limit: number }>(
                `${this.apiConfig.baseUrl}${MANGA_ROUTES.list()}`,
                { params }
            )
            .pipe(map(mapPaginatedV2))
            .subscribe({
                next: (res) => {
                    this._mangaList.set(res.data);
                    this._total.set(res.total);
                    this._loading.set(false);
                },
                error: () => {
                    this._error.set("Failed to load manga data. Please try again.");
                    this._loading.set(false);
                }
            });
    }

    loadWithFilters(page: number, limit: number, filters: MangaFilter = {}): void {
        this._loading.set(true);
        this._error.set(null);

        let params = new HttpParams().set("page", page).set("limit", limit);

        if (filters.search) params = params.set("search", filters.search);
        if (filters.type) params = params.set("type", filters.type);
        if (filters.status) params = params.set("status", filters.status);
        if (filters.minChapters != null) params = params.set("minChapters", filters.minChapters);
        if (filters.maxChapters != null) params = params.set("maxChapters", filters.maxChapters);
        if (filters.minVolumes != null) params = params.set("minVolumes", filters.minVolumes);
        if (filters.maxVolumes != null) params = params.set("maxVolumes", filters.maxVolumes);
        if (filters.minScore != null) params = params.set("minScore", filters.minScore);
        if (filters.maxScore != null) params = params.set("maxScore", filters.maxScore);
        if (filters.genre) params = params.set("genre", filters.genre);
        if (filters.newerThanDays != null) params = params.set("newerThanDays", filters.newerThanDays);
        if (filters.sortBy) params = params.set("sortBy", filters.sortBy);
        if (filters.sortOrder) params = params.set("sortOrder", filters.sortOrder);

        this.http
            .get<{ data: MangaV2Response[]; total: number; page: number; limit: number }>(
                `${this.apiConfig.baseUrl}${MANGA_ROUTES.list()}`,
                { params }
            )
            .pipe(map(mapPaginatedV2))
            .subscribe({
                next: (res) => {
                    this._mangaList.set(res.data);
                    this._total.set(res.total);
                    this._loading.set(false);
                },
                error: () => {
                    this._error.set("Failed to load manga data. Please try again.");
                    this._loading.set(false);
                }
            });
    }

    loadById(id: number): void {
        this._detailLoading.set(true);
        this._currentManga.set(null);

        this.http
            .get<MangaV2Response>(`${this.apiConfig.baseUrl}${MANGA_ROUTES.detail(id)}`)
            .pipe(map(mapV2ToManga))
            .subscribe({
                next: (manga) => {
                    this._currentManga.set(manga);
                    this._detailLoading.set(false);
                },
                error: () => {
                    this._detailLoading.set(false);
                }
            });
    }

    loadUserList(): void {
        this._listLoading.set(true);

        this.http.get<MangaListEntry[]>(`${this.apiConfig.baseUrl}${MANGA_ROUTES.myList()}`).subscribe({
            next: (entries) => {
                this._userList.set(entries);
                this._listLoading.set(false);
            },
            error: () => {
                this._listLoading.set(false);
            }
        });
    }

    saveListEntry(payload: MangaListEntryPayload): Observable<MangaListEntry> {
        return this.http.post<MangaListEntry>(`${this.apiConfig.baseUrl}${MANGA_ROUTES.myList()}`, payload);
    }

    removeFromList(mangaId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiConfig.baseUrl}${MANGA_ROUTES.myList()}/${mangaId}`);
    }

    loadPublicUserList(userId: string): Observable<MangaListEntry[]> {
        return this.http.get<MangaListEntry[]>(`${this.apiConfig.baseUrl}${MANGA_ROUTES.publicList(userId)}`);
    }

    updateUserListLocally(entry: MangaListEntry): void {
        this._userList.update((list) => {
            const idx = list.findIndex((e) => e.mangaId === entry.mangaId);
            if (idx >= 0) {
                const updated = [...list];
                updated[idx] = entry;
                return updated;
            }
            return [entry, ...list];
        });
    }

    removeFromUserListLocally(mangaId: number): void {
        this._userList.update((list) => list.filter((e) => e.mangaId !== mangaId));
    }

    loadGenres(): void {
        if (this._genres().length > 0) return;
        this.http.get<string[]>(`${this.apiConfig.baseUrl}${MANGA_ROUTES.genres()}`).subscribe({
            next: (genres) => this._genres.set(genres),
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            error: () => {}
        });
    }
}
