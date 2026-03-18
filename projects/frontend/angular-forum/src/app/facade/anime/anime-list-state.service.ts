import { Injectable } from "@angular/core";

import { AnimeSortField } from "../../core/models/anime/anime";

export interface AnimeTopListState {
    first: number;
    rows: number;
    sortField: AnimeSortField;
    sortOrder: "ASC" | "DESC";
    search: string;
    selectedType: string | null;
    selectedStatus: string | null;
    selectedSeason: string | null;
    selectedSeasonYear: number | null;
    selectedStartYear: number | null;
    selectedEndYear: number | null;
    selectedSource: string | null;
    selectedRating: string | null;
    selectedMinEpisodes: number | null;
    selectedMaxEpisodes: number | null;
    selectedMinScore: number | null;
    selectedMaxScore: number | null;
    selectedGenre: string | null;
    selectedNewerThanDays: string | null;
}

export interface AnimeDatabaseState {
    first: number;
    rows: number;
    showNewest: boolean;
}

@Injectable({ providedIn: "root" })
export class AnimeListStateService {
    private topListState: AnimeTopListState | null = null;
    private topListPending = false;

    private databaseState: AnimeDatabaseState | null = null;
    private databasePending = false;

    saveTopListState(state: AnimeTopListState): void {
        this.topListState = state;
        this.topListPending = true;
    }

    consumeTopListState(): AnimeTopListState | null {
        if (!this.topListPending) return null;
        this.topListPending = false;
        return this.topListState;
    }

    clearTopListState(): void {
        this.topListState = null;
        this.topListPending = false;
    }

    saveDatabaseState(state: AnimeDatabaseState): void {
        this.databaseState = state;
        this.databasePending = true;
    }

    consumeDatabaseState(): AnimeDatabaseState | null {
        if (!this.databasePending) return null;
        this.databasePending = false;
        return this.databaseState;
    }
}
