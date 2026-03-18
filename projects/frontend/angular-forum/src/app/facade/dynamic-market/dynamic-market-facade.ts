import { HttpClient } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";

import { DYNAMIC_MARKET_ROUTES } from "../../core/api/dynamic-market.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import {
    AdminOrgInventoryItem,
    MarketActivity,
    MarketConfig,
    MarketEvent,
    MarketEventLog,
    MarketGroup,
    MarketResource,
    MarketSchedule,
    MarketStats,
    MarketTradeResult,
    UserInventoryItem
} from "../../core/models/dynamic-market/dynamic-market";

@Injectable({ providedIn: "root" })
export class DynamicMarketFacade {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    readonly groups = signal<MarketGroup[]>([]);
    readonly loading = signal(false);
    readonly recentEvents = signal<MarketEventLog[]>([]);
    readonly inventory = signal<UserInventoryItem[]>([]);
    readonly inventoryLoading = signal(false);
    readonly trading = signal(false);
    readonly lastTradeResult = signal<MarketTradeResult | null>(null);

    /** Flattened resource list for table view */
    readonly allResources = computed<MarketResource[]>(() => this.groups().flatMap((g) => g.resources));

    /** Track which cells recently changed for flash animation */
    readonly changedSlugs = signal<Set<string>>(new Set());
    readonly activities = signal<MarketActivity[]>([]);
    readonly activitiesLoading = signal(false);

    private get base(): string {
        return this.apiConfig.baseUrl;
    }

    loadOverview(): void {
        this.loading.set(true);
        this.http.get<MarketGroup[]>(`${this.base}${DYNAMIC_MARKET_ROUTES.overview()}`).subscribe({
            next: (groups) => {
                // Detect changed prices for flash animation
                const oldResources = this.allResources();
                const oldPriceMap = new Map(oldResources.map((r) => [r.slug, r.currentPrice]));
                const changed = new Set<string>();
                for (const g of groups) {
                    for (const r of g.resources) {
                        const oldPrice = oldPriceMap.get(r.slug);
                        if (oldPrice !== undefined && oldPrice !== r.currentPrice) {
                            changed.add(r.slug);
                        }
                    }
                }
                this.changedSlugs.set(changed);
                this.groups.set(groups);
                this.loading.set(false);
                // Clear flash after animation
                if (changed.size > 0) {
                    setTimeout(() => this.changedSlugs.set(new Set()), 1500);
                }
            },
            error: () => this.loading.set(false)
        });
    }

    loadRecentEvents(limit = 10): void {
        this.http.get<MarketEventLog[]>(`${this.base}${DYNAMIC_MARKET_ROUTES.recentEvents(limit)}`).subscribe({
            next: (events) => this.recentEvents.set(events),
            error: () => undefined
        });
    }

    loadInventory(): void {
        this.inventoryLoading.set(true);
        this.http.get<UserInventoryItem[]>(`${this.base}${DYNAMIC_MARKET_ROUTES.inventory()}`).subscribe({
            next: (items) => {
                this.inventory.set(items);
                this.inventoryLoading.set(false);
            },
            error: () => this.inventoryLoading.set(false)
        });
    }

    loadActivities(limit = 50): void {
        this.activitiesLoading.set(true);
        this.http.get<MarketActivity[]>(`${this.base}${DYNAMIC_MARKET_ROUTES.activities(limit)}`).subscribe({
            next: (a) => {
                this.activities.set(a);
                this.activitiesLoading.set(false);
            },
            error: () => this.activitiesLoading.set(false)
        });
    }

    buy(slug: string, quantity: number): void {
        this.trading.set(true);
        this.http.post<MarketTradeResult>(`${this.base}${DYNAMIC_MARKET_ROUTES.buy()}`, { slug, quantity }).subscribe({
            next: (result) => {
                this.lastTradeResult.set(result);
                this.trading.set(false);
                this.loadOverview();
                this.loadInventory();
                this.scheduleResultDismiss();
            },
            error: () => this.trading.set(false)
        });
    }

    sell(slug: string, quantity: number): void {
        this.trading.set(true);
        this.http.post<MarketTradeResult>(`${this.base}${DYNAMIC_MARKET_ROUTES.sell()}`, { slug, quantity }).subscribe({
            next: (result) => {
                this.lastTradeResult.set(result);
                this.trading.set(false);
                this.loadOverview();
                this.loadInventory();
                this.scheduleResultDismiss();
            },
            error: () => this.trading.set(false)
        });
    }

    private resultDismissTimer: ReturnType<typeof setTimeout> | null = null;

    private scheduleResultDismiss(): void {
        if (this.resultDismissTimer) clearTimeout(this.resultDismissTimer);
        this.resultDismissTimer = setTimeout(() => {
            this.lastTradeResult.set(null);
            this.resultDismissTimer = null;
        }, 5000);
    }

    // ─── Admin methods ──────────────────────────────────────────────────────

    readonly nextUpdateAt = signal<Date | null>(null);
    readonly scheduleType = signal<string>("disabled");

    loadNextUpdate(): void {
        this.http
            .get<{
                nextUpdateAt: string | null;
                scheduleType: string;
            }>(`${this.base}${DYNAMIC_MARKET_ROUTES.scheduleNext()}`)
            .subscribe({
                next: (data) => {
                    this.nextUpdateAt.set(data.nextUpdateAt ? new Date(data.nextUpdateAt) : null);
                    this.scheduleType.set(data.scheduleType);
                },
                error: () => undefined
            });
    }

