import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable } from "rxjs";

import { LEXICON_ROUTES } from "../../core/api/lexicon.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import {
    CreateArticlePayload,
    CreateCategoryPayload,
    LexiconArticle,
    LexiconArticleVersion,
    LexiconCategory,
    LexiconComment,
    LexiconDetectedTerm,
    LexiconReport,
    LexiconTerms,
    PaginatedArticles
} from "../../core/models/lexicon/lexicon";

@Injectable({ providedIn: "root" })
export class LexiconFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);

    readonly categories = signal<LexiconCategory[]>([]);
    readonly articles = signal<LexiconArticle[]>([]);
    readonly articleTotal = signal(0);
    readonly currentArticle = signal<LexiconArticle | null>(null);
    readonly versions = signal<LexiconArticleVersion[]>([]);
    readonly currentVersion = signal<LexiconArticleVersion | null>(null);
    readonly comments = signal<LexiconComment[]>([]);
    readonly pendingArticles = signal<LexiconArticle[]>([]);
    readonly pendingTotal = signal(0);
    readonly reports = signal<LexiconReport[]>([]);
    readonly terms = signal<LexiconTerms | null>(null);
    readonly loading = signal(false);
    readonly commentsLoading = signal(false);

    private get base(): string {
        return this.config.baseUrl;
    }

    // ── Categories ──────────────────────────────────────────────

    loadCategories(): void {
        this.http.get<LexiconCategory[]>(`${this.base}${LEXICON_ROUTES.categories()}`).subscribe({
            next: (cats) => this.categories.set(cats)
        });
    }

    createCategory(payload: CreateCategoryPayload): Observable<LexiconCategory> {
        return this.http.post<LexiconCategory>(`${this.base}${LEXICON_ROUTES.categories()}`, payload);
    }

    updateCategory(id: string, payload: Partial<CreateCategoryPayload>): Observable<LexiconCategory> {
        return this.http.put<LexiconCategory>(`${this.base}${LEXICON_ROUTES.category(id)}`, payload);
    }

    deleteCategory(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${LEXICON_ROUTES.category(id)}`);
    }

    // ── Articles ────────────────────────────────────────────────

    loadArticles(
        params: {
            categoryId?: string;
            language?: string;
            tag?: string;
            search?: string;
            status?: string;
            limit?: number;
            page?: number;
        } = {}
    ): void {
        this.loading.set(true);
        const q = new URLSearchParams();
        if (params.categoryId) q.set("categoryId", params.categoryId);
        if (params.language) q.set("language", params.language);
        if (params.tag) q.set("tag", params.tag);
        if (params.search) q.set("search", params.search);
        if (params.status) q.set("status", params.status);
        q.set("limit", String(params.limit ?? 20));
        q.set("page", String(params.page ?? 0));
        this.http.get<PaginatedArticles>(`${this.base}${LEXICON_ROUTES.articles()}?${q.toString()}`).subscribe({
            next: (r) => {
                this.articles.set(r.data);
                this.articleTotal.set(r.total);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    loadArticle(slug: string): void {
        this.loading.set(true);
        this.http.get<LexiconArticle>(`${this.base}${LEXICON_ROUTES.article(slug)}`).subscribe({
            next: (a) => {
                this.currentArticle.set(a);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    createArticle(payload: CreateArticlePayload): Observable<LexiconArticle> {
        return this.http.post<LexiconArticle>(`${this.base}${LEXICON_ROUTES.articles()}`, payload);
    }

    updateArticle(id: string, payload: Partial<CreateArticlePayload>): Observable<LexiconArticle> {
        return this.http.patch<LexiconArticle>(`${this.base}${LEXICON_ROUTES.articleById(id)}`, payload);
    }

    deleteArticle(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${LEXICON_ROUTES.articleById(id)}`);
    }

    toggleLock(id: string): Observable<{ id: string; isLocked: boolean }> {
        return this.http.patch<{ id: string; isLocked: boolean }>(`${this.base}${LEXICON_ROUTES.lock(id)}`, {});
    }

    // ── Versions ────────────────────────────────────────────────

    loadVersions(articleId: string): void {
        this.http.get<LexiconArticleVersion[]>(`${this.base}${LEXICON_ROUTES.versions(articleId)}`).subscribe({
            next: (v) => this.versions.set(v)
        });
    }

    loadVersion(articleId: string, versionNumber: number): void {
        this.http
            .get<LexiconArticleVersion>(`${this.base}${LEXICON_ROUTES.version(articleId, versionNumber)}`)
            .subscribe({
                next: (v) => this.currentVersion.set(v)
            });
    }

    restoreVersion(articleId: string, versionNumber: number): Observable<LexiconArticle> {
        return this.http.post<LexiconArticle>(
            `${this.base}${LEXICON_ROUTES.restore(articleId, versionNumber)}`,
            {}
        );
    }

    protectVersion(articleId: string, versionNumber: number): Observable<object> {
        return this.http.patch(`${this.base}${LEXICON_ROUTES.protectVersion(articleId, versionNumber)}`, {});
    }

    // ── Comments ────────────────────────────────────────────────

    loadComments(articleId: string): void {
        this.commentsLoading.set(true);
        this.http.get<LexiconComment[]>(`${this.base}${LEXICON_ROUTES.comments(articleId)}`).subscribe({
            next: (c) => {
                this.comments.set(c);
                this.commentsLoading.set(false);
            },
            error: () => this.commentsLoading.set(false)
        });
    }

    addComment(articleId: string, content: string, parentId?: string): Observable<LexiconComment> {
        return this.http.post<LexiconComment>(`${this.base}${LEXICON_ROUTES.comments(articleId)}`, {
            content,
            parentId
        });
    }

    deleteComment(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${LEXICON_ROUTES.comment(id)}`);
    }

    // ── Moderation ──────────────────────────────────────────────

    loadPending(params: { page?: number; limit?: number; categoryId?: string; language?: string } = {}): void {
        const q = new URLSearchParams();
        if (params.categoryId) q.set("categoryId", params.categoryId);
        if (params.language) q.set("language", params.language);
        q.set("limit", String(params.limit ?? 20));
        q.set("page", String(params.page ?? 0));
        this.http
            .get<PaginatedArticles>(`${this.base}${LEXICON_ROUTES.moderation.pending()}?${q.toString()}`)
            .subscribe({
                next: (r) => {
                    this.pendingArticles.set(r.data);
                    this.pendingTotal.set(r.total);
                }
            });
    }

    approveArticle(id: string): Observable<LexiconArticle> {
        return this.http.patch<LexiconArticle>(`${this.base}${LEXICON_ROUTES.moderation.approve(id)}`, {});
    }

    rejectArticle(id: string, reason?: string): Observable<LexiconArticle> {
        return this.http.patch<LexiconArticle>(`${this.base}${LEXICON_ROUTES.moderation.reject(id)}`, { reason });
    }

    reportArticle(id: string, reason: string): Observable<object> {
        return this.http.post(`${this.base}${LEXICON_ROUTES.report(id)}`, { reason });
    }

    loadReports(): void {
        this.http.get<LexiconReport[]>(`${this.base}${LEXICON_ROUTES.moderation.reports()}`).subscribe({
            next: (r) => this.reports.set(r)
        });
    }

    resolveReport(id: string, status: "resolved" | "dismissed"): Observable<object> {
        return this.http.patch(`${this.base}${LEXICON_ROUTES.moderation.resolveReport(id)}`, { status });
    }

    // ── Terms of Use ────────────────────────────────────────────

    loadTerms(language: string): void {
        this.http.get<LexiconTerms | null>(`${this.base}${LEXICON_ROUTES.terms(language)}`).subscribe({
            next: (t) => this.terms.set(t)
        });
    }

    updateTerms(language: string, content: string): Observable<LexiconTerms> {
        return this.http.put<LexiconTerms>(`${this.base}${LEXICON_ROUTES.terms(language)}`, { content });
    }

    // ── System-wide Linking ─────────────────────────────────────

    detectTerms(text: string): Observable<LexiconDetectedTerm[]> {
        return this.http.post<LexiconDetectedTerm[]>(`${this.base}${LEXICON_ROUTES.detectTerms()}`, { text });
    }

    // ── Search ──────────────────────────────────────────────────

    searchArticles(query: string, language?: string): void {
        this.loading.set(true);
        const q = new URLSearchParams();
        q.set("q", query);
        if (language) q.set("language", language);
        this.http
            .get<LexiconArticle[]>(`${this.base}${LEXICON_ROUTES.search()}?${q.toString()}`)
            .subscribe({
                next: (a) => {
                    this.articles.set(a);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false)
            });
    }
}
