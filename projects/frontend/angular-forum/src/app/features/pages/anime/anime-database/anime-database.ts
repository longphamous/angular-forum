import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { AnimeFacade } from "../../../../facade/anime/anime-facade";
import { AnimeListStateService } from "../../../../facade/anime/anime-list-state.service";

@Component({
    selector: "anime-database",
    imports: [TableModule, TagModule, ButtonModule, SkeletonModule, TooltipModule, MessageModule, TranslocoModule],
    templateUrl: "./anime-database.html",
    styleUrl: "./anime-database.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimeDatabase implements OnInit {
    readonly facade = inject(AnimeFacade);
    readonly pageSize = 20;
    private readonly router = inject(Router);
    private readonly listStateService = inject(AnimeListStateService);

    tableFirst = 0;
    showNewest = false;
    private currentRows = this.pageSize;

    ngOnInit(): void {
        const saved = this.listStateService.consumeDatabaseState();
        if (saved) {
            this.tableFirst = saved.first;
            this.currentRows = saved.rows;
            this.showNewest = saved.showNewest;
        } else {
            this.loadCurrentPage(1, this.pageSize);
        }
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        const first = event.first ?? 0;
        const rows = event.rows ?? this.pageSize;
        const page = Math.floor(first / rows) + 1;
        this.tableFirst = first;
        this.currentRows = rows;
        this.loadCurrentPage(page, rows);
    }

    toggleNewest(): void {
        this.showNewest = !this.showNewest;
        this.tableFirst = 0;
        this.loadCurrentPage(1, this.currentRows);
    }

    private loadCurrentPage(page: number, rows: number): void {
        if (this.showNewest) {
            this.facade.loadWithFilters(page, rows, { sortBy: "createdAt", sortOrder: "DESC" });
        } else {
            this.facade.loadPage(page, rows);
        }
    }

    formatDate(year?: number, month?: number, day?: number): string {
        if (!year) return "—";
        if (!month) return year.toString();
        if (!day) return `${year}-${String(month).padStart(2, "0")}`;
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    formatSeason(season?: string, year?: number): string {
        if (!season && !year) return "—";
        const parts: string[] = [];
        if (season) parts.push(season.charAt(0).toUpperCase() + season.slice(1).toLowerCase());
        if (year) parts.push(year.toString());
        return parts.join(" ");
    }

    getTypeSeverity(type?: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
        switch (type?.toLowerCase()) {
            case "tv":
                return "info";
            case "movie":
                return "contrast";
            case "ova":
            case "ona":
                return "secondary";
            case "special":
                return "warn";
            case "music":
                return "danger";
            default:
                return "secondary";
        }
    }

    getStatusSeverity(status?: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
        switch (status?.toLowerCase()) {
            case "currently airing":
                return "success";
            case "finished airing":
                return "secondary";
            case "not yet aired":
                return "warn";
            default:
                return "info";
        }
    }

    navigateToDetail(id: number): void {
        this.listStateService.saveDatabaseState({
            first: this.tableFirst,
            rows: this.currentRows,
            showNewest: this.showNewest
        });
        void this.router.navigate(["/anime", id]);
    }

    getScoreClass(mean?: number): string {
        if (!mean) return "text-surface-400";
        if (mean >= 8) return "text-green-500 font-bold";
        if (mean >= 7) return "text-green-400 font-semibold";
        if (mean >= 6) return "text-yellow-500";
        return "text-red-400";
    }
}
