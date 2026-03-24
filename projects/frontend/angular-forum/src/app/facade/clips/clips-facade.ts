import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable, tap } from "rxjs";

import { CLIPS_ROUTES } from "../../core/api/clips.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import {
    AuthorStats,
    Clip,
    ClipComment,
    ClipStats,
    CreateClipPayload,
    PaginatedClips,
    RecommendationSignals,
    TrackViewPayload,
    TrendingClip
} from "../../core/models/clips/clips";

@Injectable({ providedIn: "root" })
export class ClipsFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);

    readonly clips = signal<Clip[]>([]);
    readonly clipTotal = signal(0);
    readonly currentClip = signal<Clip | null>(null);
    readonly comments = signal<ClipComment[]>([]);
    readonly loading = signal(false);
    readonly commentsLoading = signal(false);

    private get base(): string {
        return this.config.baseUrl;
    }

    // ── Feed ──────────────────────────────────────────────────────

    loadFeed(page = 1, limit = 10): void {
        this.loading.set(true);
        this.http
            .get<PaginatedClips>(`${this.base}${CLIPS_ROUTES.feed()}`, {
                params: { page, limit }
            })
            .subscribe({
                next: (res) => {
                    this.clips.set(res.data);
                    this.clipTotal.set(res.total);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false)
            });
    }

    loadMore(page: number, limit = 10): void {
        this.loading.set(true);
        this.http
            .get<PaginatedClips>(`${this.base}${CLIPS_ROUTES.feed()}`, {
                params: { page, limit }
            })
            .subscribe({
                next: (res) => {
                    this.clips.update((existing) => [...existing, ...res.data]);
                    this.clipTotal.set(res.total);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false)
            });
    }

    // ── Single Clip ───────────────────────────────────────────────

    loadClip(id: string): void {
        this.loading.set(true);
        this.http.get<Clip>(`${this.base}${CLIPS_ROUTES.clip(id)}`).subscribe({
            next: (clip) => {
                this.currentClip.set(clip);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    // ── User Clips ────────────────────────────────────────────────

    loadUserClips(userId: string, page = 1, limit = 20): void {
        this.loading.set(true);
        this.http
            .get<PaginatedClips>(`${this.base}${CLIPS_ROUTES.userClips(userId)}`, {
                params: { page, limit }
            })
            .subscribe({
                next: (res) => {
                    this.clips.set(res.data);
                    this.clipTotal.set(res.total);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false)
            });
    }

    // ── CRUD ──────────────────────────────────────────────────────

    createClip(payload: CreateClipPayload): Observable<Clip> {
        return this.http.post<Clip>(`${this.base}${CLIPS_ROUTES.create()}`, payload);
    }

    deleteClip(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${CLIPS_ROUTES.delete(id)}`);
    }

    // ── Interactions ──────────────────────────────────────────────

    toggleLike(clipId: string): Observable<object> {
        // Optimistic update
        this.clips.update((clips) =>
            clips.map((c) =>
                c.id === clipId ? { ...c, isLiked: !c.isLiked, likeCount: c.likeCount + (c.isLiked ? -1 : 1) } : c
            )
        );
        if (this.currentClip()?.id === clipId) {
            const c = this.currentClip()!;
            this.currentClip.set({ ...c, isLiked: !c.isLiked, likeCount: c.likeCount + (c.isLiked ? -1 : 1) });
        }
        return this.http.post(`${this.base}${CLIPS_ROUTES.like(clipId)}`, {});
    }

    incrementView(clipId: string): void {
        this.http.post(`${this.base}${CLIPS_ROUTES.view(clipId)}`, {}).subscribe();
    }

    incrementShare(clipId: string): Observable<object> {
        return this.http.post(`${this.base}${CLIPS_ROUTES.share(clipId)}`, {});
    }

    toggleFollow(clipId: string): Observable<object> {
        return this.http.post(`${this.base}${CLIPS_ROUTES.follow(clipId)}`, {});
    }

    // ── Comments ──────────────────────────────────────────────────

    loadComments(clipId: string): void {
        this.commentsLoading.set(true);
        this.http.get<ClipComment[]>(`${this.base}${CLIPS_ROUTES.comments(clipId)}`).subscribe({
            next: (c) => {
                this.comments.set(c);
                this.commentsLoading.set(false);
            },
            error: () => this.commentsLoading.set(false)
        });
    }

    addComment(clipId: string, content: string, parentId?: string): Observable<ClipComment> {
        return this.http.post<ClipComment>(`${this.base}${CLIPS_ROUTES.comments(clipId)}`, {
            content,
            parentId
        });
    }

    deleteComment(commentId: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${CLIPS_ROUTES.comment(commentId)}`);
    }

    // ── Stats ────────────────────────────────────────────────────

    trackView(clipId: string, payload: TrackViewPayload): void {
        this.http.post(`${this.base}${CLIPS_ROUTES.statsTrackView(clipId)}`, payload).subscribe();
    }

    loadClipStats(clipId: string): Observable<ClipStats> {
        return this.http.get<ClipStats>(`${this.base}${CLIPS_ROUTES.statsClip(clipId)}`);
    }

    loadAuthorStats(authorId: string): Observable<AuthorStats> {
        return this.http.get<AuthorStats>(`${this.base}${CLIPS_ROUTES.statsAuthor(authorId)}`);
    }

    loadTrending(limit = 10): Observable<TrendingClip[]> {
        return this.http.get<TrendingClip[]>(`${this.base}${CLIPS_ROUTES.statsTrending()}`, {
            params: { limit }
        });
    }

    loadRecommendationSignals(clipId: string): Observable<RecommendationSignals> {
        return this.http.get<RecommendationSignals>(`${this.base}${CLIPS_ROUTES.statsRecommendation(clipId)}`);
    }
}
