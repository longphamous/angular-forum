import { HttpClient } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { Observable, tap } from "rxjs";

import { RPG_ROUTES } from "../../core/api/rpg.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type { QuestBoard, UserQuest } from "../../core/models/rpg/quest";

@Injectable({ providedIn: "root" })
export class QuestFacade {
    readonly board: Signal<QuestBoard | null>;
    readonly completedQuests: Signal<UserQuest[]>;
    readonly loading: Signal<boolean>;
    readonly loadingCompleted: Signal<boolean>;

    private readonly _board = signal<QuestBoard | null>(null);
    private readonly _completedQuests = signal<UserQuest[]>([]);
    private readonly _loading = signal(false);
    private readonly _loadingCompleted = signal(false);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.board = this._board.asReadonly();
        this.completedQuests = this._completedQuests.asReadonly();
        this.loading = this._loading.asReadonly();
        this.loadingCompleted = this._loadingCompleted.asReadonly();
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

    loadCompleted(): void {
        this._loadingCompleted.set(true);
        this.http.get<UserQuest[]>(`${this.apiConfig.baseUrl}${RPG_ROUTES.questCompleted()}`).subscribe({
            next: (quests) => {
                this._completedQuests.set(quests);
                this._loadingCompleted.set(false);
            },
            error: () => {
                this._completedQuests.set([]);
                this._loadingCompleted.set(false);
            }
        });
    }

    claimReward(userQuestId: string): Observable<UserQuest> {
        return this.http
            .post<UserQuest>(`${this.apiConfig.baseUrl}${RPG_ROUTES.claimQuest(userQuestId)}`, {})
            .pipe(tap(() => this.loadBoard()));
    }
}
