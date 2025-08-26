import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { isDevMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideTransloco } from "@jsverse/transloco";

import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
import { MockInterceptor } from "./app/core/mocks/mock-interceptor/mock-interceptor";
import { TranslocoHttpLoader } from "./transloco-loader";

bootstrapApplication(AppComponent, {
    providers: [
        ...appConfig.providers,
        // HttpClient with interceptor support (so that DI-registered interceptors take effect)
        provideHttpClient(withInterceptorsFromDi()),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MockInterceptor,
            multi: true
        },
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
