import { HttpClient } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { forkJoin, Observable } from "rxjs";
import { switchMap } from "rxjs/operators";

import { FORUM_ROUTES } from "../../core/api/forum.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { Forum } from "../../core/models/forum/forum";
import { ForumCategory } from "../../core/models/forum/forum-category";

export interface CreateCategoryPayload {
    name: string;
    description?: string;
    position?: number;
}

export interface UpdateCategoryPayload {
    name?: string;
    description?: string;
    position?: number;
    isActive?: boolean;
}

export interface CreateForumPayload {
    name: string;
    description?: string;
    position?: number;
    isLocked?: boolean;
    isPrivate?: boolean;
}

export interface UpdateForumPayload {
    name?: string;
    description?: string;
    position?: number;
    isLocked?: boolean;
    isPrivate?: boolean;
}

export interface AdminStats {
    categoryCount: number;
    forumCount: number;
    threadCount: number;
    postCount: number;
}

@Injectable({ providedIn: "root" })
export class AdminFacade {
    readonly categories: Signal<ForumCategory[]>;
    readonly stats: Signal<AdminStats>;
    readonly loading: Signal<boolean>;
    readonly error: Signal<string | null>;

    private readonly _categories = signal<ForumCategory[]>([]);
    private readonly _stats = signal<AdminStats>({ categoryCount: 0, forumCount: 0, threadCount: 0, postCount: 0 });
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.categories = this._categories.asReadonly();
        this.stats = this._stats.asReadonly();
        this.loading = this._loading.asReadonly();
        this.error = this._error.asReadonly();
    }

    loadCategories(): void {
        this._loading.set(true);
        this._error.set(null);

        this.http
            .get<ForumCategory[]>(`${this.apiConfig.baseUrl}${FORUM_ROUTES.categories.list()}`)
            .pipe(
                switchMap((categories) => {
                    if (categories.length === 0) {
                        return [[] as ForumCategory[]];
                    }
                    return forkJoin(
                        categories.map((cat) =>
                            this.http.get<ForumCategory>(
                                `${this.apiConfig.baseUrl}${FORUM_ROUTES.categories.detail(cat.id)}`
                            )
                        )
                    );
                })
            )
            .subscribe({
                next: (categoriesWithForums) => {
                    this._categories.set(categoriesWithForums);
                    this._computeStats(categoriesWithForums);
                    this._loading.set(false);
                },
                error: () => {
                    this._error.set("Fehler beim Laden der Daten.");
                    this._loading.set(false);
                }
            });
    }

    createCategory(payload: CreateCategoryPayload): Observable<ForumCategory> {
        return this.http.post<ForumCategory>(
            `${this.apiConfig.baseUrl}${FORUM_ROUTES.categories.list()}`,
            payload
        );
    }

    updateCategory(id: string, payload: UpdateCategoryPayload): Observable<ForumCategory> {
        return this.http.patch<ForumCategory>(
            `${this.apiConfig.baseUrl}${FORUM_ROUTES.categories.detail(id)}`,
            payload
        );
    }

    deleteCategory(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${FORUM_ROUTES.categories.detail(id)}`
        );
    }

    createForum(categoryId: string, payload: CreateForumPayload): Observable<Forum> {
        return this.http.post<Forum>(
            `${this.apiConfig.baseUrl}${FORUM_ROUTES.categories.forums(categoryId)}`,
            payload
        );
    }

    updateForum(id: string, payload: UpdateForumPayload): Observable<Forum> {
        return this.http.patch<Forum>(`${this.apiConfig.baseUrl}${FORUM_ROUTES.forums.detail(id)}`, payload);
    }

    deleteForum(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${FORUM_ROUTES.forums.detail(id)}`
        );
    }

    private _computeStats(categories: ForumCategory[]): void {
        let forumCount = 0;
        let threadCount = 0;
        let postCount = 0;

        for (const cat of categories) {
            const forums = cat.forums ?? [];
            forumCount += forums.length;
            for (const f of forums) {
                threadCount += f.threadCount;
                postCount += f.postCount;
            }
        }

        this._stats.set({
            categoryCount: categories.length,
            forumCount,
            threadCount,
            postCount
        });
    }
}
