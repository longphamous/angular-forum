import { HttpClient } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { Observable, tap } from "rxjs";

import { RPG_ROUTES } from "../../core/api/rpg.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type { QuestBoard, UserQuest } from "../../core/models/rpg/quest";

@Injectable({ providedIn: "root" })
export class QuestFacade {
    readonly board: Signal<QuestBoard | null>;
    readonly loading: Signal<boolean>;

    private readonly _board = signal<QuestBoard | null>(null);
    private readonly _loading = signal(false);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.board = this._board.asReadonly();
        this.loading = this._loading.asReadonly();
    }

    loadBoard(): void {
        this._loading.set(true);
        this.http.get<QuestBoard>(`${this.apiConfig.baseUrl}${RPG_ROUTES.questBoard()}`).subscribe({
            next: (b) => {
                this._board.set(b);
                this._loading.set(false);
            },
            error: () => {
                this._board.set(null);
                this._loading.set(false);
            }
        });
    }

    claimReward(userQuestId: string): Observable<UserQuest> {
        return this.http
            .post<UserQuest>(`${this.apiConfig.baseUrl}${RPG_ROUTES.claimQuest(userQuestId)}`, {})
            .pipe(tap(() => this.loadBoard()));
    }
}
