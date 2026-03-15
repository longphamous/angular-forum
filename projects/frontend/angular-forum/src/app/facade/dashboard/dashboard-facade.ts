import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { forkJoin, switchMap } from "rxjs";
import { map } from "rxjs/operators";

import { ANIME_ROUTES } from "../../core/api/anime.routes";
import { DASHBOARD_ROUTES } from "../../core/api/dashboard.routes";
import { FORUM_ROUTES } from "../../core/api/forum.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { Anime, PaginatedAnime } from "../../core/models/anime/anime";
import { Forum } from "../../core/models/forum/forum";
import { ForumCategory } from "../../core/models/forum/forum-category";

export interface ActiveForum extends Forum {
    categoryName: string;
}

export interface DashboardStats {
    animeCount: number;
    postCount: number;
    threadCount: number;
    userCount: number;
}

export interface RecentThread {
    authorName: string;
    forumName: string;
    id: string;
    lastPostAt: string;
    replyCount: number;
    title: string;
}

export interface TopPoster {
    displayName: string;
    postCount: number;
    userId: string;
    username: string;
}

@Injectable({ providedIn: "root" })
export class DashboardFacade {
    readonly activeForums: Signal<ActiveForum[]>;
    readonly error: Signal<string | null>;
    readonly loading: Signal<boolean>;
    readonly newestAnime: Signal<Anime[]>;
    readonly recentThreads: Signal<RecentThread[]>;
    readonly stats: Signal<DashboardStats | null>;
    readonly topPosters: Signal<TopPoster[]>;

    private readonly _activeForums = signal<ActiveForum[]>([]);
    private readonly _error = signal<string | null>(null);
    private readonly _loading = signal(false);
    private readonly _newestAnime = signal<Anime[]>([]);
    private readonly _recentThreads = signal<RecentThread[]>([]);
    private readonly _stats = signal<DashboardStats | null>(null);
    private readonly _topPosters = signal<TopPoster[]>([]);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly http = inject(HttpClient);

    constructor() {
        this.activeForums = this._activeForums.asReadonly();
        this.error = this._error.asReadonly();
        this.loading = this._loading.asReadonly();
        this.newestAnime = this._newestAnime.asReadonly();
        this.recentThreads = this._recentThreads.asReadonly();
        this.stats = this._stats.asReadonly();
        this.topPosters = this._topPosters.asReadonly();
    }

    loadAll(): void {
        this._loading.set(true);
        this._error.set(null);

        const animeParams = new HttpParams().set("sortBy", "id").set("sortOrder", "DESC").set("limit", 5);

        const stats$ = this.http.get<DashboardStats>(`${this.apiConfig.baseUrl}${DASHBOARD_ROUTES.stats()}`);
        const recentThreads$ = this.http.get<RecentThread[]>(
            `${this.apiConfig.baseUrl}${DASHBOARD_ROUTES.recentThreads()}`
        );
        const topPosters$ = this.http.get<TopPoster[]>(`${this.apiConfig.baseUrl}${DASHBOARD_ROUTES.topPosters()}`);
        const newestAnime$ = this.http
            .get<PaginatedAnime>(`${this.apiConfig.baseUrl}${ANIME_ROUTES.list()}`, {
                params: animeParams
            })
            .pipe(map((res) => res.data));

        const activeForums$ = this.http
            .get<ForumCategory[]>(`${this.apiConfig.baseUrl}${FORUM_ROUTES.categories.list()}`)
            .pipe(
                switchMap((categories) => {
                    const categoryDetails$ = categories.map((cat) =>
                        this.http.get<ForumCategory>(
                            `${this.apiConfig.baseUrl}${FORUM_ROUTES.categories.detail(cat.id)}`
                        )
                    );
                    return forkJoin(categoryDetails$).pipe(
                        map((detailedCategories) => {
                            const allForums: ActiveForum[] = [];
                            for (const cat of detailedCategories) {
                                if (cat.forums) {
                                    for (const forum of cat.forums) {
                                        allForums.push({ ...forum, categoryName: cat.name });
                                    }
                                }
                            }
                            return allForums.sort((a, b) => b.threadCount - a.threadCount).slice(0, 5);
                        })
                    );
                })
            );

        forkJoin({
            activeForums: activeForums$,
            newestAnime: newestAnime$,
            recentThreads: recentThreads$,
            stats: stats$,
            topPosters: topPosters$
        }).subscribe({
            next: (results) => {
                this._activeForums.set(results.activeForums);
                this._newestAnime.set(results.newestAnime);
                this._recentThreads.set(results.recentThreads);
                this._stats.set(results.stats);
                this._topPosters.set(results.topPosters);
                this._loading.set(false);
            },
            error: () => {
                this._error.set("Fehler beim Laden der Dashboard-Daten.");
                this._loading.set(false);
            }
        });
    }
}
