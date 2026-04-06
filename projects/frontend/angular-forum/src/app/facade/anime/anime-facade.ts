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

export interface CharacterListItem {
    malId: number;
    name?: string;
    nameKanji?: string;
    favorites?: number;
    picture?: string;
    animeAppearances: number;
}

export interface PaginatedCharacters {
    data: CharacterListItem[];
    total: number;
    page: number;
    limit: number;
}

export interface CharacterDetail {
    malId: number;
    url?: string;
    name?: string;
    nameKanji?: string;
    nicknames?: string[];
    favorites?: number;
    about?: string;
    picture?: string;
    animeography: CharacterAnime[];
    mangaography: CharacterManga[];
    voiceActors: CharacterVoiceActor[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CharacterAnime {
    malId: number;
    title?: string;
    picture?: string;
    role?: string;
}

export interface CharacterManga {
    malId: number;
    title?: string;
    picture?: string;
    role?: string;
}

export interface CharacterVoiceActor {
    malId: number;
    name?: string;
    language: string;
    animeMalId: number;
    animeTitle?: string;
}

export interface PersonListItem {
    malId: number;
    name?: string;
    givenName?: string;
    familyName?: string;
    picture?: string;
    favorites?: number;
    birthday?: string;
}

export interface PaginatedPeople {
    data: PersonListItem[];
    total: number;
    page: number;
    limit: number;
}

export interface PersonDetail {
    malId: number;
    url?: string;
    name?: string;
    givenName?: string;
    familyName?: string;
    alternateNames?: string[];
    picture?: string;
    favorites?: number;
    birthday?: string;
    about?: string;
    staffRoles: PersonStaffRole[];
    voiceActingRoles: PersonVoiceActingRole[];
    createdAt?: string;
    updatedAt?: string;
}

export interface PersonStaffRole {
    animeMalId: number;
    animeTitle?: string;
    animePicture?: string;
    positions: string[];
}

export interface PersonVoiceActingRole {
    animeMalId: number;
    animeTitle?: string;
    animePicture?: string;
    characterMalId: number;
    characterName?: string;
    characterPicture?: string;
    language: string;
}

interface AnimeV2VoiceActorResponse {
    malId: number;
    name?: string;
    language: string;
}

interface AnimeV2CharacterResponse {
    malId: number;
    name?: string;
    nameKanji?: string;
    role?: string;
    favorites?: number;
    picture?: string;
    voiceActors?: AnimeV2VoiceActorResponse[];
}

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
    characters?: AnimeV2CharacterResponse[];
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
            })),
        characters: v2.characters?.map((c) => ({
            malId: c.malId,
            name: c.name,
            nameKanji: c.nameKanji,
            role: c.role,
            favorites: c.favorites,
            picture: c.picture,
            voiceActors: c.voiceActors?.map((va) => ({
                malId: va.malId,
                name: va.name,
                language: va.language
            }))
        }))
    };
}

function mapPaginatedV2(res: { data: AnimeV2Response[]; total: number; page: number; limit: number }): PaginatedAnime {
    return { data: res.data.map(mapV2ToAnime), total: res.total, page: res.page, limit: res.limit };
}

@Injectable({ providedIn: "root" })
export class AnimeFacade {
    readonly animeList: Signal<Anime[]>;
    readonly characterDetail: Signal<CharacterDetail | null>;
    readonly characterDetailLoading: Signal<boolean>;
    readonly characterList: Signal<CharacterListItem[]>;
    readonly characterLoading: Signal<boolean>;
    readonly characterTotal: Signal<number>;
    readonly currentAnime: Signal<Anime | null>;
    readonly detailLoading: Signal<boolean>;
    readonly error: Signal<string | null>;
    readonly genres: Signal<string[]>;
    readonly listLoading: Signal<boolean>;
    readonly loading: Signal<boolean>;
    readonly personDetail: Signal<PersonDetail | null>;
    readonly personDetailLoading: Signal<boolean>;
    readonly personList: Signal<PersonListItem[]>;
    readonly personLoading: Signal<boolean>;
    readonly personTotal: Signal<number>;
    readonly total: Signal<number>;
    readonly userList: Signal<AnimeListEntry[]>;

