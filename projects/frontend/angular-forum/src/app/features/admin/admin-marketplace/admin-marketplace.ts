import { CurrencyPipe } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";

import { MarketListing } from "../../../core/models/marketplace/marketplace";
import { MarketplaceFacade } from "../../../facade/marketplace/marketplace-facade";

@Component({
    selector: "admin-marketplace",
    standalone: true,
    imports: [
        RouterModule,
        FormsModule,
        TranslocoModule,
        ButtonModule,
        TabsModule,
        TagModule,
        SkeletonModule,
        DialogModule,
        TextareaModule,
        CurrencyPipe
    ],
    templateUrl: "./admin-marketplace.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMarketplace implements OnInit {
    readonly facade = inject(MarketplaceFacade);
    private readonly cd = inject(ChangeDetectorRef);

    rejectDialogVisible = signal(false);
    rejectReason = "";
    pendingListing: MarketListing | null = null;

    ngOnInit(): void {
        this.facade.loadPendingListings();
        this.facade.loadPendingReports();
    }

    approveListing(id: string): void {
        this.facade.approveListing(id).subscribe({
            next: () => {
                this.facade.loadPendingListings();
                this.cd.markForCheck();
            }
        });
    }

    openRejectDialog(listing: MarketListing): void {
        this.pendingListing = listing;
        this.rejectReason = "";
        this.rejectDialogVisible.set(true);
    }

    confirmReject(): void {
        if (!this.pendingListing) return;
        this.facade.rejectListingAdmin(this.pendingListing.id, this.rejectReason).subscribe({
            next: () => {
                this.rejectDialogVisible.set(false);
                this.facade.loadPendingListings();
                this.cd.markForCheck();
            }
        });
    }

    actionReport(id: string, status: string): void {
        this.facade.actionReport(id, status).subscribe({
            next: () => {
                this.facade.loadPendingReports();
                this.cd.markForCheck();
            }
        });
    }

    reportStatusSeverity(s: string): "success" | "warn" | "danger" | "secondary" {
        const m: Record<string, "success" | "warn" | "danger" | "secondary"> = {
            pending: "warn",
            reviewed: "info" as "secondary",
            dismissed: "secondary",
            actioned: "success"
        };
        return m[s] ?? "secondary";
    }

    formatDate(d: string): string {
        return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
}
