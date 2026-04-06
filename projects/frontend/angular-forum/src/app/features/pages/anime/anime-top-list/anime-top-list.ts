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

import { AnimeFilter, AnimeSortField } from "../../../../core/models/anime/anime";
import { AnimeFacade } from "../../../../facade/anime/anime-facade";
import { AnimeListStateService } from "../../../../facade/anime/anime-list-state.service";

interface SelectOption {
    label: string;
    value: string;
}

@Component({
    selector: "anime-top-list",
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
    templateUrl: "./anime-top-list.html",
    styleUrl: "./anime-top-list.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimeTopList implements OnInit, OnDestroy {
    @ViewChild("dt") dt!: Table;

    readonly facade = inject(AnimeFacade);
    private readonly router = inject(Router);
    private readonly listStateService = inject(AnimeListStateService);
    private readonly translocoService = inject(TranslocoService);
    readonly pageSize = 20;

    private langSub?: Subscription;

    // Table binding state (restored from service when navigating back)
    tableFirst = 0;
    tableSortField = "mean";
    tableSortOrder = -1;

    readonly typeOptions: SelectOption[] = [
        { label: "TV", value: "TV" },
        { label: "Movie", value: "Movie" },
        { label: "OVA", value: "OVA" },
        { label: "ONA", value: "ONA" },
        { label: "Special", value: "Special" },
        { label: "Music", value: "Music" }
    ];

    readonly statusOptions: SelectOption[] = [
        { label: "Finished Airing", value: "Finished Airing" },
        { label: "Currently Airing", value: "Currently Airing" },
        { label: "Not yet aired", value: "Not yet aired" }
    ];

    seasonOptions: SelectOption[] = [];

    readonly sourceOptions: SelectOption[] = [
        { label: "Manga", value: "Manga" },
        { label: "Light novel", value: "Light novel" },
        { label: "Original", value: "Original" },
        { label: "Game", value: "Game" },
        { label: "Visual novel", value: "Visual novel" },
        { label: "4-Koma Manga", value: "4-koma manga" },
        { label: "Novel", value: "Novel" },
        { label: "Web manga", value: "Web manga" },
        { label: "Web novel", value: "Web novel" },
        { label: "Music", value: "Music" },
        { label: "Book", value: "Book" },
        { label: "Card game", value: "Card game" },
        { label: "Mixed media", value: "Mixed media" },
        { label: "Other", value: "Other" }
    ];

    readonly ratingOptions: SelectOption[] = [
        { label: "G - All Ages", value: "G - All Ages" },
        { label: "PG - Children", value: "PG - Children" },
        { label: "PG-13 - Teens 13 or older", value: "PG-13 - Teens 13 or older" },
        { label: "R - 17+ (violence & profanity)", value: "R - 17+ (violence & profanity)" },
        { label: "R+ - Mild Nudity", value: "R+ - Mild Nudity" },
        { label: "Rx - Hentai", value: "Rx - Hentai" }
    ];

    // Filter state (bound via ngModel)
    search = "";
    selectedGenre: string | null = null;
    selectedType: string | null = null;
    selectedStatus: string | null = null;
    selectedSeason: string | null = null;
    selectedSeasonYear: number | null = null;
    selectedStartYear: number | null = null;
    selectedEndYear: number | null = null;
    selectedSource: string | null = null;
    selectedRating: string | null = null;
    selectedMinEpisodes: number | null = null;
    selectedMaxEpisodes: number | null = null;
    selectedMinScore: number | null = null;
    selectedMaxScore: number | null = null;
    selectedNewerThanDays: string | null = null;

    newerThanDaysOptions: SelectOption[] = [];

    private currentRows = this.pageSize;
    private sortField: AnimeSortField = "mean";
    private sortOrder: "ASC" | "DESC" = "DESC";

    ngOnDestroy(): void {
        this.langSub?.unsubscribe();
    }

    ngOnInit(): void {
        this.buildSeasonOptions();
        this.buildNewerThanDaysOptions();
        this.langSub = this.translocoService.langChanges$.subscribe(() => {
            this.buildSeasonOptions();
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
            this.selectedSeason = saved.selectedSeason;
            this.selectedSeasonYear = saved.selectedSeasonYear;
            this.selectedStartYear = saved.selectedStartYear;
            this.selectedEndYear = saved.selectedEndYear;
            this.selectedSource = saved.selectedSource;
            this.selectedRating = saved.selectedRating;
            this.selectedMinEpisodes = saved.selectedMinEpisodes;
            this.selectedMaxEpisodes = saved.selectedMaxEpisodes;
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
            this.sortField = (field as AnimeSortField) ?? "rank";
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
        this.selectedSeason = null;
        this.selectedSeasonYear = null;
        this.selectedStartYear = null;
        this.selectedEndYear = null;
        this.selectedSource = null;
        this.selectedRating = null;
        this.selectedMinEpisodes = null;
        this.selectedMaxEpisodes = null;
        this.selectedMinScore = null;
        this.selectedMaxScore = null;
        this.selectedNewerThanDays = null;
        this.sortField = "mean";
        this.sortOrder = "DESC";
        this.tableSortField = "mean";
        this.tableSortOrder = -1;
        this.listStateService.clearTopListState();
        this.applyFilters();
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
            selectedSeason: this.selectedSeason,
            selectedSeasonYear: this.selectedSeasonYear,
            selectedStartYear: this.selectedStartYear,
            selectedEndYear: this.selectedEndYear,
            selectedSource: this.selectedSource,
            selectedRating: this.selectedRating,
            selectedMinEpisodes: this.selectedMinEpisodes,
            selectedMaxEpisodes: this.selectedMaxEpisodes,
            selectedMinScore: this.selectedMinScore,
            selectedMaxScore: this.selectedMaxScore,
            selectedNewerThanDays: this.selectedNewerThanDays
        });
        void this.router.navigate(["/anime", id]);
    }

    private buildSeasonOptions(): void {
        this.seasonOptions = [
            { label: this.translocoService.translate("anime.topList.seasons.spring"), value: "spring" },
            { label: this.translocoService.translate("anime.topList.seasons.summer"), value: "summer" },
            { label: this.translocoService.translate("anime.topList.seasons.fall"), value: "fall" },
            { label: this.translocoService.translate("anime.topList.seasons.winter"), value: "winter" }
        ];
    }

    private buildNewerThanDaysOptions(): void {
        this.newerThanDaysOptions = [
            { label: this.translocoService.translate("anime.topList.newerThan.last7days"), value: "7" },
            { label: this.translocoService.translate("anime.topList.newerThan.last30days"), value: "30" },
            { label: this.translocoService.translate("anime.topList.newerThan.last90days"), value: "90" }
        ];
    }

    private loadData(page: number): void {
        const filters: AnimeFilter = {
            sortBy: this.sortField,
            sortOrder: this.sortOrder
        };

        if (this.search) filters.search = this.search;
        if (this.selectedGenre) filters.genre = this.selectedGenre;
        if (this.selectedType) filters.type = this.selectedType;
        if (this.selectedStatus) filters.status = this.selectedStatus;
        if (this.selectedSeason) filters.season = this.selectedSeason;
        if (this.selectedSeasonYear != null) filters.seasonYear = this.selectedSeasonYear;
        if (this.selectedStartYear != null) filters.startYear = this.selectedStartYear;
        if (this.selectedEndYear != null) filters.endYear = this.selectedEndYear;
        if (this.selectedSource) filters.source = this.selectedSource;
        if (this.selectedRating) filters.rating = this.selectedRating;
        if (this.selectedMinEpisodes != null) filters.minEpisodes = this.selectedMinEpisodes;
        if (this.selectedMaxEpisodes != null) filters.maxEpisodes = this.selectedMaxEpisodes;
        if (this.selectedMinScore != null) filters.minScore = this.selectedMinScore;
        if (this.selectedMaxScore != null) filters.maxScore = this.selectedMaxScore;
        if (this.selectedNewerThanDays) filters.newerThanDays = Number(this.selectedNewerThanDays);

        this.facade.loadWithFilters(page, this.currentRows, filters);
    }
}
