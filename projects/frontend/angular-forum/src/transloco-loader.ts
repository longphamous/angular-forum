import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Translation, TranslocoLoader } from "@jsverse/transloco";
import { catchError, forkJoin, map, of } from "rxjs";

import { API_CONFIG, ApiConfig } from "./app/core/config/api.config";

/**
 * Custom Transloco loader that loads static JSON translations and merges
 * admin-managed overrides from the backend on top.
 *
 * Static keys serve as defaults; any override stored in the DB takes precedence.
 */
@Injectable({ providedIn: "root" })
export class TranslocoHttpLoader implements TranslocoLoader {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    getTranslation(lang: string) {
        const staticFile$ = this.http.get<Translation>(`/assets/i18n/${lang}.json`);
        const overrides$ = this.http
            .get<Record<string, string>>(`${this.apiConfig.baseUrl}/i18n/overrides/${lang}`)
            .pipe(catchError(() => of({} as Record<string, string>)));

        return forkJoin([staticFile$, overrides$]).pipe(
            map(([staticTranslations, overrides]) => this.mergeOverrides(staticTranslations, overrides))
        );
    }

    /**
     * Deep-merge flat dot-notation override keys into the nested translation object.
     * E.g. override key "login.title" = "Hello" sets translations.login.title = "Hello"
     */
    private mergeOverrides(translations: Translation, overrides: Record<string, string>): Translation {
        const result = { ...translations };
        for (const [dotKey, value] of Object.entries(overrides)) {
            this.setNestedValue(result, dotKey.split("."), value);
        }
        return result;
    }

    private setNestedValue(obj: Record<string, unknown>, keys: string[], value: string): void {
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (typeof current[key] !== "object" || current[key] === null) {
                current[key] = {};
            }
            current = current[key] as Record<string, unknown>;
        }
        current[keys[keys.length - 1]] = value;
    }
}
