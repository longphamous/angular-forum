import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { Observable, tap } from "rxjs";

import { TICKET_ROUTES } from "../../core/api/ticket.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type { CreateSprintPayload, Sprint, UpdateSprintPayload } from "../../core/models/ticket/sprint";
import type { PaginatedTickets, Ticket } from "../../core/models/ticket/ticket";

@Injectable({ providedIn: "root" })
export class SprintFacade {
    readonly sprints: Signal<Sprint[]>;
    readonly activeSprint: Signal<Sprint | null>;
    readonly backlog: Signal<Ticket[]>;
    readonly backlogTotal: Signal<number>;
    readonly loading: Signal<boolean>;

    private readonly _sprints = signal<Sprint[]>([]);
    private readonly _activeSprint = signal<Sprint | null>(null);
    private readonly _backlog = signal<Ticket[]>([]);
    private readonly _backlogTotal = signal(0);
    private readonly _loading = signal(false);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.sprints = this._sprints.asReadonly();
        this.activeSprint = this._activeSprint.asReadonly();
        this.backlog = this._backlog.asReadonly();
        this.backlogTotal = this._backlogTotal.asReadonly();
        this.loading = this._loading.asReadonly();
    }

    // ── Sprints ──────────────────────────────────────────────────────────────

    loadSprints(projectId: string): void {
        const params = new HttpParams().set("projectId", projectId);
        this.http.get<Sprint[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.sprints()}`, { params }).subscribe({
            next: (data) => {
                this._sprints.set(data);
                this._activeSprint.set(data.find((s) => s.status === "active") ?? null);
            },
            error: () => this._sprints.set([])
        });
    }

    createSprint(payload: CreateSprintPayload): Observable<Sprint> {
        return this.http.post<Sprint>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.sprints()}`, payload);
    }

    updateSprint(id: string, payload: UpdateSprintPayload): Observable<Sprint> {
        return this.http.patch<Sprint>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.sprintDetail(id)}`, payload);
    }

    deleteSprint(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.sprintDetail(id)}`);
    }

    startSprint(id: string): Observable<Sprint> {
        return this.http.post<Sprint>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.sprintStart(id)}`, {}).pipe(
            tap((sprint) => {
                this._activeSprint.set(sprint);
                this._sprints.update((list) => list.map((s) => (s.id === id ? sprint : s)));
            })
        );
    }

    completeSprint(id: string): Observable<Sprint> {
        return this.http.post<Sprint>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.sprintComplete(id)}`, {}).pipe(
            tap((sprint) => {
                this._activeSprint.set(null);
                this._sprints.update((list) => list.map((s) => (s.id === id ? sprint : s)));
            })
        );
    }

    // ── Backlog ──────────────────────────────────────────────────────────────

    loadBacklog(projectId: string): void {
        this._loading.set(true);
        this.http.get<PaginatedTickets>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.backlog(projectId)}`).subscribe({
            next: (res) => {
                this._backlog.set(res.data);
                this._backlogTotal.set(res.total);
                this._loading.set(false);
            },
            error: () => {
                this._backlog.set([]);
                this._loading.set(false);
            }
        });
    }

    reorderBacklog(projectId: string, ticketIds: string[]): Observable<{ success: boolean }> {
        return this.http.patch<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${TICKET_ROUTES.backlogReorder(projectId)}`,
            { ticketIds }
        );
    }

    moveToSprint(ticketId: string, sprintId: string): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${TICKET_ROUTES.moveToSprint()}`,
            { ticketId, sprintId }
        );
    }

    moveToBacklog(ticketId: string): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${TICKET_ROUTES.moveToBacklog()}`,
            { ticketId }
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    clear(): void {
        this._sprints.set([]);
        this._activeSprint.set(null);
        this._backlog.set([]);
        this._backlogTotal.set(0);
    }
}
