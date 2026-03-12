import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { isDevMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideTransloco } from "@jsverse/transloco";

import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
import { API_CONFIG } from "./app/core/config/api.config";
import { MockInterceptor } from "./app/core/mocks/mock-interceptor/mock-interceptor";
import { environment } from "./environments/environment";
import { TranslocoHttpLoader } from "./transloco-loader";

const mockProvider = environment.useMock
    ? [
          {
              provide: HTTP_INTERCEPTORS,
              useClass: MockInterceptor,
              multi: true
          }
      ]
    : [];

console.info(`[bootstrap] Mock-Interceptor: ${environment.useMock ? "aktiv" : "deaktiviert"}`);

bootstrapApplication(AppComponent, {
    providers: [
        ...appConfig.providers,
        { provide: API_CONFIG, useValue: environment.api },
        // HttpClient with interceptor support (so that DI-registered interceptors take effect)
        provideHttpClient(withInterceptorsFromDi()),
        ...mockProvider,
        provideTransloco({
            config: {
                availableLangs: ["en", "de"],
                defaultLang: "en",
                fallbackLang: "en",
                // Remove this option if your application doesn't support changing language in runtime.
                reRenderOnLangChange: true,
                prodMode: !isDevMode()
            },
            loader: TranslocoHttpLoader
        })
    ]
}).catch((err) => {
    console.error("Bootstrap fehlgeschlagen", err);
});
