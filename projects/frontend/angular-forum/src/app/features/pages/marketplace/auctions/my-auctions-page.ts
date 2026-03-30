import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";

import { Auction, AuctionStatus } from "../../../../core/models/marketplace/auction";
import { AuctionFacade } from "../../../../facade/marketplace/auction-facade";

@Component({
    selector: "my-auctions-page",
    standalone: true,
    imports: [RouterModule, TranslocoModule, ButtonModule, TabsModule, TagModule, DatePipe],
    templateUrl: "./my-auctions-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyAuctionsPage implements OnInit {
    readonly facade = inject(AuctionFacade);

    ngOnInit(): void {
        this.facade.loadMyAuctions();
    }

    get activeAuctions(): Auction[] {
        return this.facade.myAuctions().filter((a) => a.status === "active" || a.status === "scheduled");
    }

    get endedAuctions(): Auction[] {
        return this.facade.myAuctions().filter((a) => a.status === "ended");
    }

    get cancelledAuctions(): Auction[] {
        return this.facade.myAuctions().filter((a) => a.status === "cancelled");
    }

    formatPrice(amount: number, currency: string): string {
        return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount);
    }

    statusSeverity(status: AuctionStatus): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<AuctionStatus, "success" | "info" | "warn" | "danger" | "secondary"> = {
            active: "success",
            scheduled: "info",
            ended: "secondary",
            cancelled: "danger"
        };
        return map[status];
    }

    getTimeLeft(endTime: string): string {
        const diff = new Date(endTime).getTime() - Date.now();
        if (diff <= 0) return "Beendet";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h`;
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
}
