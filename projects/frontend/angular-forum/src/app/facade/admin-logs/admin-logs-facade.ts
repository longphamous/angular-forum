import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";

import { ADMIN_LOGS_ROUTES } from "../../core/api/admin-logs.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type { LogFilter, LogStats, PaginatedLogs } from "../../core/models/admin-logs/admin-logs";

@Injectable({ providedIn: "root" })
export class AdminLogsFacade {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    readonly logs = signal<PaginatedLogs>({ items: [], total: 0, page: 1, limit: 50 });
    readonly stats = signal<LogStats | null>(null);
    readonly loading = signal(false);
    readonly statsLoading = signal(false);

    private get base(): string {
        return this.apiConfig.baseUrl;
    }

    loadLogs(filter: LogFilter = {}): void {
        this.loading.set(true);

        let params = new HttpParams();
        if (filter.level) params = params.set("level", filter.level);
        if (filter.category) params = params.set("category", filter.category);
        if (filter.from) params = params.set("from", filter.from);
        if (filter.to) params = params.set("to", filter.to);
        if (filter.userId) params = params.set("userId", filter.userId);
        if (filter.search) params = params.set("search", filter.search);
        if (filter.page) params = params.set("page", filter.page.toString());
        if (filter.limit) params = params.set("limit", filter.limit.toString());

        this.http.get<PaginatedLogs>(`${this.base}${ADMIN_LOGS_ROUTES.list()}`, { params }).subscribe({
            next: (data) => {
                this.logs.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    loadStats(): void {
        this.statsLoading.set(true);
        this.http.get<LogStats>(`${this.base}${ADMIN_LOGS_ROUTES.stats()}`).subscribe({
            next: (data) => {
                this.stats.set(data);
                this.statsLoading.set(false);
            },
            error: () => this.statsLoading.set(false)
        });
    }

    cleanup(days: number): void {
        const params = new HttpParams().set("days", days.toString());
        this.http.delete(`${this.base}${ADMIN_LOGS_ROUTES.cleanup()}`, { params }).subscribe({
            next: () => {
                this.loadLogs();
                this.loadStats();
            }
        });
    }
}
