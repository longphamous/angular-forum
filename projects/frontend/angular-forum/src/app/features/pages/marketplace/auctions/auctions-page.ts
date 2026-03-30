import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule, PaginatorState } from "primeng/paginator";
import { SelectButtonModule } from "primeng/selectbutton";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { Auction } from "../../../../core/models/marketplace/auction";
import { AuthFacade } from "../../../../facade/auth/auth-facade";
import { AuctionFacade } from "../../../../facade/marketplace/auction-facade";
import { MarketplaceFacade } from "../../../../facade/marketplace/marketplace-facade";

@Component({
    selector: "auctions-page",
    standalone: true,
    imports: [
        RouterModule,
        FormsModule,
        TranslocoModule,
        ButtonModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        TagModule,
        SkeletonModule,
        PaginatorModule,
        SelectButtonModule,
        BadgeModule,
        TooltipModule
    ],
    templateUrl: "./auctions-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuctionsPage implements OnInit {
    readonly facade = inject(AuctionFacade);
    readonly marketFacade = inject(MarketplaceFacade);
    readonly authFacade = inject(AuthFacade);
    private readonly translocoService = inject(TranslocoService);

    selectedCategoryId = signal<string | null>(null);
    selectedSort = signal<string | null>(null);
    searchQuery = "";
    readonly pageSize = 12;
    currentPage = 1;

    get sortOptions(): { label: string; value: string | null }[] {
        return [
            { label: this.translocoService.translate("common.all"), value: null },
            { label: this.translocoService.translate("marketplace.auction.sort.endingSoon"), value: "ending-soon" },
            { label: this.translocoService.translate("marketplace.auction.sort.newlyListed"), value: "newly-listed" },
            { label: this.translocoService.translate("marketplace.auction.sort.priceAsc"), value: "price-asc" },
            { label: this.translocoService.translate("marketplace.auction.sort.priceDesc"), value: "price-desc" },
            { label: this.translocoService.translate("marketplace.auction.sort.mostBids"), value: "most-bids" }
        ];
    }

    ngOnInit(): void {
        this.marketFacade.loadCategories();
        this.loadAuctions();
    }

    loadAuctions(): void {
        this.facade.loadAuctions({
            page: this.currentPage,
            limit: this.pageSize,
            categoryId: this.selectedCategoryId() ?? undefined,
            sort: (this.selectedSort() as "ending-soon" | "newly-listed" | "price-asc" | "price-desc" | "most-bids") ?? undefined,
            search: this.searchQuery || undefined
        });
    }

    selectCategory(id: string | null): void {
        this.selectedCategoryId.set(id);
        this.currentPage = 1;
        this.loadAuctions();
    }

    onSortChange(): void {
        this.currentPage = 1;
        this.loadAuctions();
    }

    onSearch(): void {
        this.currentPage = 1;
        this.loadAuctions();
    }

    onPageChange(event: PaginatorState): void {
        this.currentPage = (event.page ?? 0) + 1;
        this.loadAuctions();
    }

    formatPrice(amount: number, currency: string): string {
        return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount);
    }

    getTimeLeft(endTime: string): string {
        const diff = new Date(endTime).getTime() - Date.now();
        if (diff <= 0) return this.translocoService.translate("marketplace.auction.auctionEnded");

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    isEndingSoon(auction: Auction): boolean {
        const diff = new Date(auction.endTime).getTime() - Date.now();
        return diff > 0 && diff < 4 * 60 * 60 * 1000;
    }
}