    readonly adminResources = signal<MarketResource[]>([]);
    readonly adminEvents = signal<MarketEvent[]>([]);
    readonly adminConfig = signal<MarketConfig | null>(null);
    readonly adminStats = signal<MarketStats | null>(null);
    readonly adminStatsLoading = signal(false);
    readonly adminOrgInventory = signal<AdminOrgInventoryItem[]>([]);
    readonly interventionTrading = signal(false);

    loadAdminResources(): void {
        this.http.get<MarketResource[]>(`${this.base}${DYNAMIC_MARKET_ROUTES.adminResources()}`).subscribe({
            next: (resources) => this.adminResources.set(resources),
            error: () => undefined
        });
    }

    loadAdminEvents(): void {
        this.http.get<MarketEvent[]>(`${this.base}${DYNAMIC_MARKET_ROUTES.adminEvents()}`).subscribe({
            next: (events) => this.adminEvents.set(events),
            error: () => undefined
        });
    }

    createResource(dto: Partial<MarketResource>): void {
        this.http.post<MarketResource>(`${this.base}${DYNAMIC_MARKET_ROUTES.adminCreateResource()}`, dto).subscribe({
            next: () => this.loadAdminResources(),
            error: () => undefined
        });
    }

    updateResource(id: string, dto: Partial<MarketResource>): void {
        this.http.patch<MarketResource>(`${this.base}${DYNAMIC_MARKET_ROUTES.adminUpdateResource(id)}`, dto).subscribe({
            next: () => this.loadAdminResources(),
            error: () => undefined
        });
    }

    deleteResource(id: string): void {
        this.http.delete(`${this.base}${DYNAMIC_MARKET_ROUTES.adminDeleteResource(id)}`).subscribe({
            next: () => this.loadAdminResources(),
            error: () => undefined
        });
    }

    resetPrices(): void {
        this.http.post(`${this.base}${DYNAMIC_MARKET_ROUTES.adminResetPrices()}`, {}).subscribe({
            next: () => this.loadAdminResources(),
            error: () => undefined
        });
    }

    recalculatePrices(): void {
        this.http.post(`${this.base}${DYNAMIC_MARKET_ROUTES.adminRecalculate()}`, {}).subscribe({
            next: () => this.loadAdminResources(),
            error: () => undefined
        });
    }

    triggerEvent(): void {
        this.http
            .post<MarketEventLog | null>(`${this.base}${DYNAMIC_MARKET_ROUTES.adminTriggerEvent()}`, {})
            .subscribe({
                next: () => {
                    this.loadAdminResources();
                    this.loadRecentEvents();
                },
                error: () => undefined
            });
    }

    loadAdminStats(): void {
        this.adminStatsLoading.set(true);
        this.http.get<MarketStats>(`${this.base}${DYNAMIC_MARKET_ROUTES.adminStats()}`).subscribe({
            next: (stats) => {
                this.adminStats.set(stats);
                this.adminStatsLoading.set(false);
            },
            error: () => this.adminStatsLoading.set(false)
        });
    }

    loadAdminOrgInventory(): void {
        this.http
            .get<AdminOrgInventoryItem[]>(`${this.base}${DYNAMIC_MARKET_ROUTES.adminInterventionInventory()}`)
            .subscribe({
                next: (items) => this.adminOrgInventory.set(items),
                error: () => undefined
            });
    }

    adminInterventionBuy(slug: string, quantity: number): void {
        this.interventionTrading.set(true);
        this.http
            .post<
                AdminOrgInventoryItem[]
            >(`${this.base}${DYNAMIC_MARKET_ROUTES.adminInterventionBuy()}`, { slug, quantity })
            .subscribe({
                next: (items) => {
                    this.adminOrgInventory.set(items);
                    this.interventionTrading.set(false);
                    this.loadAdminResources();
                },
                error: () => this.interventionTrading.set(false)
            });
    }

    adminInterventionSell(slug: string, quantity: number): void {
        this.interventionTrading.set(true);
        this.http
            .post<
                AdminOrgInventoryItem[]
            >(`${this.base}${DYNAMIC_MARKET_ROUTES.adminInterventionSell()}`, { slug, quantity })
            .subscribe({
                next: (items) => {
                    this.adminOrgInventory.set(items);
                    this.interventionTrading.set(false);
                    this.loadAdminResources();
                },
                error: () => this.interventionTrading.set(false)
            });
    }

    fullReset(): void {
        this.http.post<{ message: string }>(`${this.base}${DYNAMIC_MARKET_ROUTES.adminFullReset()}`, {}).subscribe({
            next: () => {
                this.loadAdminResources();
                this.loadAdminStats();
                this.loadAdminOrgInventory();
                this.recentEvents.set([]);
            },
            error: () => undefined
        });
    }

    loadAdminConfig(): void {
        this.http.get<MarketConfig>(`${this.base}${DYNAMIC_MARKET_ROUTES.adminConfig()}`).subscribe({
            next: (config) => this.adminConfig.set(config),
            error: () => undefined
        });
    }

    updateConfig(config: Partial<Omit<MarketConfig, "nextUpdateAt">> & { schedule?: MarketSchedule }): void {
        this.http.put<MarketConfig>(`${this.base}${DYNAMIC_MARKET_ROUTES.adminUpdateConfig()}`, config).subscribe({
            next: (c) => {
                this.adminConfig.set(c);
                this.nextUpdateAt.set(c.nextUpdateAt ? new Date(c.nextUpdateAt) : null);
                this.scheduleType.set(c.schedule?.type ?? "disabled");
            },
            error: () => undefined
        });
    }
}
