import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { bootstrapApplication } from "@angular/platform-browser";

import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
import { MockInterceptor } from "./app/core/mocks/mock-interceptor/mock-interceptor";

bootstrapApplication(AppComponent, {
    providers: [
        ...appConfig.providers,
        // HttpClient with interceptor support (so that DI-registered interceptors take effect)
        provideHttpClient(withInterceptorsFromDi()),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MockInterceptor,
            multi: true
        }
    ]
}).catch((err) => {
    console.error("Bootstrap fehlgeschlagen", err);
});
