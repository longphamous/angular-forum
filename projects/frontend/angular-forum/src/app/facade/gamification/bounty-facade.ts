import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";

import { GAMIFICATION_ROUTES } from "../../core/api/gamification.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type { BountyLeaderboard, WantedPoster } from "../../core/models/gamification/bounty";

@Injectable({ providedIn: "root" })
export class BountyFacade {
    readonly leaderboard: Signal<WantedPoster[]>;
    readonly leaderboardTotal: Signal<number>;
    readonly myPoster: Signal<WantedPoster | null>;
    readonly viewedPoster: Signal<WantedPoster | null>;
    readonly loading: Signal<boolean>;

    private readonly _leaderboard = signal<WantedPoster[]>([]);
    private readonly _leaderboardTotal = signal(0);
    private readonly _myPoster = signal<WantedPoster | null>(null);
    private readonly _viewedPoster = signal<WantedPoster | null>(null);
    private readonly _loading = signal(false);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.leaderboard = this._leaderboard.asReadonly();
        this.leaderboardTotal = this._leaderboardTotal.asReadonly();
        this.myPoster = this._myPoster.asReadonly();
        this.viewedPoster = this._viewedPoster.asReadonly();
        this.loading = this._loading.asReadonly();
    }

    loadLeaderboard(limit = 50, offset = 0): void {
        this._loading.set(true);
        const params = new HttpParams().set("limit", limit).set("offset", offset);
        this.http.get<BountyLeaderboard>(`${this.apiConfig.baseUrl}${GAMIFICATION_ROUTES.bounty.leaderboard()}`, { params }).subscribe({
            next: (res) => {
                this._leaderboard.set(res.data);
                this._leaderboardTotal.set(res.total);
                this._loading.set(false);
            },
            error: () => { this._leaderboard.set([]); this._loading.set(false); }
        });
    }

    loadMyPoster(): void {
        this.http.get<WantedPoster>(`${this.apiConfig.baseUrl}${GAMIFICATION_ROUTES.bounty.me()}`).subscribe({
            next: (poster) => this._myPoster.set(poster),
            error: () => this._myPoster.set(null)
        });
    }

    loadUserPoster(userId: string): void {
        this.http.get<WantedPoster>(`${this.apiConfig.baseUrl}${GAMIFICATION_ROUTES.bounty.user(userId)}`).subscribe({
            next: (poster) => this._viewedPoster.set(poster),
            error: () => this._viewedPoster.set(null)
        });
    }
}
