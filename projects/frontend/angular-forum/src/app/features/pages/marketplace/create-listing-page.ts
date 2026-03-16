import { CurrencyPipe } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { DatePickerModule } from "primeng/datepicker";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { SelectModule } from "primeng/select";
import { TextareaModule } from "primeng/textarea";

import { ListingType, MarketCategory } from "../../../core/models/marketplace/marketplace";
import { MarketplaceFacade } from "../../../facade/marketplace/marketplace-facade";

@Component({
    selector: "create-listing-page",
    standalone: true,
    imports: [
        RouterModule,
        FormsModule,
        TranslocoModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        InputNumberModule,
        SelectModule,
        ChipModule,
        MessageModule,
        DatePickerModule,
        CurrencyPipe
    ],
    templateUrl: "./create-listing-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateListingPage implements OnInit {
    readonly facade = inject(MarketplaceFacade);
    private readonly router = inject(Router);
    private readonly cd = inject(ChangeDetectorRef);

    title = "";
    description = "";
    price: number | null = null;
    currency = "EUR";
    selectedType: ListingType = "sell";
    selectedCategoryId = "";
    tags: string[] = [];
    tagInput = "";
    expiresAt: Date | null = null;
    submitting = false;
    error: string | null = null;

    readonly typeOptions: { label: string; value: ListingType }[] = [
        { label: "Verkaufen", value: "sell" },
        { label: "Kaufen (Gesuch)", value: "buy" },
        { label: "Tauschen", value: "trade" },
        { label: "Verschenken", value: "gift" }
    ];

    addTag(): void {
        const t = this.tagInput.trim();
        if (t && !this.tags.includes(t)) {
            this.tags = [...this.tags, t];
        }
        this.tagInput = "";
    }

    removeTag(tag: string): void {
        this.tags = this.tags.filter((t) => t !== tag);
    }

    get flatCategories(): MarketCategory[] {
        const flatten = (cats: MarketCategory[]): MarketCategory[] =>
            cats.flatMap((c) => [c, ...(c.children ? flatten(c.children) : [])]);
        return flatten(this.facade.categories());
    }

    ngOnInit(): void {
        this.facade.loadCategories();
    }

    submit(): void {
        if (!this.title.trim() || !this.description.trim() || !this.selectedCategoryId) return;
        this.submitting = true;
        this.error = null;
        this.facade
            .createListing({
                title: this.title,
                description: this.description,
                price: this.price,
                type: this.selectedType,
                categoryId: this.selectedCategoryId,
                tags: this.tags,
                expiresAt: this.expiresAt?.toISOString() ?? null
            })
            .subscribe({
                next: (listing) => {
                    void this.router.navigate(["/marketplace", listing.id]);
                },
                error: () => {
                    this.error = "Fehler beim Erstellen des Inserats.";
                    this.submitting = false;
                    this.cd.markForCheck();
                }
            });
    }
}
