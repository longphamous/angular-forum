import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import { BountyFacade } from "../../../facade/gamification/bounty-facade";

@Component({
    selector: "admin-bounty",
    standalone: true,
    imports: [
        DecimalPipe,
        TranslocoModule,
        ButtonModule,
        SkeletonModule,
        TableModule,
        TagModule,
        ToastModule,
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: "./admin-bounty.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminBounty implements OnInit {
    readonly facade = inject(BountyFacade);
    private readonly t = inject(TranslocoService);
    private readonly messageService = inject(MessageService);

    readonly factorDescriptions: Record<string, { icon: string; labelKey: string }> = {
        coins: { icon: "pi pi-bitcoin", labelKey: "bounty.factors.coins" },
        xp: { icon: "pi pi-star", labelKey: "bounty.factors.xp" },
        posts: { icon: "pi pi-comment", labelKey: "bounty.factors.posts" },
        threads: { icon: "pi pi-comments", labelKey: "bounty.factors.threads" },
        reactionsReceived: { icon: "pi pi-heart", labelKey: "bounty.factors.reactions" },
        reactionsGiven: { icon: "pi pi-heart", labelKey: "bounty.factors.reactions" },
        achievements: { icon: "pi pi-trophy", labelKey: "bounty.factors.achievements" },
        lexiconArticles: { icon: "pi pi-book", labelKey: "bounty.factors.lexicon" },
        blogPosts: { icon: "pi pi-file-edit", labelKey: "bounty.factors.blog" },
        galleryUploads: { icon: "pi pi-images", labelKey: "bounty.factors.gallery" },
        clanMemberships: { icon: "pi pi-users", labelKey: "bounty.factors.clans" },
        ticketsResolved: { icon: "pi pi-check-square", labelKey: "bounty.factors.tickets" }
    };

    ngOnInit(): void {
        this.facade.loadConfig();
        this.facade.loadLeaderboard();
    }

    recalculate(): void {
        this.facade.recalculateAll().subscribe({
            next: (result) => {
                this.messageService.add({
                    severity: "success",
                    summary: this.t.translate("bounty.recalculated"),
                    detail: `${result.usersProcessed} ${this.t.translate("bounty.usersProcessed")}`
                });
            }
        });
    }

    getMultiplierEntries(): { key: string; value: number; icon: string; labelKey: string }[] {
        const cfg = this.facade.config();
        if (!cfg) return [];
        return Object.entries(cfg.multipliers).map(([key, value]) => ({
            key,
            value,
            icon: this.factorDescriptions[key]?.icon ?? "pi pi-circle",
            labelKey: this.factorDescriptions[key]?.labelKey ?? key
        }));
    }

    formatBounty(value: number): string {
        if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
        if (value >= 1_000) return (value / 1_000).toFixed(0) + "K";
        return value.toLocaleString();
    }
}
