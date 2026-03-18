import { HttpClient } from "@angular/common/http";
import { inject, Injectable, OnDestroy, signal } from "@angular/core";
import { Subscription } from "rxjs";

import { API_CONFIG, ApiConfig } from "../config/api.config";
import { PushPresenceUserOffline, PushPresenceUserOnline } from "../models/push/push-events";
import { PushService } from "./push.service";

@Injectable({ providedIn: "root" })
export class OnlinePresenceService implements OnDestroy {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly pushService = inject(PushService);

    private readonly _onlineIds = signal<Set<string>>(new Set());
    private readonly subs: Subscription[] = [];
    private initialized = false;

    /** Check if a user is currently online. */
    isOnline(userId: string): boolean {
        return this._onlineIds().has(userId);
    }

    /** Initialize presence tracking (call once from app root or first consumer). */
    init(): void {
        if (this.initialized) return;
        this.initialized = true;

        // Bootstrap: fetch current online list via HTTP
        this.refresh();

        // Real-time updates via WebSocket (no more polling)
        this.subs.push(
            this.pushService.on<PushPresenceUserOnline>("presence:userOnline").subscribe((ev) => {
                this._onlineIds.update((ids) => {
                    const next = new Set(ids);
                    next.add(ev.userId);
                    return next;
                });
            }),
            this.pushService.on<PushPresenceUserOffline>("presence:userOffline").subscribe((ev) => {
                this._onlineIds.update((ids) => {
                    const next = new Set(ids);
                    next.delete(ev.userId);
                    return next;
                });
            })
        );
    }

    ngOnDestroy(): void {
        this.subs.forEach((s) => s.unsubscribe());
    }

    private refresh(): void {
        this.http.get<string[]>(`${this.apiConfig.baseUrl}/user/online-ids`).subscribe({
            next: (ids) => this._onlineIds.set(new Set(ids)),
            error: () => undefined
        });
    }
}
