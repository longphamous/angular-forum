import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { MessageModule } from "primeng/message";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { TooltipModule } from "primeng/tooltip";

import { AuthFacade } from "../../../../facade/auth/auth-facade";
import { AuctionFacade } from "../../../../facade/marketplace/auction-facade";

@Component({
    selector: "auction-detail-page",
    standalone: true,
    imports: [
        RouterModule,
        FormsModule,
        TranslocoModule,
        ButtonModule,
        TagModule,
        TableModule,
        InputNumberModule,
        DialogModule,
        MessageModule,
        TooltipModule,
        ToggleSwitchModule,
        DatePipe
    ],
    templateUrl: "./auction-detail-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuctionDetailPage implements OnInit {
    readonly facade = inject(AuctionFacade);
    readonly authFacade = inject(AuthFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly cd = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);
    private readonly translocoService = inject(TranslocoService);

    timeLeft = signal("");
    isEndingSoon = signal(false);
    private countdownInterval: ReturnType<typeof setInterval> | null = null;

    bidAmount: number | null = null;
    useAutoBid = false;
    maxAutoBid: number | null = null;
    bidError: string | null = null;

    showBuyNowDialog = false;
    showCancelDialog = false;

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get("id");
        if (id) {
            this.facade.loadAuction(id);
            this.facade.loadBidHistory(id);
        }

        this.startCountdown();
        this.destroyRef.onDestroy(() => {
            if (this.countdownInterval) clearInterval(this.countdownInterval);
        });
    }

    private startCountdown(): void {
        this.countdownInterval = setInterval(() => {
            const auction = this.facade.currentAuction();
            if (!auction) return;

            const diff = new Date(auction.endTime).getTime() - Date.now();
            if (diff <= 0) {
                this.timeLeft.set(this.translocoService.translate("marketplace.auction.auctionEnded"));
                this.isEndingSoon.set(false);
                if (this.countdownInterval) clearInterval(this.countdownInterval);
                return;
            }

            this.isEndingSoon.set(diff < 5 * 60 * 1000);

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                this.timeLeft.set(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            } else if (hours > 0) {
                this.timeLeft.set(`${hours}h ${minutes}m ${seconds}s`);
            } else {
                this.timeLeft.set(`${minutes}m ${seconds}s`);
            }
            this.cd.markForCheck();
        }, 1000);
    }

    get minBid(): number {
        const auction = this.facade.currentAuction();
        if (!auction) return 0;
        return auction.bidCount === 0 ? auction.startPrice : auction.currentPrice + auction.bidIncrement;
    }

    formatPrice(amount: number, currency: string): string {
        return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount);
    }

    placeBid(): void {
        const auction = this.facade.currentAuction();
        if (!auction || !this.bidAmount) return;

        this.bidError = null;
        this.facade
            .placeBid(auction.id, {
                amount: this.bidAmount,
                maxAutoBid: this.useAutoBid ? this.maxAutoBid : null
            })
            .subscribe({
                next: () => {
                    this.bidAmount = null;
                    this.maxAutoBid = null;
                    this.useAutoBid = false;
                    this.facade.loadAuction(auction.id);
                    this.facade.loadBidHistory(auction.id);
                    this.cd.markForCheck();
                },
                error: (err: { error?: { message?: string } }) => {
                    this.bidError = err.error?.message ?? "Fehler beim Bieten";
                    this.cd.markForCheck();
                }
            });
    }

    buyNow(): void {
        const auction = this.facade.currentAuction();
        if (!auction) return;
        this.facade.buyNow(auction.id).subscribe({
            next: () => {
                this.showBuyNowDialog = false;
                this.facade.loadAuction(auction.id);
                this.cd.markForCheck();
            }
        });
    }

    toggleWatch(): void {
        const auction = this.facade.currentAuction();
        if (!auction) return;
        this.facade.toggleWatch(auction.id).subscribe({
            next: () => {
                this.facade.loadAuction(auction.id);
                this.cd.markForCheck();
            }
        });
    }

    cancelAuction(): void {
        const auction = this.facade.currentAuction();
        if (!auction) return;
        this.facade.cancelAuction(auction.id).subscribe({
            next: () => {
                this.showCancelDialog = false;
                void this.router.navigate(["/marketplace/auctions/my"]);
            }
        });
    }

    statusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            active: "success",
            scheduled: "info",
            ended: "secondary",
            cancelled: "danger"
        };
        return map[status] ?? "secondary";
    }

    isOwner(): boolean {
        const auction = this.facade.currentAuction();
        return !!auction && auction.listing.authorId === this.authFacade.currentUser()?.id;
    }
}
