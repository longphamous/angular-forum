import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";

import { Auction } from "../../../core/models/marketplace/auction";
import { AuctionFacade } from "../../../facade/marketplace/auction-facade";

@Component({
    selector: "admin-auctions",
    standalone: true,
    imports: [RouterModule, FormsModule, TranslocoModule, ButtonModule, TagModule, DialogModule, TextareaModule],
    templateUrl: "./admin-auctions.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAuctions implements OnInit {
    readonly facade = inject(AuctionFacade);
    private readonly cd = inject(ChangeDetectorRef);

    rejectDialogVisible = signal(false);
    rejectReason = "";
    pendingAuction: Auction | null = null;

    ngOnInit(): void {
        this.facade.loadPendingAuctions();
    }

    approveAuction(id: string): void {
        this.facade.approveAuction(id).subscribe({
            next: () => {
                this.facade.loadPendingAuctions();
                this.cd.markForCheck();
            }
        });
    }

    openRejectDialog(auction: Auction): void {
        this.pendingAuction = auction;
        this.rejectReason = "";
        this.rejectDialogVisible.set(true);
    }

    confirmReject(): void {
        if (!this.pendingAuction) return;
        this.facade.rejectAuction(this.pendingAuction.id, this.rejectReason).subscribe({
            next: () => {
                this.rejectDialogVisible.set(false);
                this.facade.loadPendingAuctions();
                this.cd.markForCheck();
            }
        });
    }

    formatPrice(amount: number, currency: string): string {
        return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount);
    }

    formatDate(d: string): string {
        return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
}
