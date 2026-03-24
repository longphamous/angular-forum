import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";

import { DashboardFacade } from "../../../../facade/dashboard/dashboard-facade";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CardModule, RouterModule, SkeletonModule, TranslocoModule],
    selector: "app-latest-threads-sidebar-widget",
    template: `
        <p-card *transloco="let t">
            <ng-template #title>{{ t("dashboard.latestThreads") }}</ng-template>

            @if (facade.loading()) {
                <div class="flex flex-col gap-3">
                    @for (item of skeletonItems; track item) {
                        <div class="flex flex-col gap-1">
                            <p-skeleton height="0.875rem" width="80%" />
                            <p-skeleton height="0.625rem" width="40%" />
                        </div>
                    }
                </div>
            } @else {
                <div class="flex flex-col gap-2">
                    @for (thread of latestThreads(); track thread.id) {
                        <a
                            class="hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg p-1.5 no-underline transition-colors"
                            [routerLink]="['/forum/threads', thread.id]"
                        >
                            <div
                                class="text-surface-900 dark:text-surface-0 truncate text-sm font-medium"
                            >
                                {{ thread.title }}
                            </div>
                            <div class="text-surface-500 dark:text-surface-400 mt-0.5 text-xs">
                                {{ relativeTime(thread.lastPostAt) }}
                            </div>
                        </a>
                    } @empty {
                        <p class="text-surface-500 dark:text-surface-400 text-sm">
                            {{ t("dashboard.noThreads") }}
                        </p>
                    }
                </div>
            }
        </p-card>
    `
})
export class LatestThreadsSidebarWidget {
    protected readonly facade = inject(DashboardFacade);
    protected readonly skeletonItems = [1, 2, 3, 4, 5];
    private readonly translocoService = inject(TranslocoService);

    protected readonly latestThreads = computed(() => this.facade.recentThreads().slice(0, 5));

    protected relativeTime(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return this.translocoService.translate("common.justNow");
        if (minutes < 60)
            return this.translocoService.translate("common.minutesAgo", { count: minutes });
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return this.translocoService.translate("common.hoursAgo", { count: hours });
        const days = Math.floor(hours / 24);
        return this.translocoService.translate(
            days === 1 ? "common.daysAgo" : "common.daysAgoPlural",
            { count: days }
        );
    }
}
