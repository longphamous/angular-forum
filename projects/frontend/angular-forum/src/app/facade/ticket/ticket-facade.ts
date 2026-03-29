import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { Observable, tap } from "rxjs";

import { TICKET_ROUTES } from "../../core/api/ticket.routes";
import { USER_ROUTES } from "../../core/api/user.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type { CreateWorkflowPayload, UpdateWorkflowPayload, Workflow } from "../../core/models/ticket/board";
import type {
    Attachment,
    CreateCommentPayload,
    CreateLinkPayload,
    CreateTicketPayload,
    CreateWorkLogPayload,
    PaginatedActivity,
    PaginatedTickets,
    Ticket,
    TicketActivity,
    TicketCategory,
    TicketComment,
    TicketLabel,
    TicketLink,
    TicketProject,
    TicketStats,
    UpdateTicketPayload,
    Watcher,
    WorkLog
} from "../../core/models/ticket/ticket";
import type { UserProfile } from "../../core/models/user/user";

@Injectable({ providedIn: "root" })
export class TicketFacade {
    readonly tickets: Signal<Ticket[]>;
    readonly ticketTotal: Signal<number>;
    readonly currentTicket: Signal<Ticket | null>;
    readonly comments: Signal<TicketComment[]>;
    readonly children: Signal<Ticket[]>;
    readonly links: Signal<TicketLink[]>;
    readonly activityLog: Signal<TicketActivity[]>;
    readonly watchers: Signal<Watcher[]>;
    readonly attachments: Signal<Attachment[]>;
    readonly workLogs: Signal<WorkLog[]>;
    readonly stats: Signal<TicketStats | null>;
    readonly projects: Signal<TicketProject[]>;
    readonly categories: Signal<TicketCategory[]>;
    readonly labels: Signal<TicketLabel[]>;
    readonly workflows: Signal<Workflow[]>;
    readonly assignableUsers: Signal<UserProfile[]>;
    readonly loading: Signal<boolean>;
    readonly error: Signal<string | null>;

