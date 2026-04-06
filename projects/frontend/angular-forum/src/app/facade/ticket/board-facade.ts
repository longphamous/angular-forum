import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { retry, timer } from "rxjs";

import { TICKET_ROUTES } from "../../core/api/ticket.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type { BoardData, BoardMovePayload } from "../../core/models/ticket/board";

export type BoardErrorCode = "not_found" | "server_error" | null;

@Injectable({ providedIn: "root" })
export class BoardFacade {
    readonly boardData: Signal<BoardData | null>;
    readonly loading: Signal<boolean>;
    readonly error: Signal<string | null>;
    readonly errorCode: Signal<BoardErrorCode>;

    private readonly _boardData = signal<BoardData | null>(null);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly _errorCode = signal<BoardErrorCode>(null);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.boardData = this._boardData.asReadonly();
        this.loading = this._loading.asReadonly();
        this.error = this._error.asReadonly();
        this.errorCode = this._errorCode.asReadonly();
    }

    loadBoard(projectId: string, filters: Record<string, string> = {}): void {
        this._loading.set(true);
        this._error.set(null);
        this._errorCode.set(null);

        let params = new HttpParams();
        for (const [key, value] of Object.entries(filters)) {
            if (value) params = params.set(key, value);
        }

        const url = `${this.apiConfig.baseUrl}${TICKET_ROUTES.board(projectId)}`;

        this.http
            .get<BoardData>(url, { params })
            .pipe(
                retry({
                    count: 2,
                    delay: (error: HttpErrorResponse, retryCount: number) => {
                        if ([502, 503, 504, 0].includes(error.status)) {
                            return timer(1000 * retryCount);
                        }
                        throw error;
                    }
                })
            )
            .subscribe({
                next: (data) => {
                    this._boardData.set(data);
                    this._loading.set(false);
                },
                error: (err: HttpErrorResponse) => {
                    const code: BoardErrorCode = err.status === 404 ? "not_found" : "server_error";
                    this._errorCode.set(code);
                    this._error.set(code);
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
