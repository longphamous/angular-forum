import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";

import { DashboardFacade } from "../../../../facade/dashboard/dashboard-facade";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CardModule, RouterModule, SkeletonModule, TagModule],
    selector: "app-newest-anime-widget",
    template: `
        <p-card>
            <ng-template #title>Neueste Anime</ng-template>

            @if (facade.loading()) {
                <div class="flex flex-col gap-4">
                    @for (item of skeletonItems; track item) {
                        <div class="flex items-center gap-3">
                            <p-skeleton borderRadius="4px" height="4rem" width="3rem" />
                            <div class="flex flex-1 flex-col gap-2">
                                <p-skeleton height="1rem" width="65%" />
                                <p-skeleton height="0.75rem" width="35%" />
                            </div>
                        </div>
                    }
                </div>
            } @else {
                <div class="divide-surface-100 dark:divide-surface-700 flex flex-col divide-y">
                    @for (anime of facade.newestAnime(); track anime.id) {
                        <a
                            class="hover:bg-surface-50 dark:hover:bg-surface-800 -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 no-underline transition-colors first:pt-0 last:pb-0"
                            [routerLink]="['/anime', anime.id]"
                        >
                            <div class="group relative shrink-0">
                                @if (anime.picture) {
                                    <img
                                        class="h-16 w-12 rounded object-cover"
                                        [alt]="anime.title ?? 'Anime'"
                                        [src]="anime.picture"
                                    />
                                    <div
                                        class="pointer-events-none absolute top-0 left-full z-50 ml-2 hidden w-36 group-hover:block"
                                    >
                                        <img
                                            class="w-full rounded-lg object-cover shadow-xl"
                                            [alt]="anime.title ?? 'Anime'"
                                            [src]="anime.picture"
                                            style="aspect-ratio: 2/3"
                                        />
                                    </div>
                                } @else {
                                    <div
                                        class="bg-surface-100 dark:bg-surface-700 flex h-16 w-12 items-center justify-center rounded"
                                    >
                                        <i class="pi pi-image text-surface-400 dark:text-surface-500 text-xl"></i>
                                    </div>
                                }
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="text-surface-900 dark:text-surface-0 truncate font-medium">
                                    {{ anime.titleEnglish || anime.title || "Unbekannt" }}
                                </div>
                                <div class="mt-1 flex flex-wrap items-center gap-2">
                                    @if (anime.type) {
                                        <p-tag [value]="anime.type" severity="info" styleClass="text-xs" />
                                    }
                                    @if (anime.seasonYear) {
                                        <span class="text-surface-500 dark:text-surface-400 text-xs">
                                            {{ anime.seasonYear }}
                                        </span>
                                    } @else if (anime.startYear) {
                                        <span class="text-surface-500 dark:text-surface-400 text-xs">
                                            {{ anime.startYear }}
                                        </span>
                                    }
                                </div>
                            </div>
                            <i class="pi pi-chevron-right text-surface-300 text-xs"></i>
                        </a>
                    } @empty {
                        <p class="text-surface-500 dark:text-surface-400 text-sm">Keine Anime gefunden.</p>
                    }
                </div>
            }
        </p-card>
    `
})
export class NewestAnimeWidget {
    protected readonly facade = inject(DashboardFacade);
    protected readonly skeletonItems = [1, 2, 3, 4, 5];
}
