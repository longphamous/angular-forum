import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { routes } from "./app.routes";
import { providePrimeNG } from "primeng/config";
import Aura from "@primeuix/themes/aura";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          cssLayer: {
            name: "primeng",
            order: "theme, base, primeng",
          },
        },
      },
    }),
  ],
};
