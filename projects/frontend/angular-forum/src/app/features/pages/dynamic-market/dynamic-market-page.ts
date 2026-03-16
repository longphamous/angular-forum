import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { InputNumberModule } from "primeng/inputnumber";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import type { MarketResource } from "../../../core/models/dynamic-market/dynamic-market";
import { MARKET_GROUP_LABELS } from "../../../core/models/dynamic-market/dynamic-market";
import { DynamicMarketFacade } from "../../../facade/dynamic-market/dynamic-market-facade";

/** Auto-refresh interval in ms */
const POLL_INTERVAL = 30_000;

@Component({
    selector: "app-dynamic-market-page",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslocoModule,
        CardModule,
        ButtonModule,
        InputNumberModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TooltipModule
    ],
    templateUrl: "./dynamic-market-page.html",
    styleUrl: "./dynamic-market-page.css",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicMarketPage implements OnInit, OnDestroy {
    readonly marketFacade = inject(DynamicMarketFacade);
    private readonly transloco = inject(TranslocoService);

    readonly showInventory = signal(false);
    readonly selectedResource = signal<MarketResource | null>(null);

    buyQuantities: Record<string, number> = {};
    sellQuantities: Record<string, number> = {};

    private pollTimer: ReturnType<typeof setInterval> | null = null;

    ngOnInit(): void {
        this.marketFacade.loadOverview();
        this.marketFacade.loadRecentEvents();
        this.marketFacade.loadInventory();

        // Auto-refresh prices
        this.pollTimer = setInterval(() => {
            this.marketFacade.loadOverview();
        }, POLL_INTERVAL);
    }

    ngOnDestroy(): void {
        if (this.pollTimer) clearInterval(this.pollTimer);
    }

    toggleInventory(): void {
        this.showInventory.update((v) => !v);
        if (this.showInventory()) {
            this.marketFacade.loadInventory();
        }
    }

    onBuy(slug: string): void {
        const qty = this.buyQuantities[slug] || 1;
        this.marketFacade.buy(slug, qty);
    }

    onSell(slug: string): void {
        const qty = this.sellQuantities[slug] || 1;
        this.marketFacade.sell(slug, qty);
    }

    selectResource(resource: MarketResource): void {
        this.selectedResource.set(this.selectedResource()?.slug === resource.slug ? null : resource);
    }

    getGroupLabel(groupKey: string): string {
        const lang = this.transloco.getActiveLang();
        const entry = MARKET_GROUP_LABELS[groupKey];
        if (!entry) return groupKey;
        return lang === "de" ? entry.de : entry.en;
    }

    getPricePercent(resource: MarketResource): number {
        const range = resource.maxPrice - resource.minPrice;
        if (range <= 0) return 50;
        return ((resource.currentPrice - resource.minPrice) / range) * 100;
    }

    isFlashing(slug: string): boolean {
        return this.marketFacade.changedSlugs().has(slug);
    }

    /**
     * Generate an inline SVG sparkline path from price history data.
     * Returns the `d` attribute for a polyline path.
     */
    getSparklinePath(history: number[]): string {
        if (!history || history.length < 2) return "";
        const w = 120;
        const h = 28;
        const padding = 2;
        const min = Math.min(...history);
        const max = Math.max(...history);
        const range = max - min || 1;
        const stepX = (w - padding * 2) / (history.length - 1);

        return history
            .map((val, i) => {
                const x = padding + i * stepX;
                const y = h - padding - ((val - min) / range) * (h - padding * 2);
                return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");
    }

    getSparklineColor(resource: MarketResource): string {
        if (resource.changePercent > 0) return "#22c55e";
        if (resource.changePercent < 0) return "#ef4444";
        return "#94a3b8";
    }

    getInventoryQty(slug: string): number {
        const item = this.marketFacade.inventory().find((i) => i.resourceSlug === slug);
        return item?.quantity ?? 0;
    }
}
