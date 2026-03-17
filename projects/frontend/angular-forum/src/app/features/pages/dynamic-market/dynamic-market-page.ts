import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from "@angular/core";
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
import { WalletFacade } from "../../../facade/wallet/wallet-facade";

/** Fallback poll interval ms — fires only if scheduler is disabled */
const POLL_INTERVAL = 60_000;

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
    readonly walletFacade = inject(WalletFacade);
    private readonly transloco = inject(TranslocoService);

    /** Always shows the most up-to-date balance: trade result takes precedence over wallet load */
    readonly currentBalance = computed(
        () => this.marketFacade.lastTradeResult()?.newBalance ?? this.walletFacade.wallet()?.balance ?? null
    );

    readonly showInventory = signal(false);
    readonly selectedResource = signal<MarketResource | null>(null);
    readonly countdown = signal<string>("");
    readonly countdownPercent = signal<number>(100);
    buyQuantities: Record<string, number> = {};
    sellQuantities: Record<string, number> = {};

    private pollTimer: ReturnType<typeof setInterval> | null = null;
    private countdownTimer: ReturnType<typeof setInterval> | null = null;
    private activitiesTimer: ReturnType<typeof setInterval> | null = null;
    private countdownTotalMs = 0;

    ngOnInit(): void {
        // Clear stale trade result from a previous visit
        this.marketFacade.lastTradeResult.set(null);

        this.walletFacade.loadWallet();
        this.marketFacade.loadOverview();
        this.marketFacade.loadRecentEvents();
        this.marketFacade.loadInventory();
        this.marketFacade.loadNextUpdate();

        // Fallback poll
        this.pollTimer = setInterval(() => {
            this.marketFacade.loadOverview();
        }, POLL_INTERVAL);

        // Countdown tick every second
        this.countdownTimer = setInterval(() => this.tickCountdown(), 1000);

        this.marketFacade.loadActivities();
        this.activitiesTimer = setInterval(() => {
            this.marketFacade.loadActivities();
        }, 10_000);
    }

    ngOnDestroy(): void {
        if (this.pollTimer) clearInterval(this.pollTimer);
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        if (this.activitiesTimer) clearInterval(this.activitiesTimer);
    }

    private tickCountdown(): void {
        const next = this.marketFacade.nextUpdateAt();
        if (!next) {
            this.countdown.set("");
            this.countdownPercent.set(100);
            return;
        }
        const diff = next.getTime() - Date.now();
        if (diff <= 0) {
            this.countdown.set("…");
            this.countdownPercent.set(0);
            this.marketFacade.loadOverview();
            this.marketFacade.loadNextUpdate();
            return;
        }
        if (this.countdownTotalMs === 0) this.countdownTotalMs = diff;
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        const s = Math.floor((diff % 60_000) / 1_000);
        this.countdown.set(
            h > 0
                ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
                : `${m}:${String(s).padStart(2, "0")}`
        );
        this.countdownPercent.set(Math.round((diff / this.countdownTotalMs) * 100));
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

    protected relativeTime(iso: string): string {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60_000);
        const hours = Math.floor(diff / 3_600_000);
        if (diff < 60_000) return "gerade eben";
        if (mins < 60) return `vor ${mins} Min.`;
        if (hours < 24) return `vor ${hours} Std.`;
        return `vor ${Math.floor(hours / 24)} Tag(en)`;
    }
}
