import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable } from "rxjs";

import { COMMUNITY_BOT_ROUTES } from "../../core/api/community-bot.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { BotLog, BotStats, CommunityBot, CreateBotPayload } from "../../core/models/community-bot/community-bot";

@Injectable({ providedIn: "root" })
export class CommunityBotFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);

    readonly bots = signal<CommunityBot[]>([]);
    readonly logs = signal<BotLog[]>([]);
    readonly logTotal = signal(0);
    readonly stats = signal<BotStats | null>(null);
    readonly loading = signal(false);
    readonly logsLoading = signal(false);

    private get base(): string {
        return this.config.baseUrl;
    }

    loadBots(): void {
        this.loading.set(true);
        this.http.get<CommunityBot[]>(`${this.base}${COMMUNITY_BOT_ROUTES.bots()}`).subscribe({
            next: (bots) => {
                this.bots.set(bots);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    loadStats(): void {
        this.http.get<BotStats>(`${this.base}${COMMUNITY_BOT_ROUTES.stats()}`).subscribe({
            next: (s) => this.stats.set(s)
        });
    }

    loadLogs(limit = 100, offset = 0, botId?: string): void {
        this.logsLoading.set(true);
        let url = `${this.base}${COMMUNITY_BOT_ROUTES.logs()}?limit=${limit}&offset=${offset}`;
        if (botId) url += `&botId=${botId}`;
        this.http.get<{ items: BotLog[]; total: number }>(url).subscribe({
            next: (r) => {
                this.logs.set(r.items);
                this.logTotal.set(r.total);
                this.logsLoading.set(false);
            },
            error: () => this.logsLoading.set(false)
        });
    }

    createBot(payload: CreateBotPayload): Observable<CommunityBot> {
        return this.http.post<CommunityBot>(`${this.base}${COMMUNITY_BOT_ROUTES.bots()}`, payload);
    }

    updateBot(id: string, payload: Partial<CreateBotPayload>): Observable<CommunityBot> {
        return this.http.patch<CommunityBot>(`${this.base}${COMMUNITY_BOT_ROUTES.bot(id)}`, payload);
    }

    toggleBot(id: string): Observable<CommunityBot> {
        return this.http.patch<CommunityBot>(`${this.base}${COMMUNITY_BOT_ROUTES.toggle(id)}`, {});
    }

    testBot(id: string): Observable<BotLog[]> {
        return this.http.post<BotLog[]>(`${this.base}${COMMUNITY_BOT_ROUTES.test(id)}`, {});
    }

    deleteBot(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${COMMUNITY_BOT_ROUTES.bot(id)}`);
    }

    clearLogs(days = 30): Observable<number> {
        return this.http.delete<number>(`${this.base}${COMMUNITY_BOT_ROUTES.logs()}?days=${days}`);
    }
}
