import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";

import type { MarketConfig, MarketResource, ScheduleType } from "../../../core/models/dynamic-market/dynamic-market";
import { DEFAULT_SCHEDULE } from "../../../core/models/dynamic-market/dynamic-market";
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
        InputNumberModule,
        InputTextModule,
        SkeletonModule,
        TagModule
    ],
    templateUrl: "./admin-dynamic-market.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDynamicMarket implements OnInit {
    readonly marketFacade = inject(DynamicMarketFacade);

    readonly activeTab = signal<"resources" | "events" | "config">("resources");
    readonly editingResource = signal<EditableResource | null>(null);

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

    ngOnInit(): void {
        this.marketFacade.loadAdminResources();
        this.marketFacade.loadRecentEvents();
        this.marketFacade.loadAdminConfig();
        this.marketFacade.loadNextUpdate();

        // Sync config form when loaded
        const checkConfig = setInterval(() => {
            const c = this.marketFacade.adminConfig();
            if (c) {
                this.configForm = { ...c, schedule: c.schedule ?? { ...DEFAULT_SCHEDULE } };
                clearInterval(checkConfig);
            }
        }, 200);
    }

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
            isActive: true
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
            isActive: r.isActive
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

    onRecalculate(): void {
        this.marketFacade.recalculatePrices();
    }

    onTriggerEvent(): void {
        this.marketFacade.triggerEvent();
    }

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
