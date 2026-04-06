import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { Table, TableLazyLoadEvent, TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { Subscription } from "rxjs";

import { MangaFilter, MangaSortField } from "../../../../core/models/manga/manga";
import { MangaFacade } from "../../../../facade/manga/manga-facade";
import { MangaListStateService } from "../../../../facade/manga/manga-list-state.service";

interface SelectOption {
    label: string;
    value: string;
}

@Component({
    selector: "manga-top-list",
    imports: [
        DatePipe,
        FormsModule,
        TableModule,
        TagModule,
        ButtonModule,
        SelectModule,
        InputTextModule,
        InputNumberModule,
        IconFieldModule,
        InputIconModule,
        SkeletonModule,
        MessageModule,
        TooltipModule,
        TranslocoModule
    ],
    templateUrl: "./manga-top-list.html",
    styleUrl: "./manga-top-list.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MangaTopList implements OnInit, OnDestroy {
    @ViewChild("dt") dt!: Table;

    readonly facade = inject(MangaFacade);
    private readonly router = inject(Router);
    private readonly listStateService = inject(MangaListStateService);
    private readonly translocoService = inject(TranslocoService);
    readonly pageSize = 20;

    private langSub?: Subscription;

    // Table binding state (restored from service when navigating back)
    tableFirst = 0;
    tableSortField = "score";
    tableSortOrder = -1;

    readonly typeOptions: SelectOption[] = [
        { label: "Manga", value: "Manga" },
        { label: "Manhwa", value: "Manhwa" },
        { label: "Manhua", value: "Manhua" },
        { label: "Light Novel", value: "Light Novel" },
        { label: "Novel", value: "Novel" },
        { label: "One-shot", value: "One-shot" },
        { label: "Doujinshi", value: "Doujinshi" }
    ];

    readonly statusOptions: SelectOption[] = [
        { label: "Publishing", value: "Publishing" },
        { label: "Finished", value: "Finished" },
        { label: "On Hiatus", value: "On Hiatus" },
        { label: "Discontinued", value: "Discontinued" }
    ];

    // Filter state (bound via ngModel)
    search = "";
    selectedGenre: string | null = null;
    selectedType: string | null = null;
    selectedStatus: string | null = null;
    selectedMinChapters: number | null = null;
    selectedMaxChapters: number | null = null;
    selectedMinVolumes: number | null = null;
    selectedMaxVolumes: number | null = null;
    selectedMinScore: number | null = null;
    selectedMaxScore: number | null = null;
    selectedNewerThanDays: string | null = null;

    newerThanDaysOptions: SelectOption[] = [];

    private currentRows = this.pageSize;
    private sortField: MangaSortField = "score";
    private sortOrder: "ASC" | "DESC" = "DESC";

    ngOnDestroy(): void {
        this.langSub?.unsubscribe();
    }

    ngOnInit(): void {
        this.buildNewerThanDaysOptions();
        this.langSub = this.translocoService.langChanges$.subscribe(() => {
            this.buildNewerThanDaysOptions();
        });
        this.facade.loadGenres();
        const saved = this.listStateService.consumeTopListState();
        if (saved) {
            this.tableFirst = saved.first;
            this.currentRows = saved.rows;
            this.sortField = saved.sortField;
            this.sortOrder = saved.sortOrder;
            this.tableSortField = saved.sortField;
            this.tableSortOrder = saved.sortOrder === "DESC" ? -1 : 1;
            this.search = saved.search;
            this.selectedGenre = saved.selectedGenre;
            this.selectedType = saved.selectedType;
            this.selectedStatus = saved.selectedStatus;
            this.selectedMinChapters = saved.selectedMinChapters;
            this.selectedMaxChapters = saved.selectedMaxChapters;
            this.selectedMinVolumes = saved.selectedMinVolumes;
            this.selectedMaxVolumes = saved.selectedMaxVolumes;
            this.selectedMinScore = saved.selectedMinScore;
            this.selectedMaxScore = saved.selectedMaxScore;
            this.selectedNewerThanDays = saved.selectedNewerThanDays;
        }
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        const first = event.first ?? 0;
        const rows = event.rows ?? this.pageSize;
        const page = Math.floor(first / rows) + 1;
        this.currentRows = rows;
        this.tableFirst = first;

        if (event.sortField) {
            const field = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
            this.sortField = (field as MangaSortField) ?? "rank";
            this.sortOrder = event.sortOrder === -1 ? "DESC" : "ASC";
            this.tableSortField = this.sortField;
            this.tableSortOrder = event.sortOrder ?? -1;
        }

        this.loadData(page);
    }

    applyFilters(): void {
        if (this.dt) {
            this.dt.reset();
        } else {
            this.loadData(1);
        }
    }

    resetFilters(): void {
        this.search = "";
        this.selectedGenre = null;
        this.selectedType = null;
        this.selectedStatus = null;
        this.selectedMinChapters = null;
        this.selectedMaxChapters = null;
        this.selectedMinVolumes = null;
        this.selectedMaxVolumes = null;
        this.selectedMinScore = null;
        this.selectedMaxScore = null;
        this.selectedNewerThanDays = null;
        this.sortField = "score";
        this.sortOrder = "DESC";
        this.tableSortField = "score";
        this.tableSortOrder = -1;
        this.listStateService.clearTopListState();
        this.applyFilters();
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

    getScoreClass(score?: number): string {
        if (!score) return "text-surface-400";
        if (score >= 8) return "text-green-500 font-bold";
        if (score >= 7) return "text-green-400 font-semibold";
        if (score >= 6) return "text-yellow-500";
        return "text-red-400";
    }

    navigateToDetail(id: number): void {
        this.listStateService.saveTopListState({
            first: this.tableFirst,
            rows: this.currentRows,
            sortField: this.sortField,
            sortOrder: this.sortOrder,
            search: this.search,
            selectedGenre: this.selectedGenre,
            selectedType: this.selectedType,
            selectedStatus: this.selectedStatus,
            selectedMinChapters: this.selectedMinChapters,
            selectedMaxChapters: this.selectedMaxChapters,
            selectedMinVolumes: this.selectedMinVolumes,
            selectedMaxVolumes: this.selectedMaxVolumes,
            selectedMinScore: this.selectedMinScore,
            selectedMaxScore: this.selectedMaxScore,
            selectedNewerThanDays: this.selectedNewerThanDays
        });
        void this.router.navigate(["/manga", id]);
    }

    private buildNewerThanDaysOptions(): void {
        this.newerThanDaysOptions = [
            { label: this.translocoService.translate("manga.topList.newerThan.last7days"), value: "7" },
            { label: this.translocoService.translate("manga.topList.newerThan.last30days"), value: "30" },
            { label: this.translocoService.translate("manga.topList.newerThan.last90days"), value: "90" }
        ];
    }

    private loadData(page: number): void {
        const filters: MangaFilter = {
            sortBy: this.sortField,
            sortOrder: this.sortOrder
        };

        if (this.search) filters.search = this.search;
        if (this.selectedGenre) filters.genre = this.selectedGenre;
        if (this.selectedType) filters.type = this.selectedType;
        if (this.selectedStatus) filters.status = this.selectedStatus;
        if (this.selectedMinChapters != null) filters.minChapters = this.selectedMinChapters;
        if (this.selectedMaxChapters != null) filters.maxChapters = this.selectedMaxChapters;
        if (this.selectedMinVolumes != null) filters.minVolumes = this.selectedMinVolumes;
        if (this.selectedMaxVolumes != null) filters.maxVolumes = this.selectedMaxVolumes;
        if (this.selectedMinScore != null) filters.minScore = this.selectedMinScore;
        if (this.selectedMaxScore != null) filters.maxScore = this.selectedMaxScore;
        if (this.selectedNewerThanDays) filters.newerThanDays = Number(this.selectedNewerThanDays);

        this.facade.loadWithFilters(page, this.currentRows, filters);
    }
}