    private readonly _tickets = signal<Ticket[]>([]);
    private readonly _ticketTotal = signal(0);
    private readonly _currentTicket = signal<Ticket | null>(null);
    private readonly _comments = signal<TicketComment[]>([]);
    private readonly _children = signal<Ticket[]>([]);
    private readonly _links = signal<TicketLink[]>([]);
    private readonly _activityLog = signal<TicketActivity[]>([]);
    private readonly _watchers = signal<Watcher[]>([]);
    private readonly _attachments = signal<Attachment[]>([]);
    private readonly _workLogs = signal<WorkLog[]>([]);
    private readonly _stats = signal<TicketStats | null>(null);
    private readonly _projects = signal<TicketProject[]>([]);
    private readonly _categories = signal<TicketCategory[]>([]);
    private readonly _labels = signal<TicketLabel[]>([]);
    private readonly _workflows = signal<Workflow[]>([]);
    private readonly _assignableUsers = signal<UserProfile[]>([]);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.tickets = this._tickets.asReadonly();
        this.ticketTotal = this._ticketTotal.asReadonly();
        this.currentTicket = this._currentTicket.asReadonly();
        this.comments = this._comments.asReadonly();
        this.children = this._children.asReadonly();
        this.links = this._links.asReadonly();
        this.activityLog = this._activityLog.asReadonly();
        this.watchers = this._watchers.asReadonly();
        this.attachments = this._attachments.asReadonly();
        this.workLogs = this._workLogs.asReadonly();
        this.stats = this._stats.asReadonly();
        this.projects = this._projects.asReadonly();
        this.categories = this._categories.asReadonly();
        this.labels = this._labels.asReadonly();
        this.workflows = this._workflows.asReadonly();
        this.assignableUsers = this._assignableUsers.asReadonly();
        this.loading = this._loading.asReadonly();
        this.error = this._error.asReadonly();
    }

    // ── Tickets ────────────────────────────────────────────────────────────────

    loadTickets(params: Record<string, string | number> = {}): void {
        this._loading.set(true);
        this._error.set(null);
        let httpParams = new HttpParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== "") {
                httpParams = httpParams.set(key, String(value));
            }
        }
        this.http
            .get<PaginatedTickets>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.list()}`, { params: httpParams })
            .subscribe({
                next: (res) => {
                    this._tickets.set(res.data);
                    this._ticketTotal.set(res.total);
                    this._loading.set(false);
                },
                error: () => {
                    this._error.set("Failed to load tickets");
                    this._loading.set(false);
                }
            });
    }

    loadTicket(id: string): void {
        this._loading.set(true);
        this.http.get<Ticket>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.detail(id)}`).subscribe({
            next: (ticket) => {
                this._currentTicket.set(ticket);
                this._loading.set(false);
            },
            error: () => {
                this._error.set("Failed to load ticket");
                this._loading.set(false);
            }
        });
    }

    createTicket(payload: CreateTicketPayload): Observable<Ticket> {
        return this.http.post<Ticket>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.list()}`, payload);
    }

    updateTicket(id: string, payload: UpdateTicketPayload): Observable<Ticket> {
        return this.http
            .patch<Ticket>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.detail(id)}`, payload)
            .pipe(tap((ticket) => this._currentTicket.set(ticket)));
    }

    deleteTicket(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.detail(id)}`);
    }

    loadStats(projectId?: string): void {
        let httpParams = new HttpParams();
        if (projectId) httpParams = httpParams.set("projectId", projectId);
        this.http
            .get<TicketStats>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.stats()}`, { params: httpParams })
            .subscribe({
                next: (stats) => this._stats.set(stats),
                error: () => this._stats.set(null)
            });
    }

    // ── Children ─────────────────────────────────────────────────────────────

    loadChildren(ticketId: string): void {
        this.http.get<Ticket[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.children(ticketId)}`).subscribe({
            next: (data) => this._children.set(data),
            error: () => this._children.set([])
        });
    }

    // ── Links ────────────────────────────────────────────────────────────────

    loadLinks(ticketId: string): void {
        this.http.get<TicketLink[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.links(ticketId)}`).subscribe({
            next: (data) => this._links.set(data),
            error: () => this._links.set([])
        });
    }

    createLink(ticketId: string, payload: CreateLinkPayload): Observable<TicketLink> {
        return this.http
            .post<TicketLink>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.links(ticketId)}`, payload)
            .pipe(tap((link) => this._links.update((list) => [...list, link])));
    }

    deleteLink(ticketId: string, linkId: string): Observable<{ success: boolean }> {
        return this.http
            .delete<{ success: boolean }>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.linkDetail(ticketId, linkId)}`)
            .pipe(tap(() => this._links.update((list) => list.filter((l) => l.id !== linkId))));
    }

    // ── Activity ─────────────────────────────────────────────────────────────

    loadActivity(ticketId: string): void {
        this.http.get<PaginatedActivity>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.activity(ticketId)}`).subscribe({
            next: (res) => this._activityLog.set(res.data),
            error: () => this._activityLog.set([])
        });
    }

    // ── Comments ───────────────────────────────────────────────────────────────

    loadComments(ticketId: string): void {
        this.http.get<TicketComment[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.comments(ticketId)}`).subscribe({
            next: (comments) => this._comments.set(comments),
            error: () => this._comments.set([])
        });
    }

    addComment(ticketId: string, payload: CreateCommentPayload): Observable<TicketComment> {
        return this.http
            .post<TicketComment>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.comments(ticketId)}`, payload)
            .pipe(tap((comment) => this._comments.update((list) => [...list, comment])));
    }

    // ── Assignable Users ───────────────────────────────────────────────────

    loadAssignableUsers(): void {
        this.http.get<UserProfile[]>(`${this.apiConfig.baseUrl}${USER_ROUTES.admin.list()}`).subscribe({
            next: (users) => this._assignableUsers.set(users),
            error: () => this._assignableUsers.set([])
        });
    }

    // ── Watchers ─────────────────────────────────────────────────────────────

    loadWatchers(ticketId: string): void {
        this.http.get<Watcher[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.watchers(ticketId)}`).subscribe({
            next: (data) => this._watchers.set(data),
            error: () => this._watchers.set([])
        });
    }

    watch(ticketId: string): Observable<{ success: boolean }> {
        return this.http
            .post<{ success: boolean }>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.watch(ticketId)}`, {})
            .pipe(tap(() => this.loadWatchers(ticketId)));
    }

    unwatch(ticketId: string): Observable<{ success: boolean }> {
        return this.http
            .delete<{ success: boolean }>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.watch(ticketId)}`)
            .pipe(tap(() => this.loadWatchers(ticketId)));
    }

    // ── Attachments ──────────────────────────────────────────────────────────

    loadAttachments(ticketId: string): void {
        this.http.get<Attachment[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.attachments(ticketId)}`).subscribe({
            next: (data) => this._attachments.set(data),
            error: () => this._attachments.set([])
        });
    }

    addAttachment(
        ticketId: string,
        file: { fileName: string; filePath: string; fileSize: number; mimeType?: string }
    ): Observable<Attachment> {
        return this.http
            .post<Attachment>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.attachments(ticketId)}`, file)
            .pipe(tap((a) => this._attachments.update((list) => [a, ...list])));
    }

    deleteAttachment(ticketId: string, attachId: string): Observable<{ success: boolean }> {
        return this.http
            .delete<{
                success: boolean;
            }>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.attachmentDetail(ticketId, attachId)}`)
            .pipe(tap(() => this._attachments.update((list) => list.filter((a) => a.id !== attachId))));
    }

    // ── Work Logs ────────────────────────────────────────────────────────────

    loadWorkLogs(ticketId: string): void {
        this.http.get<WorkLog[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.worklogs(ticketId)}`).subscribe({
            next: (data) => this._workLogs.set(data),
            error: () => this._workLogs.set([])
        });
    }

    addWorkLog(ticketId: string, payload: CreateWorkLogPayload): Observable<WorkLog> {
        return this.http
            .post<WorkLog>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.worklogs(ticketId)}`, payload)
            .pipe(tap((log) => this._workLogs.update((list) => [log, ...list])));
    }

    deleteWorkLog(ticketId: string, logId: string): Observable<{ success: boolean }> {
        return this.http
            .delete<{ success: boolean }>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.worklogDetail(ticketId, logId)}`)
            .pipe(tap(() => this._workLogs.update((list) => list.filter((l) => l.id !== logId))));
    }

    // ── Admin: Projects ────────────────────────────────────────────────────────

    loadProjects(): void {
        this.http.get<TicketProject[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.projects()}`).subscribe({
            next: (data) => this._projects.set(data),
            error: () => this._projects.set([])
        });
    }

    createProject(payload: {
        name: string;
        description?: string;
        startDate?: string;
        endDate?: string;
    }): Observable<TicketProject> {
        return this.http.post<TicketProject>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.projects()}`, payload);
    }

    updateProject(id: string, payload: Record<string, unknown>): Observable<TicketProject> {
        return this.http.patch<TicketProject>(
            `${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.projectDetail(id)}`,
            payload
        );
    }

    deleteProject(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.projectDetail(id)}`
        );
    }

    // ── Admin: Categories ──────────────────────────────────────────────────────

    loadCategories(): void {
        this.http.get<TicketCategory[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.categories()}`).subscribe({
            next: (data) => this._categories.set(data),
            error: () => this._categories.set([])
        });
    }

    createCategory(payload: {
        name: string;
        description?: string;
        icon?: string;
        color?: string;
    }): Observable<TicketCategory> {
        return this.http.post<TicketCategory>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.categories()}`, payload);
    }

    updateCategory(id: string, payload: Record<string, unknown>): Observable<TicketCategory> {
        return this.http.patch<TicketCategory>(
            `${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.categoryDetail(id)}`,
            payload
        );
    }

    deleteCategory(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.categoryDetail(id)}`
        );
    }

    // ── Admin: Labels ──────────────────────────────────────────────────────────

    loadLabels(): void {
        this.http.get<TicketLabel[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.labels()}`).subscribe({
            next: (data) => this._labels.set(data),
            error: () => this._labels.set([])
        });
    }

    createLabel(payload: { name: string; color: string; categoryId?: string }): Observable<TicketLabel> {
        return this.http.post<TicketLabel>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.labels()}`, payload);
    }

    updateLabel(id: string, payload: Record<string, unknown>): Observable<TicketLabel> {
        return this.http.patch<TicketLabel>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.labelDetail(id)}`, payload);
    }

    deleteLabel(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.labelDetail(id)}`
        );
    }

    // ── Admin: Workflows ──────────────────────────────────────────────────────

    loadWorkflows(projectId?: string): void {
        let params = new HttpParams();
        if (projectId) params = params.set("projectId", projectId);
        this.http.get<Workflow[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.workflows()}`, { params }).subscribe({
            next: (data) => this._workflows.set(data),
            error: () => this._workflows.set([])
        });
    }

    createWorkflow(payload: CreateWorkflowPayload): Observable<Workflow> {
        return this.http.post<Workflow>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.workflows()}`, payload);
    }

    seedDefaultWorkflow(projectId?: string): Observable<Workflow> {
        let params = new HttpParams();
        if (projectId) params = params.set("projectId", projectId);
        return this.http.post<Workflow>(
            `${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.seedDefaultWorkflow()}`,
            {},
            { params }
        );
    }

    updateWorkflow(id: string, payload: UpdateWorkflowPayload): Observable<Workflow> {
        return this.http.patch<Workflow>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.workflowDetail(id)}`, payload);
    }

    deleteWorkflow(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${TICKET_ROUTES.admin.workflowDetail(id)}`
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    clearCurrentTicket(): void {
        this._currentTicket.set(null);
        this._comments.set([]);
        this._children.set([]);
        this._links.set([]);
        this._activityLog.set([]);
        this._watchers.set([]);
        this._attachments.set([]);
        this._workLogs.set([]);
    }
}
