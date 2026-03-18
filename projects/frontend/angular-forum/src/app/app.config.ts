import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import {
    provideRouter,
    withEnabledBlockingInitialNavigation,
    withInMemoryScrolling,
    withNavigationErrorHandler,
    withRouterConfig
} from "@angular/router";
import Aura from "@primeuix/themes/aura";
import { providePrimeNG } from "primeng/config";

import { routes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth.interceptor";

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(
            routes,
            withInMemoryScrolling({ anchorScrolling: "enabled", scrollPositionRestoration: "enabled" }),
            withEnabledBlockingInitialNavigation(),
            withRouterConfig({ canceledNavigationResolution: "replace" }),
            withNavigationErrorHandler((err) => {
                // NavigationSkipped (caused by auth-guard redirects during blocking initial navigation)
                // surfaces as an AbortError unhandled promise rejection — swallow it safely.
                if (err instanceof Error && err.name === "AbortError") return;
                throw err;
            })
        ),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: ".app-dark" } } })
    ]
};
