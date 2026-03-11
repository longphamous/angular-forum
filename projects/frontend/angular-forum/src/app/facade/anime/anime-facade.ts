import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";

import { Anime, PaginatedAnime } from "../../core/models/anime/anime";

@Injectable({ providedIn: "root" })
export class AnimeFacade {
    private readonly http = inject(HttpClient);

    private readonly _animeList = signal<Anime[]>([]);
    private readonly _total = signal(0);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);

    readonly animeList: Signal<Anime[]> = this._animeList.asReadonly();
    readonly total: Signal<number> = this._total.asReadonly();
    readonly loading: Signal<boolean> = this._loading.asReadonly();
    readonly error: Signal<string | null> = this._error.asReadonly();

    loadPage(page: number, limit: number): void {
        this._loading.set(true);
        this._error.set(null);

        const params = new HttpParams().set("page", page).set("limit", limit);

        this.http.get<PaginatedAnime>("/api/anime", { params }).subscribe({
            next: (res) => {
                this._animeList.set(res.data);
                this._total.set(res.total);
                this._loading.set(false);
            },
            error: () => {
                this._error.set("Failed to load anime data. Please try again.");
                this._loading.set(false);
            }
        });
    }
}
