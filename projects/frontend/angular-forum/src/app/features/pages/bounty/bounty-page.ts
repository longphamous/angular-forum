import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TooltipModule } from "primeng/tooltip";

import type { WantedPoster } from "../../../core/models/gamification/bounty";
import { WantedPosterComponent } from "../../../core/components/wanted-poster/wanted-poster";
import { BountyFacade } from "../../../facade/gamification/bounty-facade";

@Component({
    selector: "bounty-page",
    standalone: true,
    imports: [DecimalPipe, RouterLink, TranslocoModule, ButtonModule, SkeletonModule, TabsModule, TooltipModule, WantedPosterComponent],
    templateUrl: "./bounty-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BountyPage implements OnInit {
    readonly facade = inject(BountyFacade);
    readonly activeTab = signal("0");

    ngOnInit(): void {
        this.facade.loadLeaderboard();
        this.facade.loadMyPoster();
    }

    breakdownFactors(poster: WantedPoster): { key: string; labelKey: string; value: number }[] {
        return [
            { key: "coins", labelKey: "bounty.factors.coins", value: poster.breakdown.coins },
            { key: "xp", labelKey: "bounty.factors.xp", value: poster.breakdown.xp },
            { key: "posts", labelKey: "bounty.factors.posts", value: poster.breakdown.posts },
            { key: "threads", labelKey: "bounty.factors.threads", value: poster.breakdown.threads },
            { key: "reactions", labelKey: "bounty.factors.reactions", value: poster.breakdown.reactions },
            { key: "achievements", labelKey: "bounty.factors.achievements", value: poster.breakdown.achievements },
            { key: "blog", labelKey: "bounty.factors.blog", value: poster.breakdown.blog },
            { key: "lexicon", labelKey: "bounty.factors.lexicon", value: poster.breakdown.lexicon }
        ].filter((f) => f.value > 0);
    }

    formatBounty(value: number): string {
        if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
        if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
        if (value >= 1_000) return (value / 1_000).toFixed(0) + "K";
        return value.toString();
    }
}
