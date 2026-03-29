import { HttpClient } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";

import { TICKET_ROUTES } from "../../core/api/ticket.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type { RoadmapEpic } from "../../core/models/ticket/roadmap";

@Injectable({ providedIn: "root" })
export class RoadmapFacade {
    readonly epics: Signal<RoadmapEpic[]>;
    readonly loading: Signal<boolean>;

    private readonly _epics = signal<RoadmapEpic[]>([]);
    private readonly _loading = signal(false);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.epics = this._epics.asReadonly();
        this.loading = this._loading.asReadonly();
    }

    loadRoadmap(projectId: string): void {
        this._loading.set(true);
        this.http.get<RoadmapEpic[]>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.roadmap(projectId)}`).subscribe({
            next: (data) => { this._epics.set(data); this._loading.set(false); },
            error: () => { this._epics.set([]); this._loading.set(false); }
        });
    }

    clear(): void {
        this._epics.set([]);
    }
}
