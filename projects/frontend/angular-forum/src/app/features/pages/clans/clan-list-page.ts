import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule } from "primeng/paginator";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import type { ClanJoinType } from "../../../core/models/clan/clan";
import { ClanFacade } from "../../../facade/clan/clan-facade";

@Component({
    selector: "clan-list-page",
    standalone: true,
    imports: [
        FormsModule,
        RouterLink,
        TranslocoModule,
        ButtonModule,
        InputTextModule,
        PaginatorModule,
        SelectModule,
        SkeletonModule,
        TagModule,
        TooltipModule
    ],
    templateUrl: "./clan-list-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanListPage implements OnInit {
    readonly facade = inject(ClanFacade);
    private readonly router = inject(Router);
    private readonly t = inject(TranslocoService);

    readonly searchQuery = signal("");
    readonly filterCategory = signal("");
    readonly filterJoinType = signal<ClanJoinType | "">("");
    readonly page = signal(1);
    readonly limit = signal(12);

    readonly joinTypeOptions = computed(() => [
        { label: this.t.translate("common.all"), value: "" },
        { label: this.t.translate("clans.joinTypes.open"), value: "open" },
        { label: this.t.translate("clans.joinTypes.invite"), value: "invite" },
        { label: this.t.translate("clans.joinTypes.application"), value: "application" },
        { label: this.t.translate("clans.joinTypes.moderated"), value: "moderated" }
    ]);

    ngOnInit(): void {
        this.loadClans();
        this.facade.loadCategories();
    }

    loadClans(): void {
        const params: Record<string, string | number> = {
            page: this.page(),
            limit: this.limit()
        };
        if (this.searchQuery()) params["search"] = this.searchQuery();
        if (this.filterCategory()) params["categoryId"] = this.filterCategory();
        if (this.filterJoinType()) params["joinType"] = this.filterJoinType();
        this.facade.loadClans(params);
    }

    onFilterChange(): void {
        this.page.set(1);
        this.loadClans();
    }

    onPageChange(event: { first?: number; rows?: number }): void {
        const first = event.first ?? 0;
        const rows = event.rows ?? this.limit();
        this.page.set(Math.floor(first / rows) + 1);
        this.limit.set(rows);
        this.loadClans();
    }

    openClan(id: string): void {
        this.router.navigate(["/clans", id]);
    }

    joinTypeSeverity(type: ClanJoinType): "success" | "info" | "warn" | "secondary" {
        const map: Record<string, "success" | "info" | "warn" | "secondary"> = {
            open: "success",
            invite: "info",
            application: "warn",
            moderated: "secondary"
        };
        return map[type] ?? "info";
    }
}
