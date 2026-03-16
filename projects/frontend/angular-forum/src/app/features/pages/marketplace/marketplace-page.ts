import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule, PaginatorState } from "primeng/paginator";
import { SelectButtonModule } from "primeng/selectbutton";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { ListingType, MarketListing } from "../../../core/models/marketplace/marketplace";
import { MarketplaceFacade } from "../../../facade/marketplace/marketplace-facade";

@Component({
    selector: "marketplace-page",
    standalone: true,
    imports: [
        RouterModule,
        FormsModule,
        TranslocoModule,
        ButtonModule,
        InputTextModule,
        TagModule,
        SkeletonModule,
        PaginatorModule,
        SelectButtonModule,
        BadgeModule,
        TooltipModule
    ],
    templateUrl: "./marketplace-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketplacePage implements OnInit {
    readonly facade = inject(MarketplaceFacade);

    selectedCategoryId = signal<string | null>(null);
    selectedType = signal<ListingType | null>(null);
    searchQuery = "";
    readonly pageSize = 12;
    currentPage = 1;

    readonly typeOptions = [
        { label: "Alle", value: null },
        { label: "Verkaufen", value: "sell" },
        { label: "Kaufen", value: "buy" },
        { label: "Tauschen", value: "trade" },
        { label: "Verschenken", value: "gift" }
    ];

    ngOnInit(): void {
        this.facade.loadCategories();
        this.loadListings();
    }

    loadListings(): void {
        this.facade.loadListings({
            page: this.currentPage,
            limit: this.pageSize,
            categoryId: this.selectedCategoryId() ?? undefined,
            type: this.selectedType() ?? undefined,
            search: this.searchQuery || undefined
        });
    }

    selectCategory(id: string | null): void {
        this.selectedCategoryId.set(id);
        this.currentPage = 1;
        this.loadListings();
    }

    onTypeChange(): void {
        this.currentPage = 1;
        this.loadListings();
    }

    onSearch(): void {
        this.currentPage = 1;
        this.loadListings();
    }

    onPageChange(event: PaginatorState): void {
        this.currentPage = (event.page ?? 0) + 1;
        this.loadListings();
    }

    typeSeverity(type: ListingType): "success" | "info" | "warn" | "danger" | "secondary" {
        const map: Record<ListingType, "success" | "info" | "warn" | "danger" | "secondary"> = {
            sell: "success",
            buy: "info",
            trade: "warn",
            gift: "secondary"
        };
        return map[type];
    }

    typeLabel(type: ListingType): string {
        const map: Record<ListingType, string> = {
            sell: "Verkaufen",
            buy: "Kaufen",
            trade: "Tauschen",
            gift: "Verschenken"
        };
        return map[type];
    }

    typeIcon(type: ListingType): string {
        const map: Record<ListingType, string> = {
            sell: "pi-tag",
            buy: "pi-shopping-cart",
            trade: "pi-arrow-right-arrow-left",
            gift: "pi-gift"
        };
        return map[type];
    }

    statusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" {
        if (status === "active") return "success";
        if (status === "pending") return "warn";
        if (status === "sold") return "danger";
        return "secondary";
    }

    formatPrice(listing: MarketListing): string {
        if (listing.price === null || listing.price === undefined) return "Verhandelbar";
        return new Intl.NumberFormat("de-DE", { style: "currency", currency: listing.currency }).format(listing.price);
    }
}
