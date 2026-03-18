import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable, tap } from "rxjs";

import { CHRONIK_ROUTES } from "../../core/api/chronik.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import {
    ChronikComment,
    ChronikEntry,
    ChronikProfileStats,
    CreateChronikEntry
} from "../../core/models/chronik/chronik";

interface PaginatedEntries {
    items: ChronikEntry[];
    total: number;
}

@Injectable({ providedIn: "root" })
export class ChronikFacade {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    readonly entries = signal<ChronikEntry[]>([]);
    readonly loading = signal(false);
    readonly total = signal(0);
    readonly comments = signal<Map<string, ChronikComment[]>>(new Map());
    readonly commentsLoading = signal<Set<string>>(new Set());
    readonly profileStats = signal<ChronikProfileStats | null>(null);
    readonly profileEntries = signal<ChronikEntry[]>([]);
    readonly profileTotal = signal(0);
    readonly profileLoading = signal(false);
    readonly following = signal<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]>([]);
    readonly followers = signal<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]>([]);

    private currentOffset = 0;
    private currentParams: { userId?: string; feed?: boolean; limit?: number } = {};
    private readonly pageSize = 20;

    loadEntries(params: { userId?: string; feed?: boolean; offset?: number; limit?: number } = {}): void {
        const offset = params.offset ?? 0;
        this.currentOffset = offset;
        this.currentParams = {
            userId: params.userId,
            feed: params.feed,
            limit: params.limit ?? this.pageSize
        };

        this.loading.set(true);
        const query = new URLSearchParams();
        query.set("offset", String(offset));
        query.set("limit", String(this.currentParams.limit ?? this.pageSize));
        if (params.userId) query.set("userId", params.userId);
        if (params.feed) query.set("feed", "true");

        const url = `${this.apiConfig.baseUrl}${CHRONIK_ROUTES.entries}?${query.toString()}`;
        this.http.get<PaginatedEntries>(url).subscribe({
            next: (res) => {
                if (offset === 0) {
                    this.entries.set(res.items);
                } else {
                    this.entries.update((prev) => [...prev, ...res.items]);
                }
                this.total.set(res.total);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            }
        });
    }

    loadMore(): void {
        const newOffset = this.entries().length;
        this.loadEntries({
            ...this.currentParams,
            offset: newOffset
        });
    }

    createEntry(dto: CreateChronikEntry): Observable<ChronikEntry> {
        return this.http.post<ChronikEntry>(`${this.apiConfig.baseUrl}${CHRONIK_ROUTES.entries}`, dto).pipe(
            tap((entry) => {
                this.entries.update((prev) => [entry, ...prev]);
                this.total.update((t) => t + 1);
            })
        );
    }

    deleteEntry(entryId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiConfig.baseUrl}${CHRONIK_ROUTES.entry(entryId)}`).pipe(
            tap(() => {
                this.entries.update((prev) => prev.filter((e) => e.id !== entryId));
                this.total.update((t) => Math.max(0, t - 1));
            })
        );
    }

    toggleLike(entryId: string): Observable<{ liked: boolean; likeCount: number }> {
        // Optimistic update
        this.entries.update((prev) =>
            prev.map((e) =>
                e.id === entryId
                    ? {
                          ...e,
                          isLiked: !e.isLiked,
                          likeCount: e.isLiked ? e.likeCount - 1 : e.likeCount + 1
                      }
                    : e
            )
        );

        return this.http
            .post<{ liked: boolean; likeCount: number }>(`${this.apiConfig.baseUrl}${CHRONIK_ROUTES.like(entryId)}`, {})
            .pipe(
                tap((res) => {
                    this.entries.update((prev) =>
                        prev.map((e) => (e.id === entryId ? { ...e, isLiked: res.liked, likeCount: res.likeCount } : e))
                    );
                })
            );
    }

    hideEntry(entryId: string): Observable<void> {
        // Optimistic update — remove from list
        this.entries.update((prev) => prev.filter((e) => e.id !== entryId));
        this.total.update((t) => Math.max(0, t - 1));

        return this.http.post<void>(`${this.apiConfig.baseUrl}${CHRONIK_ROUTES.hide(entryId)}`, {});
    }

    unhideEntry(entryId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiConfig.baseUrl}${CHRONIK_ROUTES.hide(entryId)}`);
    }

    loadComments(entryId: string): Observable<ChronikComment[]> {
        this.commentsLoading.update((s) => new Set([...s, entryId]));

        return this.http.get<ChronikComment[]>(`${this.apiConfig.baseUrl}${CHRONIK_ROUTES.comments(entryId)}`).pipe(
            tap((result) => {
                this.comments.update((m) => {
                    const next = new Map(m);
                    next.set(entryId, result);
                    return next;
                });
                this.commentsLoading.update((s) => {
                    const next = new Set(s);
                    next.delete(entryId);
                    return next;
                });
            })
        );
    }

    createComment(entryId: string, content: string, parentId?: string): Observable<ChronikComment> {
        return this.http
            .post<ChronikComment>(`${this.apiConfig.baseUrl}${CHRONIK_ROUTES.comments(entryId)}`, {
                content,
                parentId: parentId ?? null
            })
            .pipe(
                tap((comment) => {
                    this.comments.update((m) => {
                        const next = new Map(m);
                        const existing = next.get(entryId) ?? [];
                        if (parentId) {
                            const updated = this.appendReply(existing, parentId, comment);
                            next.set(entryId, updated);
                        } else {
                            next.set(entryId, [...existing, comment]);
                        }
                        return next;
                    });
                    this.entries.update((prev) =>
                        prev.map((e) => (e.id === entryId ? { ...e, commentCount: e.commentCount + 1 } : e))
                    );
                })
            );
    }

    deleteComment(commentId: string, entryId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiConfig.baseUrl}${CHRONIK_ROUTES.deleteComment(commentId)}`).pipe(
            tap(() => {
                this.comments.update((m) => {
                    const next = new Map(m);
                    const existing = next.get(entryId) ?? [];
                    next.set(entryId, this.removeComment(existing, commentId));
                    return next;
                });
                this.entries.update((prev) =>
                    prev.map((e) => (e.id === entryId ? { ...e, commentCount: Math.max(0, e.commentCount - 1) } : e))
                );
            })
        );
    }

    toggleCommentLike(commentId: string, entryId: string): Observable<{ liked: boolean; likeCount: number }> {
        return this.http
            .post<{
                liked: boolean;
                likeCount: number;
            }>(`${this.apiConfig.baseUrl}${CHRONIK_ROUTES.commentLike(commentId)}`, {})
            .pipe(
                tap((res) => {
                    this.comments.update((m) => {
                        const next = new Map(m);
                        const existing = next.get(entryId) ?? [];
                        next.set(entryId, this.updateCommentLike(existing, commentId, res.liked, res.likeCount));
                        return next;
                    });
                })
            );
    }

    toggleFollow(userId: string): Observable<{ following: boolean; followerCount: number }> {
        return this.http.post<{ following: boolean; followerCount: number }>(
            `${this.apiConfig.baseUrl}${CHRONIK_ROUTES.follow(userId)}`,
            {}
        );
    }

    loadFollowing(): void {
        this.http
            .get<
                { id: string; username: string; displayName: string; avatarUrl: string | null }[]
            >(`${this.apiConfig.baseUrl}${CHRONIK_ROUTES.following}`)
            .subscribe({ next: (data) => this.following.set(data) });
    }

    loadFollowers(): void {
        this.http
            .get<
                { id: string; username: string; displayName: string; avatarUrl: string | null }[]
            >(`${this.apiConfig.baseUrl}${CHRONIK_ROUTES.followers}`)
            .subscribe({ next: (data) => this.followers.set(data) });
    }

    loadProfileEntries(userId: string, offset = 0): void {
        this.profileLoading.set(true);
        const query = new URLSearchParams({ userId, offset: String(offset), limit: String(this.pageSize) });
        this.http
            .get<PaginatedEntries>(`${this.apiConfig.baseUrl}${CHRONIK_ROUTES.entries}?${query.toString()}`)
            .subscribe({
                next: (res) => {
                    if (offset === 0) {
                        this.profileEntries.set(res.items);
                    } else {
                        this.profileEntries.update((prev) => [...prev, ...res.items]);
                    }
                    this.profileTotal.set(res.total);
                    this.profileLoading.set(false);
                },
                error: () => this.profileLoading.set(false)
            });
    }

    loadProfileStats(userId: string): void {
        this.http
            .get<ChronikProfileStats>(`${this.apiConfig.baseUrl}${CHRONIK_ROUTES.stats(userId)}`)
            .subscribe({ next: (data) => this.profileStats.set(data) });
    }

    private appendReply(comments: ChronikComment[], parentId: string, reply: ChronikComment): ChronikComment[] {
        return comments.map((c) => {
            if (c.id === parentId) {
                return { ...c, replies: [...(c.replies ?? []), reply] };
            }
            if (c.replies && c.replies.length > 0) {
                return { ...c, replies: this.appendReply(c.replies, parentId, reply) };
            }
            return c;
        });
    }

    private removeComment(comments: ChronikComment[], commentId: string): ChronikComment[] {
        return comments
            .filter((c) => c.id !== commentId)
            .map((c) => ({
                ...c,
                replies: c.replies ? this.removeComment(c.replies, commentId) : []
            }));
    }

    private updateCommentLike(
        comments: ChronikComment[],
        commentId: string,
        liked: boolean,
        likeCount: number
    ): ChronikComment[] {
        return comments.map((c) => {
            if (c.id === commentId) {
                return { ...c, isLiked: liked, likeCount };
            }
            if (c.replies && c.replies.length > 0) {
                return { ...c, replies: this.updateCommentLike(c.replies, commentId, liked, likeCount) };
            }
            return c;
        });
    }
}
