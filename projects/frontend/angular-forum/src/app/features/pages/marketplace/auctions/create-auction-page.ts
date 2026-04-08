import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { SelectModule } from "primeng/select";
import { SelectButtonModule } from "primeng/selectbutton";
import { TextareaModule } from "primeng/textarea";

import { MarketCategory } from "../../../../core/models/marketplace/marketplace";
import { AuthFacade } from "../../../../facade/auth/auth-facade";
import { AuctionFacade } from "../../../../facade/marketplace/auction-facade";
import { MarketplaceFacade } from "../../../../facade/marketplace/marketplace-facade";

@Component({
    selector: "create-auction-page",
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
        SelectButtonModule,
        ChipModule,
        MessageModule
    ],
    templateUrl: "./create-auction-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateAuctionPage implements OnInit {
    readonly facade = inject(AuctionFacade);
    readonly marketFacade = inject(MarketplaceFacade);
    private readonly router = inject(Router);
    private readonly cd = inject(ChangeDetectorRef);
    private readonly authFacade = inject(AuthFacade);
    private readonly transloco = inject(TranslocoService);

    static readonly REQUIRED_LEVEL = 6;
    readonly userLevel = computed(() => this.authFacade.currentUser()?.level ?? 0);
    readonly meetsLevelRequirement = computed(() => this.userLevel() >= CreateAuctionPage.REQUIRED_LEVEL);

    title = "";
    description = "";
    startPrice: number | null = null;
    buyNowPrice: number | null = null;
    currency = "EUR";
    bidIncrement: number | null = 1.0;
    selectedCategoryId = "";
    selectedDuration = 168;
    tags: string[] = [];
    tagInput = "";
    submitting = false;
    error: string | null = null;

    readonly durationOptions = [
        { label: "1 Tag", value: 24 },
        { label: "3 Tage", value: 72 },
        { label: "5 Tage", value: 120 },
        { label: "7 Tage", value: 168 },
        { label: "10 Tage", value: 240 }
    ];

    get flatCategories(): MarketCategory[] {
        const flatten = (cats: MarketCategory[]): MarketCategory[] =>
            cats.flatMap((c) => [c, ...(c.children ? flatten(c.children) : [])]);
        return flatten(this.marketFacade.categories());
    }

    ngOnInit(): void {
        this.marketFacade.loadCategories();
    }

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

    submit(): void {
        if (!this.title.trim() || !this.description.trim() || !this.selectedCategoryId || !this.startPrice) return;
        this.submitting = true;
        this.error = null;
        this.facade
            .createAuction({
                title: this.title,
                description: this.description,
                categoryId: this.selectedCategoryId,
                startPrice: this.startPrice,
                buyNowPrice: this.buyNowPrice,
                currency: this.currency,
                bidIncrement: this.bidIncrement ?? 1.0,
                durationHours: this.selectedDuration,
                tags: this.tags
            })
            .subscribe({
                next: (auction) => {
                    void this.router.navigate(["/marketplace/auctions", auction.id]);
                },
                error: (err: HttpErrorResponse) => {
                    const msg = err.error?.message;
                    if (msg && /requires level/i.test(msg)) {
                        const level = msg.match(/\d+/)?.[0] ?? String(CreateAuctionPage.REQUIRED_LEVEL);
                        this.error = this.transloco.translate("marketplace.levelRequired", { level });
                    } else {
                        this.error = this.transloco.translate("marketplace.errorCreatingAuction");
                    }
                    this.submitting = false;
                    this.cd.markForCheck();
                }
            });
    }
}
