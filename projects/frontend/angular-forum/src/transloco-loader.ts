import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Translation, TranslocoLoader } from "@jsverse/transloco";

@Injectable({ providedIn: "root" })
export class TranslocoHttpLoader implements TranslocoLoader {
    // TODO: See more under https://lokalise.com/blog/angular-localization-with-transloco/
    private http = inject(HttpClient);

    getTranslation(lang: string) {
        return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
    }
}
