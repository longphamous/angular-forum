import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable } from "rxjs";

import { LINK_ROUTES } from "../../core/api/link-database.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import {
    CreateCategoryPayload,
    CreateLinkPayload,
    LinkCategory,
    LinkComment,
    LinkEntry,
    LinkListResult,
    LinkSortBy
} from "../../core/models/link-database/link-database";

@Injectable({ providedIn: "root" })
export class LinkDatabaseFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);

    readonly categories = signal<LinkCategory[]>([]);
    readonly links = signal<LinkEntry[]>([]);
    readonly total = signal(0);
    readonly selectedLink = signal<LinkEntry | null>(null);
    readonly comments = signal<LinkComment[]>([]);
    readonly pendingLinks = signal<LinkEntry[]>([]);
    readonly loading = signal(false);
    readonly commentsLoading = signal(false);

    private get base(): string {
        return this.config.baseUrl;
    }

    loadCategories(): void {
        this.http.get<LinkCategory[]>(`${this.base}${LINK_ROUTES.categories()}`).subscribe({
            next: (cats) => this.categories.set(cats)
        });
    }

    loadLinks(
        params: {
            categoryId?: string;
            tag?: string;
            search?: string;
            sortBy?: LinkSortBy;
            limit?: number;
            offset?: number;
        } = {}
    ): void {
        this.loading.set(true);
        const q = new URLSearchParams();
        if (params.categoryId) q.set("categoryId", params.categoryId);
        if (params.tag) q.set("tag", params.tag);
        if (params.search) q.set("search", params.search);
        if (params.sortBy) q.set("sortBy", params.sortBy);
        q.set("limit", String(params.limit ?? 20));
        q.set("offset", String(params.offset ?? 0));
        this.http.get<LinkListResult>(`${this.base}${LINK_ROUTES.links()}?${q.toString()}`).subscribe({
            next: (r) => {
                this.links.set(r.items);
                this.total.set(r.total);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    loadLink(id: string): void {
        this.loading.set(true);
        this.http.get<LinkEntry>(`${this.base}${LINK_ROUTES.link(id)}`).subscribe({
            next: (l) => {
                this.selectedLink.set(l);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    loadComments(linkId: string): void {
        this.commentsLoading.set(true);
        this.http.get<LinkComment[]>(`${this.base}${LINK_ROUTES.comments(linkId)}`).subscribe({
            next: (c) => {
                this.comments.set(c);
                this.commentsLoading.set(false);
            },
            error: () => this.commentsLoading.set(false)
        });
    }

    loadPending(): void {
        this.http.get<LinkEntry[]>(`${this.base}${LINK_ROUTES.pending()}`).subscribe({
            next: (l) => this.pendingLinks.set(l)
        });
    }

    createLink(payload: CreateLinkPayload): Observable<LinkEntry> {
        return this.http.post<LinkEntry>(`${this.base}${LINK_ROUTES.links()}`, payload);
    }

    updateLink(id: string, payload: Partial<CreateLinkPayload>): Observable<LinkEntry> {
        return this.http.put<LinkEntry>(`${this.base}${LINK_ROUTES.link(id)}`, payload);
    }

    deleteLink(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${LINK_ROUTES.link(id)}`);
    }

    rateLink(id: string, score: number): Observable<void> {
        return this.http.post<void>(`${this.base}${LINK_ROUTES.rate(id)}`, { score });
    }

    addComment(linkId: string, content: string): Observable<LinkComment> {
        return this.http.post<LinkComment>(`${this.base}${LINK_ROUTES.comments(linkId)}`, { content });
    }

    deleteComment(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${LINK_ROUTES.comment(id)}`);
    }

    approveLink(id: string): Observable<LinkEntry> {
        return this.http.patch<LinkEntry>(`${this.base}${LINK_ROUTES.approve(id)}`, {});
    }

    rejectLink(id: string, reason?: string): Observable<LinkEntry> {
        return this.http.patch<LinkEntry>(`${this.base}${LINK_ROUTES.reject(id)}`, { reason });
    }

    createCategory(payload: CreateCategoryPayload): Observable<LinkCategory> {
        return this.http.post<LinkCategory>(`${this.base}${LINK_ROUTES.adminCategories()}`, payload);
    }

    updateCategory(id: string, payload: Partial<CreateCategoryPayload>): Observable<LinkCategory> {
        return this.http.put<LinkCategory>(`${this.base}${LINK_ROUTES.adminCategory(id)}`, payload);
    }

    deleteCategory(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${LINK_ROUTES.adminCategory(id)}`);
    }
}
