import { CurrencyPipe } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ConfirmationService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { MarketplaceFacade } from "../../../facade/marketplace/marketplace-facade";

@Component({
    selector: "my-listings-page",
    standalone: true,
    imports: [
        RouterModule,
        TranslocoModule,
        ButtonModule,
        TabsModule,
        TagModule,
        SkeletonModule,
        ConfirmDialogModule,
        TooltipModule,
        CurrencyPipe
    ],
    providers: [ConfirmationService],
    templateUrl: "./my-listings-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyListingsPage implements OnInit {
    readonly facade = inject(MarketplaceFacade);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly cd = inject(ChangeDetectorRef);

    ngOnInit(): void {
        this.facade.loadMyListings();
        this.facade.loadMyOffers();
    }

    confirmDelete(id: string): void {
        this.confirmationService.confirm({
            message: "Möchtest du dieses Inserat wirklich löschen?",
            header: "Inserat löschen",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                this.facade.deleteListing(id).subscribe({
                    next: () => {
                        this.facade.loadMyListings();
                        this.cd.markForCheck();
                    }
                });
            }
        });
    }

    withdrawOffer(listingId: string, offerId: string): void {
        this.facade.withdrawOffer(listingId, offerId).subscribe({
            next: () => {
                this.facade.loadMyOffers();
                this.cd.markForCheck();
            }
        });
    }

    statusSeverity(s: string): "success" | "warn" | "danger" | "info" | "secondary" {
        return (
            (
                {
                    active: "success",
                    pending: "warn",
                    sold: "info",
                    closed: "secondary",
                    expired: "danger",
                    archived: "secondary",
                    draft: "secondary"
                } as Record<string, "success" | "warn" | "danger" | "info" | "secondary">
            )[s] ?? "secondary"
        );
    }

    statusLabel(s: string): string {
        return (
            (
                {
                    active: "Aktiv",
                    pending: "Ausstehend",
                    sold: "Verkauft",
                    closed: "Geschlossen",
                    expired: "Abgelaufen",
                    archived: "Archiviert",
                    draft: "Entwurf"
                } as Record<string, string>
            )[s] ?? s
        );
    }

    offerStatusSeverity(s: string): "success" | "warn" | "danger" | "info" | "secondary" {
        return (
            (
                {
                    pending: "warn",
                    accepted: "success",
                    rejected: "danger",
                    withdrawn: "secondary",
                    countered: "info"
                } as Record<string, "success" | "warn" | "danger" | "info" | "secondary">
            )[s] ?? "secondary"
        );
    }

    offerStatusLabel(s: string): string {
        return (
            (
                {
                    pending: "Ausstehend",
                    accepted: "Akzeptiert",
                    rejected: "Abgelehnt",
                    withdrawn: "Zurückgezogen",
                    countered: "Gegenangebot"
                } as Record<string, string>
            )[s] ?? s
        );
    }

    formatPrice(price: number | null, currency: string): string {
        if (price === null) return "Verhandelbar";
        return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(price);
    }

    typeLabel(t: string): string {
        return (
            ({ sell: "Verkaufen", buy: "Kaufen", trade: "Tauschen", gift: "Verschenken" } as Record<string, string>)[
                t
            ] ?? t
        );
    }
}
