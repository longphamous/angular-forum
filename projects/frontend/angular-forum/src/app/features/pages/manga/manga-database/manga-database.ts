import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { MangaFacade } from "../../../../facade/manga/manga-facade";
import { MangaListStateService } from "../../../../facade/manga/manga-list-state.service";

@Component({
    selector: "manga-database",
    imports: [TableModule, TagModule, ButtonModule, SkeletonModule, TooltipModule, MessageModule, TranslocoModule],
    templateUrl: "./manga-database.html",
    styleUrl: "./manga-database.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MangaDatabase implements OnInit {
    readonly facade = inject(MangaFacade);
    readonly pageSize = 20;
    private readonly router = inject(Router);
    private readonly listStateService = inject(MangaListStateService);

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

    getTypeSeverity(type?: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
        switch (type?.toLowerCase()) {
            case "manga":
                return "info";
            case "manhwa":
                return "contrast";
            case "light novel":
                return "warn";
            case "novel":
                return "secondary";
            case "one-shot":
                return "danger";
            case "doujinshi":
                return "secondary";
            case "manhua":
                return "success";
            default:
                return "secondary";
        }
    }

    getStatusSeverity(status?: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
        switch (status?.toLowerCase()) {
            case "publishing":
                return "success";
            case "finished":
                return "secondary";
            case "on hiatus":
                return "warn";
            case "discontinued":
                return "danger";
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
        void this.router.navigate(["/manga", id]);
    }

    getScoreClass(score?: number): string {
        if (!score) return "text-surface-400";
        if (score >= 8) return "text-green-500 font-bold";
        if (score >= 7) return "text-green-400 font-semibold";
        if (score >= 6) return "text-yellow-500";
        return "text-red-400";
    }
}
