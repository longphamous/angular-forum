import { Injectable } from "@angular/core";

import { MangaSortField } from "../../core/models/manga/manga";

export interface MangaTopListState {
    first: number;
    rows: number;
    sortField: MangaSortField;
    sortOrder: "ASC" | "DESC";
    search: string;
    selectedType: string | null;
    selectedStatus: string | null;
    selectedMinChapters: number | null;
    selectedMaxChapters: number | null;
    selectedMinVolumes: number | null;
    selectedMaxVolumes: number | null;
    selectedMinScore: number | null;
    selectedMaxScore: number | null;
    selectedGenre: string | null;
    selectedNewerThanDays: string | null;
}

export interface MangaDatabaseState {
    first: number;
    rows: number;
    showNewest: boolean;
}

@Injectable({ providedIn: "root" })
export class MangaListStateService {
    private topListState: MangaTopListState | null = null;
    private topListPending = false;

    private databaseState: MangaDatabaseState | null = null;
    private databasePending = false;

    saveTopListState(state: MangaTopListState): void {
        this.topListState = state;
        this.topListPending = true;
    }

    consumeTopListState(): MangaTopListState | null {
        if (!this.topListPending) return null;
        this.topListPending = false;
        return this.topListState;
    }

    clearTopListState(): void {
        this.topListState = null;
        this.topListPending = false;
    }

    saveDatabaseState(state: MangaDatabaseState): void {
        this.databaseState = state;
        this.databasePending = true;
    }

    consumeDatabaseState(): MangaDatabaseState | null {
        if (!this.databasePending) return null;
        this.databasePending = false;
        return this.databaseState;
    }
}
