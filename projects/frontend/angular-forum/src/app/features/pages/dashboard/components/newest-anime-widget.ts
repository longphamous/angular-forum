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
                            class="flex items-center gap-3 py-3 no-underline first:pt-0 last:pb-0 hover:opacity-80"
                            routerLink="/anime"
                        >
                            @if (anime.picture) {
                                <img
                                    class="h-16 w-12 shrink-0 rounded object-cover"
                                    [alt]="anime.title ?? 'Anime'"
                                    [src]="anime.picture"
                                />
                            } @else {
                                <div
                                    class="bg-surface-100 dark:bg-surface-700 flex h-16 w-12 shrink-0 items-center justify-center rounded"
                                >
                                    <i class="pi pi-image text-surface-400 dark:text-surface-500 text-xl"></i>
                                </div>
                            }
                            <div class="min-w-0 flex-1">
                                <div class="text-surface-900 dark:text-surface-0 truncate font-medium">
                                    {{ anime.title ?? "Unbekannt" }}
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
