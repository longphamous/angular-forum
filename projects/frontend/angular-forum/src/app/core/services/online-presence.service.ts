import { HttpClient } from "@angular/common/http";
import { inject, Injectable, OnDestroy, signal } from "@angular/core";

import { API_CONFIG, ApiConfig } from "../config/api.config";

@Injectable({ providedIn: "root" })
export class OnlinePresenceService implements OnDestroy {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    private readonly _onlineIds = signal<Set<string>>(new Set());
    private timer: ReturnType<typeof setInterval> | null = null;
    private initialized = false;

    /** Check if a user is currently online */
    isOnline(userId: string): boolean {
        return this._onlineIds().has(userId);
    }

    /** Start periodic polling (call once from app root or first consumer) */
    init(): void {
        if (this.initialized) return;
        this.initialized = true;
        this.refresh();
        this.timer = setInterval(() => this.refresh(), 60_000);
    }

    ngOnDestroy(): void {
        if (this.timer) clearInterval(this.timer);
    }

    private refresh(): void {
        this.http.get<string[]>(`${this.apiConfig.baseUrl}/user/online-ids`).subscribe({
            next: (ids) => this._onlineIds.set(new Set(ids)),
            error: () => undefined
        });
    }
}
