import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import type {
    MarketConfig,
    MarketEvent,
    MarketResource,
    ScheduleType
} from "../../../core/models/dynamic-market/dynamic-market";
import { DEFAULT_SCHEDULE, MARKET_GROUP_LABELS } from "../../../core/models/dynamic-market/dynamic-market";
import { DynamicMarketFacade } from "../../../facade/dynamic-market/dynamic-market-facade";

interface EditableResource {
    id?: string;
    slug: string;
    name: string;
    groupKey: string;
    basePrice: number;
    minPrice: number;
    maxPrice: number;
    volatility: number;
    icon: string;
    imageUrl: string | null;
    isActive: boolean;
    maxStock: number | null;
    currentStock: number | null;
}

export interface EventImpact {
    event: MarketEvent;
    /** up = price increase, down = price decrease, mixed = depends on modifier value */
    direction: "up" | "down" | "mixed";
}

export interface DependencyRow {
    resource: MarketResource;
    /** Other resources in the same group — inverse price relationship */
    groupPeers: MarketResource[];
    /** Events that directly mention this resource's slug */
    eventImpacts: EventImpact[];
}

@Component({
    selector: "app-admin-dynamic-market",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslocoModule,
        CardModule,
        ButtonModule,
        DialogModule,
        InputNumberModule,
        InputTextModule,
        SkeletonModule,
        TagModule,
        TooltipModule
    ],
    templateUrl: "./admin-dynamic-market.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDynamicMarket implements OnInit {
    readonly marketFacade = inject(DynamicMarketFacade);

    readonly activeTab = signal<"resources" | "events" | "config" | "dependencies" | "stats" | "intervention">(
        "resources"
    );
    readonly editingResource = signal<EditableResource | null>(null);
    readonly depFilter = signal("");

    configForm: MarketConfig = {
        eventChancePercent: 20,
        demandDecayFactor: 0.8,
        maxTradeQuantity: 100,
        schedule: { ...DEFAULT_SCHEDULE },
        nextUpdateAt: null
    };

    readonly scheduleTypeOptions: { value: ScheduleType; label: string }[] = [
        { value: "disabled", label: "Deaktiviert" },
        { value: "minutely", label: "Minütlich" },
        { value: "hourly", label: "Stündlich" },
        { value: "daily", label: "Täglich" },
        { value: "weekly", label: "Wöchentlich" }
    ];

    readonly minutelyOptions = [1, 2, 5, 10, 15, 30, 60, 120, 240];

    readonly weekdayOptions: { value: number; label: string }[] = [
        { value: 1, label: "Mo" },
        { value: 2, label: "Di" },
        { value: 3, label: "Mi" },
        { value: 4, label: "Do" },
        { value: 5, label: "Fr" },
        { value: 6, label: "Sa" },
        { value: 0, label: "So" }
    ];

    // ─── Dependency graph ────────────────────────────────────────────────────

    /** Full dependency rows for all resources, grouped by groupKey. */
    readonly dependencyRows = computed<DependencyRow[]>(() => {
        const resources = this.marketFacade.adminResources();
        const events = this.marketFacade.adminEvents();

        // Build group map
        const byGroup = new Map<string, MarketResource[]>();
        for (const r of resources) {
            const list = byGroup.get(r.groupKey) ?? [];
            list.push(r);
            byGroup.set(r.groupKey, list);
        }

        return resources.map((r) => {
            const groupPeers = (byGroup.get(r.groupKey) ?? []).filter((p) => p.id !== r.id);
            const eventImpacts: EventImpact[] = events
                .filter((e) => e.isActive && e.affectedSlugs.includes(r.slug))
                .map((e) => ({ event: e, direction: this.eventDirection(e) }));
            return { resource: r, groupPeers, eventImpacts };
        });
    });

    /** Rows filtered by the search input, grouped by groupKey. */
    readonly filteredDepsByGroup = computed<Map<string, DependencyRow[]>>(() => {
        const filter = this.depFilter().toLowerCase().trim();
        const rows = filter
            ? this.dependencyRows().filter(
                  (row) =>
                      row.resource.name.toLowerCase().includes(filter) ||
                      row.resource.slug.toLowerCase().includes(filter) ||
                      row.groupPeers.some((p) => p.name.toLowerCase().includes(filter)) ||
                      row.eventImpacts.some((ei) => ei.event.title.toLowerCase().includes(filter))
              )
            : this.dependencyRows();

        const grouped = new Map<string, DependencyRow[]>();
        for (const row of rows) {
            const list = grouped.get(row.resource.groupKey) ?? [];
            list.push(row);
            grouped.set(row.resource.groupKey, list);
        }
        return grouped;
    });

    readonly depGroupKeys = computed<string[]>(() => Array.from(this.filteredDepsByGroup().keys()));

    getGroupLabel(groupKey: string): string {
        const entry = MARKET_GROUP_LABELS[groupKey];
        return entry?.de ?? groupKey;
    }

    private eventDirection(event: MarketEvent): "up" | "down" | "mixed" {
        switch (event.modifierType) {
            case "set_max":
            case "add":
                return "up";
            case "set_min":
                return "down";
            case "multiply":
                return event.modifierValue >= 1 ? "up" : "down";
            default:
                return "mixed";
        }
    }

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    // Intervention quantities
    readonly interventionQty: Record<string, number> = {};
    readonly interventionSellQty: Record<string, number> = {};

    // Stats sort
    readonly statsSortField =
        signal<keyof import("../../../core/models/dynamic-market/dynamic-market").ResourceStat>("allTimeBuys");
    readonly statsSortDir = signal<"asc" | "desc">("desc");

    readonly sortedStatResources = computed(() => {
        const stats = this.marketFacade.adminStats();
        if (!stats) return [];
        const field = this.statsSortField();
        const dir = this.statsSortDir();
        return [...stats.resources].sort((a, b) => {
            const av = a[field] ?? 0;
            const bv = b[field] ?? 0;
            const cmp = av < bv ? -1 : av > bv ? 1 : 0;
            return dir === "asc" ? cmp : -cmp;
        });
    });

    sortStats(field: keyof import("../../../core/models/dynamic-market/dynamic-market").ResourceStat): void {
        if (this.statsSortField() === field) {
            this.statsSortDir.update((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            this.statsSortField.set(field);
            this.statsSortDir.set("desc");
        }
    }

    ngOnInit(): void {
        this.marketFacade.loadAdminResources();
        this.marketFacade.loadAdminEvents();
        this.marketFacade.loadRecentEvents();
        this.marketFacade.loadAdminConfig();
        this.marketFacade.loadNextUpdate();
        this.marketFacade.loadAdminStats();
        this.marketFacade.loadAdminOrgInventory();

        // Sync config form when loaded
        const checkConfig = setInterval(() => {
            const c = this.marketFacade.adminConfig();
            if (c) {
                this.configForm = { ...c, schedule: c.schedule ?? { ...DEFAULT_SCHEDULE } };
                clearInterval(checkConfig);
            }
        }, 200);
    }

    // ─── Resource CRUD ───────────────────────────────────────────────────────

    onNewResource(): void {
        this.editingResource.set({
            slug: "",
            name: "",
            groupKey: "otaku",
            basePrice: 100,
            minPrice: 50,
            maxPrice: 300,
            volatility: 1.0,
            icon: "pi pi-box",
            imageUrl: null,
            isActive: true,
            maxStock: null,
            currentStock: null
        });
    }

    onEditResource(r: MarketResource): void {
        this.editingResource.set({
            id: r.id,
            slug: r.slug,
            name: r.name,
            groupKey: r.groupKey,
            basePrice: r.basePrice,
            minPrice: r.minPrice,
            maxPrice: r.maxPrice,
            volatility: r.volatility,
            icon: r.icon,
            imageUrl: r.imageUrl,
            isActive: r.isActive,
            maxStock: r.maxStock,
            currentStock: r.currentStock
        });
    }

    onSaveResource(): void {
        const r = this.editingResource();
        if (!r) return;
        if (r.id) {
            this.marketFacade.updateResource(r.id, r);
        } else {
            this.marketFacade.createResource(r as Partial<MarketResource>);
        }
        this.editingResource.set(null);
    }

    onDeleteResource(id: string): void {
        this.marketFacade.deleteResource(id);
    }

    onResetPrices(): void {
        this.marketFacade.resetPrices();
    }

    onFullReset(): void {
        if (!window.confirm("Alle Marktdaten löschen?")) return;
        this.marketFacade.fullReset();
    }

    onRecalculate(): void {
        this.marketFacade.recalculatePrices();
    }

    onTriggerEvent(): void {
        this.marketFacade.triggerEvent();
    }

    // ─── Config ──────────────────────────────────────────────────────────────

    onSaveConfig(): void {
        this.marketFacade.updateConfig(this.configForm);
    }

    addDailyTime(): void {
        this.configForm.schedule.dailyTimes = [...this.configForm.schedule.dailyTimes, "12:00"];
    }

    removeDailyTime(index: number): void {
        this.configForm.schedule.dailyTimes = this.configForm.schedule.dailyTimes.filter((_, i) => i !== index);
    }

    toggleWeekday(day: number): void {
        const days = this.configForm.schedule.weeklyDays;
        this.configForm.schedule.weeklyDays = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    }

    objectKeys(obj: Record<string, unknown>): string[] {
        return Object.keys(obj);
    }
}
