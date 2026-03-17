import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { SkeletonModule } from "primeng/skeleton";

import { DynamicMarketFacade } from "../../../facade/dynamic-market/dynamic-market-facade";

@Component({
    selector: "app-market-activity-widget",
    standalone: true,
    imports: [CommonModule, TranslocoModule, SkeletonModule, RouterModule],
    templateUrl: "./market-activity-widget.html",
    styleUrl: "./market-activity-widget.css",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketActivityWidget implements OnInit, OnDestroy {
    readonly marketFacade = inject(DynamicMarketFacade);

    private timer: ReturnType<typeof setInterval> | null = null;

    ngOnInit(): void {
        this.marketFacade.loadActivities(10);
        this.timer = setInterval(() => this.marketFacade.loadActivities(10), 30_000);
    }

    ngOnDestroy(): void {
        if (this.timer) clearInterval(this.timer);
    }

    protected relativeTime(iso: string): string {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60_000);
        if (diff < 60_000) return "Jetzt";
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h`;
    }
}
