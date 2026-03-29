import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";

import { TICKET_ROUTES } from "../../core/api/ticket.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type { BoardData, BoardMovePayload } from "../../core/models/ticket/board";

@Injectable({ providedIn: "root" })
export class BoardFacade {
    readonly boardData: Signal<BoardData | null>;
    readonly loading: Signal<boolean>;
    readonly error: Signal<string | null>;

    private readonly _boardData = signal<BoardData | null>(null);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.boardData = this._boardData.asReadonly();
        this.loading = this._loading.asReadonly();
        this.error = this._error.asReadonly();
    }

    loadBoard(projectId: string, filters: Record<string, string> = {}): void {
        this._loading.set(true);
        this._error.set(null);

        let params = new HttpParams();
        for (const [key, value] of Object.entries(filters)) {
            if (value) params = params.set(key, value);
        }

        this.http.get<BoardData>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.board(projectId)}`, { params }).subscribe({
            next: (data) => {
                this._boardData.set(data);
                this._loading.set(false);
            },
            error: () => {
                this._error.set("Failed to load board");
                this._loading.set(false);
            }
        });
    }

    moveCard(payload: BoardMovePayload, projectId: string): void {
        this.http
            .patch<{ success: boolean }>(`${this.apiConfig.baseUrl}${TICKET_ROUTES.boardMove()}`, payload)
            .subscribe({
                next: () => this.loadBoard(projectId),
                error: () => this._error.set("Failed to move card")
            });
    }

    clearBoard(): void {
        this._boardData.set(null);
    }
}
