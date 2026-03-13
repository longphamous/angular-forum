import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { forkJoin, Observable } from "rxjs";
import { switchMap } from "rxjs/operators";

import { FORUM_ROUTES } from "../../core/api/forum.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { Forum } from "../../core/models/forum/forum";
import { ForumCategory } from "../../core/models/forum/forum-category";
import { PaginatedPosts, Post } from "../../core/models/forum/post";
import { PaginatedThreads, Thread } from "../../core/models/forum/thread";

@Injectable({ providedIn: "root" })
export class ForumFacade {
    readonly categories: Signal<ForumCategory[]>;
    readonly currentForum: Signal<Forum | null>;
    readonly threads: Signal<Thread[]>;
    readonly threadTotal: Signal<number>;
    readonly currentThread: Signal<Thread | null>;
    readonly posts: Signal<Post[]>;
    readonly postTotal: Signal<number>;
    readonly loading: Signal<boolean>;
    readonly error: Signal<string | null>;

    private readonly _categories = signal<ForumCategory[]>([]);
    private readonly _currentForum = signal<Forum | null>(null);
    private readonly _threads = signal<Thread[]>([]);
    private readonly _threadTotal = signal(0);
    private readonly _currentThread = signal<Thread | null>(null);
    private readonly _posts = signal<Post[]>([]);
    private readonly _postTotal = signal(0);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.categories = this._categories.asReadonly();
        this.currentForum = this._currentForum.asReadonly();
        this.threads = this._threads.asReadonly();
        this.threadTotal = this._threadTotal.asReadonly();
        this.currentThread = this._currentThread.asReadonly();
        this.posts = this._posts.asReadonly();
        this.postTotal = this._postTotal.asReadonly();
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
                    this._loading.set(false);
                },
                error: () => {
                    this._error.set("Fehler beim Laden der Kategorien.");
                    this._loading.set(false);
                }
            });
    }

    loadForum(id: string): void {
        this._loading.set(true);
        this._error.set(null);

        this.http.get<Forum>(`${this.apiConfig.baseUrl}${FORUM_ROUTES.forums.detail(id)}`).subscribe({
            next: (forum) => {
                this._currentForum.set(forum);
                this._loading.set(false);
            },
            error: () => {
                this._error.set("Fehler beim Laden des Forums.");
                this._loading.set(false);
            }
        });
    }

    loadThreads(forumId: string, page: number, limit: number): void {
        this._loading.set(true);
        this._error.set(null);

        const params = new HttpParams().set("page", page).set("limit", limit);

        this.http
            .get<PaginatedThreads>(`${this.apiConfig.baseUrl}${FORUM_ROUTES.forums.threads(forumId)}`, { params })
            .subscribe({
                next: (res) => {
                    this._threads.set(res.data);
                    this._threadTotal.set(res.total);
                    this._loading.set(false);
                },
                error: () => {
                    this._error.set("Fehler beim Laden der Threads.");
                    this._loading.set(false);
                }
            });
    }

    loadThread(id: string): void {
        this._loading.set(true);
        this._error.set(null);

        this.http.get<Thread>(`${this.apiConfig.baseUrl}${FORUM_ROUTES.threads.detail(id)}`).subscribe({
            next: (thread) => {
                this._currentThread.set(thread);
                this._loading.set(false);
            },
            error: () => {
                this._error.set("Fehler beim Laden des Threads.");
                this._loading.set(false);
            }
        });
    }

    loadPosts(threadId: string, page: number, limit: number): void {
        this._loading.set(true);
        this._error.set(null);

        const params = new HttpParams().set("page", page).set("limit", limit);

        this.http
            .get<PaginatedPosts>(`${this.apiConfig.baseUrl}${FORUM_ROUTES.threads.posts(threadId)}`, { params })
            .subscribe({
                next: (res) => {
                    this._posts.set(res.data);
                    this._postTotal.set(res.total);
                    this._loading.set(false);
                },
                error: () => {
                    this._error.set("Fehler beim Laden der Beiträge.");
                    this._loading.set(false);
                }
            });
    }

    createThread(forumId: string, title: string, content: string, tags: string[] = []): Observable<Thread> {
        return this.http.post<Thread>(`${this.apiConfig.baseUrl}${FORUM_ROUTES.forums.threads(forumId)}`, {
            title,
            content,
            tags
        });
    }

    createPost(threadId: string, content: string): Observable<Post> {
        return this.http.post<Post>(`${this.apiConfig.baseUrl}${FORUM_ROUTES.threads.posts(threadId)}`, { content });
    }

    reactToPost(postId: string): Observable<void> {
        return this.http.post<void>(
            `${this.apiConfig.baseUrl}${FORUM_ROUTES.posts.react(postId)}`,
            { reactionType: "heart" }
        );
    }

    unreactToPost(postId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiConfig.baseUrl}${FORUM_ROUTES.posts.react(postId)}`);
    }

    resetError(): void {
        this._error.set(null);
    }
}
