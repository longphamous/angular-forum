import { HttpClient } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";
import { Observable, tap } from "rxjs";

import { I18N_ROUTES } from "../../core/api/i18n.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import type { I18nSettings, TranslationOverride, UpsertTranslationPayload } from "../../core/models/i18n/i18n";

@Injectable({ providedIn: "root" })
export class I18nFacade {
    readonly settings: Signal<I18nSettings | null>;
    readonly overrides: Signal<TranslationOverride[]>;
    readonly loading: Signal<boolean>;
    readonly error: Signal<string | null>;

    private readonly _settings = signal<I18nSettings | null>(null);
    private readonly _overrides = signal<TranslationOverride[]>([]);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    constructor() {
        this.settings = this._settings.asReadonly();
        this.overrides = this._overrides.asReadonly();
        this.loading = this._loading.asReadonly();
        this.error = this._error.asReadonly();
    }

    loadSettings(): void {
        this.http.get<I18nSettings>(`${this.apiConfig.baseUrl}${I18N_ROUTES.settings()}`).subscribe({
            next: (s) => this._settings.set(s),
            error: () => this._error.set("Failed to load i18n settings")
        });
    }

    updateSettings(payload: Partial<I18nSettings>): Observable<I18nSettings> {
        return this.http
            .patch<I18nSettings>(`${this.apiConfig.baseUrl}${I18N_ROUTES.settings()}`, payload)
            .pipe(tap((s) => this._settings.set(s)));
    }

    loadOverrides(): void {
        this._loading.set(true);
        this._error.set(null);
        this.http.get<TranslationOverride[]>(`${this.apiConfig.baseUrl}${I18N_ROUTES.overrides()}`).subscribe({
            next: (data) => {
                this._overrides.set(data);
                this._loading.set(false);
            },
            error: () => {
                this._error.set("Failed to load translation overrides");
                this._loading.set(false);
            }
        });
    }

    upsert(payload: UpsertTranslationPayload): Observable<TranslationOverride> {
        return this.http.post<TranslationOverride>(`${this.apiConfig.baseUrl}${I18N_ROUTES.overrides()}`, payload).pipe(
            tap((saved) => {
                this._overrides.update((list) => {
                    const idx = list.findIndex((o) => o.key === saved.key && o.locale === saved.locale);
                    if (idx >= 0) {
                        const updated = [...list];
                        updated[idx] = saved;
                        return updated;
                    }
                    return [...list, saved];
                });
            })
        );
    }

    bulkUpsert(translations: UpsertTranslationPayload[]): Observable<TranslationOverride[]> {
        return this.http
            .post<TranslationOverride[]>(`${this.apiConfig.baseUrl}${I18N_ROUTES.overridesBulk()}`, { translations })
            .pipe(tap(() => this.loadOverrides()));
    }

    deleteOverride(id: string): Observable<{ success: boolean }> {
        return this.http
            .delete<{ success: boolean }>(`${this.apiConfig.baseUrl}${I18N_ROUTES.overrideDetail(id)}`)
            .pipe(
                tap(() => {
                    this._overrides.update((list) => list.filter((o) => o.id !== id));
                })
            );
    }
}
