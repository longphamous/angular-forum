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

import type { MarketConfig, MarketResource } from "../../../core/models/dynamic-market/dynamic-market";
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
        priceUpdateIntervalMinutes: 60,
        eventChancePercent: 20,
        demandDecayFactor: 0.8,
        maxTradeQuantity: 100
    };

    ngOnInit(): void {
        this.marketFacade.loadAdminResources();
        this.marketFacade.loadRecentEvents();
        this.marketFacade.loadAdminConfig();

        // Sync config form when loaded
        const checkConfig = setInterval(() => {
            const c = this.marketFacade.adminConfig();
            if (c) {
                this.configForm = { ...c };
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

    objectKeys(obj: Record<string, unknown>): string[] {
        return Object.keys(obj);
    }
}