    private readonly _animeList = signal<Anime[]>([]);
    private readonly _characterDetail = signal<CharacterDetail | null>(null);
    private readonly _characterDetailLoading = signal(false);
    private readonly _characterList = signal<CharacterListItem[]>([]);
    private readonly _characterLoading = signal(false);
    private readonly _characterTotal = signal(0);
    private readonly _currentAnime = signal<Anime | null>(null);
    private readonly _detailLoading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly _genres = signal<string[]>([]);
    private readonly _listLoading = signal(false);
    private readonly _loading = signal(false);
    private readonly _personDetail = signal<PersonDetail | null>(null);
    private readonly _personDetailLoading = signal(false);
    private readonly _personList = signal<PersonListItem[]>([]);
    private readonly _personLoading = signal(false);
    private readonly _personTotal = signal(0);
    private readonly _total = signal(0);
    private readonly _userList = signal<AnimeListEntry[]>([]);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly http = inject(HttpClient);

    constructor() {
        this.animeList = this._animeList.asReadonly();
        this.characterDetail = this._characterDetail.asReadonly();
        this.characterDetailLoading = this._characterDetailLoading.asReadonly();
        this.characterList = this._characterList.asReadonly();
        this.characterLoading = this._characterLoading.asReadonly();
        this.characterTotal = this._characterTotal.asReadonly();
        this.currentAnime = this._currentAnime.asReadonly();
        this.detailLoading = this._detailLoading.asReadonly();
        this.error = this._error.asReadonly();
        this.genres = this._genres.asReadonly();
        this.listLoading = this._listLoading.asReadonly();
        this.loading = this._loading.asReadonly();
        this.personDetail = this._personDetail.asReadonly();
        this.personDetailLoading = this._personDetailLoading.asReadonly();
        this.personList = this._personList.asReadonly();
        this.personLoading = this._personLoading.asReadonly();
        this.personTotal = this._personTotal.asReadonly();
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

    loadCharacters(page: number, limit: number, search?: string): void {
        this._characterLoading.set(true);

        let params = new HttpParams().set("page", page).set("limit", limit).set("sortBy", "favorites").set("sortOrder", "DESC");
        if (search) params = params.set("search", search);

        this.http
            .get<PaginatedCharacters>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.characters()}`, { params })
            .subscribe({
                next: (res) => {
                    this._characterList.set(res.data);
                    this._characterTotal.set(res.total);
                    this._characterLoading.set(false);
                },
                error: () => {
                    this._characterLoading.set(false);
                }
            });
    }

    loadCharacterById(id: number): void {
        this._characterDetailLoading.set(true);
        this._characterDetail.set(null);

        this.http
            .get<CharacterDetail>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.characterDetail(id)}`)
            .subscribe({
                next: (detail) => {
                    this._characterDetail.set(detail);
                    this._characterDetailLoading.set(false);
                },
                error: () => {
                    this._characterDetailLoading.set(false);
                }
            });
    }

    loadPeople(page: number, limit: number, search?: string): void {
        this._personLoading.set(true);

        let params = new HttpParams().set("page", page).set("limit", limit).set("sortBy", "favorites").set("sortOrder", "DESC");
        if (search) params = params.set("search", search);

        this.http
            .get<PaginatedPeople>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.people()}`, { params })
            .subscribe({
                next: (res) => {
                    this._personList.set(res.data);
                    this._personTotal.set(res.total);
                    this._personLoading.set(false);
                },
                error: () => {
                    this._personLoading.set(false);
                }
            });
    }

    loadPersonById(id: number): void {
        this._personDetailLoading.set(true);
        this._personDetail.set(null);

        this.http
            .get<PersonDetail>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.personDetail(id)}`)
            .subscribe({
                next: (detail) => {
                    this._personDetail.set(detail);
                    this._personDetailLoading.set(false);
                },
                error: () => {
                    this._personDetailLoading.set(false);
                }
            });
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
