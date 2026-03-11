import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";

import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { AnimeFacade } from "../../../../facade/anime/anime-facade";

@Component({
    selector: "anime-database",
    imports: [TableModule, TagModule, ButtonModule, SkeletonModule, TooltipModule, MessageModule],
    templateUrl: "./anime-database.html",
    styleUrl: "./anime-database.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimeDatabase implements OnInit {
    readonly facade = inject(AnimeFacade);
    readonly pageSize = 20;

    ngOnInit(): void {
        this.facade.loadPage(1, this.pageSize);
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        const first = event.first ?? 0;
        const rows = event.rows ?? this.pageSize;
        const page = Math.floor(first / rows) + 1;
        this.facade.loadPage(page, rows);
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

    getScoreClass(mean?: number): string {
        if (!mean) return "text-surface-400";
        if (mean >= 8) return "text-green-500 font-bold";
        if (mean >= 7) return "text-green-400 font-semibold";
        if (mean >= 6) return "text-yellow-500";
        return "text-red-400";
    }
}
