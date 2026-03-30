import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";

import { AuctionFacade } from "../../../../facade/marketplace/auction-facade";

@Component({
    selector: "my-bids-page",
    standalone: true,
    imports: [RouterModule, TranslocoModule, ButtonModule, TabsModule, TagModule, DatePipe],
    templateUrl: "./my-bids-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyBidsPage implements OnInit {
    readonly facade = inject(AuctionFacade);

    ngOnInit(): void {
        this.facade.loadMyBids();
        this.facade.loadWatchlist();
    }

    formatPrice(amount: number, currency = "EUR"): string {
        return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount);
    }
}
