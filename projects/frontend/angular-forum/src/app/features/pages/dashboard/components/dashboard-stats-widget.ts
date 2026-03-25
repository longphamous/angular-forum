import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { TranslocoModule } from "@jsverse/transloco";
import { CardModule } from "primeng/card";

import { DashboardFacade } from "../../../../facade/dashboard/dashboard-facade";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CardModule, TranslocoModule],
    selector: "app-dashboard-stats-widget",
    template: `
        <p-card *transloco="let t">
            <div class="grid grid-cols-3 gap-4 text-center">
                <!-- Threads -->
                <div class="flex flex-col items-center gap-1">
                    <div
                        class="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-400/10"
                    >
                        <i class="pi pi-comments text-blue-500"></i>
                    </div>
                    <span class="text-surface-900 dark:text-surface-0 text-xl font-bold">
                        @if (facade.loading()) {
                            —
                        } @else {
                            {{ facade.stats()?.threadCount ?? 0 }}
                        }
                    </span>
                    <span class="text-surface-500 dark:text-surface-400 text-xs">{{ t("dashboard.threads") }}</span>
                </div>

                <!-- Posts -->
                <div class="flex flex-col items-center gap-1">
                    <div
                        class="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-400/10"
                    >
                        <i class="pi pi-file-edit text-green-500"></i>
                    </div>
                    <span class="text-surface-900 dark:text-surface-0 text-xl font-bold">
                        @if (facade.loading()) {
                            —
                        } @else {
                            {{ facade.stats()?.postCount ?? 0 }}
                        }
                    </span>
                    <span class="text-surface-500 dark:text-surface-400 text-xs">{{ t("dashboard.posts") }}</span>
                </div>

                <!-- Members -->
                <div class="flex flex-col items-center gap-1">
                    <div
                        class="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-400/10"
                    >
                        <i class="pi pi-users text-orange-500"></i>
                    </div>
                    <span class="text-surface-900 dark:text-surface-0 text-xl font-bold">
                        @if (facade.loading()) {
                            —
                        } @else {
                            {{ facade.stats()?.userCount ?? 0 }}
                        }
                    </span>
                    <span class="text-surface-500 dark:text-surface-400 text-xs">{{ t("dashboard.stats.users") }}</span>
                </div>
            </div>
        </p-card>
    `
})
export class DashboardStatsWidget {
    protected readonly facade = inject(DashboardFacade);
}
