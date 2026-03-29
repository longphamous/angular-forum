import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { Observable } from "rxjs";

import { TICKET_ROUTES } from "../../core/api/ticket.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type {
    BurndownPoint,
    SlaConfig,
    SlaStatus,
    SprintReport,
    VelocityEntry
} from "../../core/models/ticket/reporting";

@Injectable({ providedIn: "root" })
export class ReportingFacade {
    readonly burndown: Signal<BurndownPoint[]>;
    readonly velocity: Signal<VelocityEntry[]>;
    readonly sprintReport: Signal<SprintReport | null>;
    readonly slaBreaches: Signal<SlaStatus[]>;
    readonly slaConfigs: Signal<SlaConfig[]>;
    readonly loading: Signal<boolean>;

    private readonly _burndown = signal<BurndownPoint[]>([]);
    private readonly _velocity = signal<VelocityEntry[]>([]);
    private readonly _sprintReport = signal<SprintReport | null>(null);
    private readonly _slaBreaches = signal<SlaStatus[]>([]);
    private readonly _slaConfigs = signal<SlaConfig[]>([]);
    private readonly _loading = signal(false);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.burndown = this._burndown.asReadonly();
        this.velocity = this._velocity.asReadonly();
        this.sprintReport = this._sprintReport.asReadonly();
        this.slaBreaches = this._slaBreaches.asReadonly();
        this.slaConfigs = this._slaConfigs.asReadonly();
        this.loading = this._loading.asReadonly();
    }

    loadBurndown(sprintId: string): void {
        this._loading.set(true);
        this.http
            .get<BurndownPoint[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.reports.burndown(sprintId)}`)
            .subscribe({
                next: (data) => {
                    this._burndown.set(data);
                    this._loading.set(false);
                },
                error: () => {
                    this._burndown.set([]);
                    this._loading.set(false);
                }
            });
    }

    loadVelocity(projectId: string): void {
        this.http
            .get<VelocityEntry[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.reports.velocity(projectId)}`)
            .subscribe({
                next: (data) => this._velocity.set(data),
                error: () => this._velocity.set([])
            });
    }

    loadSprintReport(sprintId: string): void {
        this.http.get<SprintReport>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.reports.sprint(sprintId)}`).subscribe({
            next: (data) => this._sprintReport.set(data),
            error: () => this._sprintReport.set(null)
        });
    }

    loadSlaBreaches(projectId: string): void {
        this.http
            .get<SlaStatus[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.reports.slaBreaches(projectId)}`)
            .subscribe({
                next: (data) => this._slaBreaches.set(data),
                error: () => this._slaBreaches.set([])
            });
    }

    loadSlaConfigs(projectId: string): void {
        const params = new HttpParams().set("projectId", projectId);
        this.http
            .get<SlaConfig[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.reports.slaConfigs()}`, { params })
            .subscribe({
                next: (data) => this._slaConfigs.set(data),
                error: () => this._slaConfigs.set([])
            });
    }

    createSlaConfig(payload: {
        projectId: string;
        priority: string;
        firstResponseHours: number;
        resolutionHours: number;
    }): Observable<SlaConfig> {
        return this.http.post<SlaConfig>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.reports.slaConfigs()}`, payload);
    }

    deleteSlaConfig(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(
            `${this.apiConfig.baseUrl}${TICKET_ROUTES.reports.slaConfigDetail(id)}`
        );
    }

    clear(): void {
        this._burndown.set([]);
        this._velocity.set([]);
        this._sprintReport.set(null);
        this._slaBreaches.set([]);
    }
}
