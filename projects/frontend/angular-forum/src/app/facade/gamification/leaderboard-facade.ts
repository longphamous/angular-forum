import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";

import { GAMIFICATION_ROUTES } from "../../core/api/gamification.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type { LeaderboardEntry, LeaderboardResponse } from "../../core/models/gamification/leaderboard";

@Injectable({ providedIn: "root" })
export class LeaderboardFacade {
    readonly entries: Signal<LeaderboardEntry[]>;
    readonly total: Signal<number>;
    readonly loading: Signal<boolean>;

    private readonly _entries = signal<LeaderboardEntry[]>([]);
    private readonly _total = signal(0);
    private readonly _loading = signal(false);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.entries = this._entries.asReadonly();
        this.total = this._total.asReadonly();
        this.loading = this._loading.asReadonly();
    }

    loadLeaderboard(limit = 50, offset = 0): void {
        this._loading.set(true);
        const params = new HttpParams().set("limit", limit).set("offset", offset);
        this.http
            .get<LeaderboardResponse>(`${this.apiConfig.baseUrl}${GAMIFICATION_ROUTES.leaderboard()}`, { params })
            .subscribe({
                next: (res) => {
                    this._entries.set(res.data);
                    this._total.set(res.total);
                    this._loading.set(false);
                },
                error: () => {
                    this._entries.set([]);
                    this._loading.set(false);
                }
            });
    }
}
