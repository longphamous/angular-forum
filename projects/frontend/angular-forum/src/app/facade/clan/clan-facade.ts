import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { Observable, tap } from "rxjs";

import { CLAN_ROUTES } from "../../core/api/clan.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type {
    Clan,
    ClanApplication,
    ClanCategory,
    ClanComment,
    ClanMember,
    ClanPage,
    CreateClanPayload,
    PaginatedClans,
    UpdateClanPayload
} from "../../core/models/clan/clan";

@Injectable({ providedIn: "root" })
export class ClanFacade {
    readonly clans: Signal<Clan[]>;
    readonly clanTotal: Signal<number>;
    readonly currentClan: Signal<Clan | null>;
    readonly members: Signal<ClanMember[]>;
    readonly applications: Signal<ClanApplication[]>;
    readonly pages: Signal<ClanPage[]>;
    readonly comments: Signal<ClanComment[]>;
    readonly categories: Signal<ClanCategory[]>;
    readonly myClans: Signal<Clan[]>;
    readonly loading: Signal<boolean>;
    readonly error: Signal<string | null>;

    private readonly _clans = signal<Clan[]>([]);
    private readonly _clanTotal = signal(0);
    private readonly _currentClan = signal<Clan | null>(null);
    private readonly _members = signal<ClanMember[]>([]);
    private readonly _applications = signal<ClanApplication[]>([]);
    private readonly _pages = signal<ClanPage[]>([]);
    private readonly _comments = signal<ClanComment[]>([]);
    private readonly _categories = signal<ClanCategory[]>([]);
    private readonly _myClans = signal<Clan[]>([]);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.clans = this._clans.asReadonly();
        this.clanTotal = this._clanTotal.asReadonly();
        this.currentClan = this._currentClan.asReadonly();
        this.members = this._members.asReadonly();
        this.applications = this._applications.asReadonly();
        this.pages = this._pages.asReadonly();
        this.comments = this._comments.asReadonly();
        this.categories = this._categories.asReadonly();
        this.myClans = this._myClans.asReadonly();
        this.loading = this._loading.asReadonly();
        this.error = this._error.asReadonly();
    }

    // ── Clans ─────────────────────────────────────────────────────────────────

    loadClans(params: Record<string, string | number> = {}): void {
        this._loading.set(true);
        this._error.set(null);
        let httpParams = new HttpParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== "") {
                httpParams = httpParams.set(key, String(value));
            }
        }
        this.http
            .get<PaginatedClans>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.list()}`, { params: httpParams })
            .subscribe({
                next: (res) => {
                    this._clans.set(res.data);
                    this._clanTotal.set(res.total);
                    this._loading.set(false);
                },
                error: () => {
                    this._error.set("Failed to load clans");
                    this._loading.set(false);
                }
            });
    }

    loadClan(id: string): void {
        this._loading.set(true);
        this.http.get<Clan>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.detail(id)}`).subscribe({
            next: (clan) => {
                this._currentClan.set(clan);
                this._loading.set(false);
            },
            error: () => {
                this._error.set("Failed to load clan");
                this._loading.set(false);
            }
        });
    }

    loadMyClans(): void {
        this.http.get<Clan[]>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.my()}`).subscribe({
            next: (clans) => this._myClans.set(clans),
            error: () => this._myClans.set([])
        });
    }

    createClan(payload: CreateClanPayload): Observable<Clan> {
        return this.http.post<Clan>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.list()}`, payload);
    }

    updateClan(id: string, payload: UpdateClanPayload): Observable<Clan> {
        return this.http
            .patch<Clan>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.detail(id)}`, payload)
            .pipe(tap((clan) => this._currentClan.set(clan)));
    }

    deleteClan(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.detail(id)}`);
    }

    // ── Members ───────────────────────────────────────────────────────────────

    loadMembers(clanId: string): void {
        this.http.get<ClanMember[]>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.members(clanId)}`).subscribe({
            next: (data) => this._members.set(data),
            error: () => this._members.set([])
        });
    }

    updateMember(clanId: string, memberId: string, payload: { role: string }): Observable<ClanMember> {
        return this.http.patch<ClanMember>(
            `${this.apiConfig.baseUrl}${CLAN_ROUTES.memberDetail(clanId, memberId)}`,
            payload
        );
    }

    removeMember(clanId: string, memberId: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${CLAN_ROUTES.memberDetail(clanId, memberId)}`
        );
    }

    // ── Join / Leave / Invite ─────────────────────────────────────────────────

    joinClan(clanId: string, message?: string): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.join(clanId)}`, {
            message
        });
    }

    leaveClan(clanId: string): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.leave(clanId)}`, {});
    }

    inviteMember(clanId: string, userId: string): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.invite(clanId)}`, {
            userId
        });
    }

    // ── Applications ──────────────────────────────────────────────────────────

    loadApplications(clanId: string): void {
        this.http.get<ClanApplication[]>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.applications(clanId)}`).subscribe({
            next: (data) => this._applications.set(data),
            error: () => this._applications.set([])
        });
    }

    acceptApplication(clanId: string, appId: string): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${CLAN_ROUTES.acceptApplication(clanId, appId)}`,
            {}
        );
    }

    declineApplication(clanId: string, appId: string): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${CLAN_ROUTES.declineApplication(clanId, appId)}`,
            {}
        );
    }

    // ── Pages ─────────────────────────────────────────────────────────────────

    loadPages(clanId: string): void {
        this.http.get<ClanPage[]>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.pages(clanId)}`).subscribe({
            next: (data) => this._pages.set(data),
            error: () => this._pages.set([])
        });
    }

    createPage(clanId: string, payload: { title: string; content: string }): Observable<ClanPage> {
        return this.http.post<ClanPage>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.pages(clanId)}`, payload);
    }

    updatePage(clanId: string, pageId: string, payload: Record<string, unknown>): Observable<ClanPage> {
        return this.http.patch<ClanPage>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.pageDetail(clanId, pageId)}`, payload);
    }

    deletePage(clanId: string, pageId: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${CLAN_ROUTES.pageDetail(clanId, pageId)}`
        );
    }

    // ── Comments ──────────────────────────────────────────────────────────────

    loadComments(clanId: string): void {
        this.http.get<ClanComment[]>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.comments(clanId)}`).subscribe({
            next: (data) => this._comments.set(data),
            error: () => this._comments.set([])
        });
    }

    addComment(clanId: string, content: string): Observable<ClanComment> {
        return this.http
            .post<ClanComment>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.comments(clanId)}`, { content })
            .pipe(tap((comment) => this._comments.update((list) => [...list, comment])));
    }

    // ── Admin: Categories ─────────────────────────────────────────────────────

    loadCategories(): void {
        this.http.get<ClanCategory[]>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.admin.categories()}`).subscribe({
            next: (data) => this._categories.set(data),
            error: () => this._categories.set([])
        });
    }

    createCategory(payload: { name: string; description?: string; icon?: string }): Observable<ClanCategory> {
        return this.http.post<ClanCategory>(`${this.apiConfig.baseUrl}${CLAN_ROUTES.admin.categories()}`, payload);
    }

    updateCategory(id: string, payload: Record<string, unknown>): Observable<ClanCategory> {
        return this.http.patch<ClanCategory>(
            `${this.apiConfig.baseUrl}${CLAN_ROUTES.admin.categoryDetail(id)}`,
            payload
        );
    }

    deleteCategory(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${CLAN_ROUTES.admin.categoryDetail(id)}`
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    clearCurrentClan(): void {
        this._currentClan.set(null);
        this._members.set([]);
        this._applications.set([]);
        this._pages.set([]);
        this._comments.set([]);
    }
}
