import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";

import { WantedPosterComponent } from "../../../core/components/wanted-poster/wanted-poster";
import { BountyFacade } from "../../../facade/gamification/bounty-facade";

@Component({
    selector: "bounty-page",
    standalone: true,
    imports: [DecimalPipe, RouterLink, TranslocoModule, ButtonModule, SkeletonModule, TooltipModule, WantedPosterComponent],
    templateUrl: "./bounty-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BountyPage implements OnInit {
    readonly facade = inject(BountyFacade);

    ngOnInit(): void {
        this.facade.loadLeaderboard();
        this.facade.loadMyPoster();
    }

    formatBounty(value: number): string {
        if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
        if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
        if (value >= 1_000) return (value / 1_000).toFixed(0) + "K";
        return value.toString();
    }
}
