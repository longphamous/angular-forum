import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { TranslocoModule } from "@jsverse/transloco";
import { CardModule } from "primeng/card";

import { DashboardFacade } from "../../../../facade/dashboard/dashboard-facade";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CardModule, TranslocoModule],
    selector: "app-dashboard-stats-widget",
    template: `
        <ng-container *transloco="let t">
            <!-- Threads -->
            <div class="col-span-12 sm:col-span-6 lg:col-span-3">
                <p-card styleClass="h-full">
                    <div class="flex items-start justify-between">
                        <div class="flex flex-col gap-1">
                            <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">{{
                                t("dashboard.threads")
                            }}</span>
                            <span class="text-surface-900 dark:text-surface-0 text-3xl font-bold">
                                @if (facade.loading()) {
                                    —
                                } @else {
                                    {{ facade.stats()?.threadCount ?? 0 }}
                                }
                            </span>
                        </div>
                        <div
                            class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-400/10"
                        >
                            <i class="pi pi-comments text-xl text-blue-500"></i>
                        </div>
                    </div>
                    <div class="mt-4">
                        <span class="text-primary text-sm font-semibold">+5%</span>
                    </div>
                </p-card>
            </div>

            <!-- Beiträge -->
            <div class="col-span-12 sm:col-span-6 lg:col-span-3">
                <p-card styleClass="h-full">
                    <div class="flex items-start justify-between">
                        <div class="flex flex-col gap-1">
                            <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">{{
                                t("dashboard.posts")
                            }}</span>
                            <span class="text-surface-900 dark:text-surface-0 text-3xl font-bold">
                                @if (facade.loading()) {
                                    —
                                } @else {
                                    {{ facade.stats()?.postCount ?? 0 }}
                                }
                            </span>
                        </div>
                        <div
                            class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-400/10"
                        >
                            <i class="pi pi-file-edit text-xl text-green-500"></i>
                        </div>
                    </div>
                    <div class="mt-4">
                        <span class="text-sm font-semibold text-green-500">+12%</span>
                    </div>
                </p-card>
            </div>

            <!-- Mitglieder -->
            <div class="col-span-12 sm:col-span-6 lg:col-span-3">
                <p-card styleClass="h-full">
                    <div class="flex items-start justify-between">
                        <div class="flex flex-col gap-1">
                            <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">{{
                                t("dashboard.stats.users")
                            }}</span>
                            <span class="text-surface-900 dark:text-surface-0 text-3xl font-bold">
                                @if (facade.loading()) {
                                    —
                                } @else {
                                    {{ facade.stats()?.userCount ?? 0 }}
                                }
                            </span>
                        </div>
                        <div
                            class="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-400/10"
                        >
                            <i class="pi pi-users text-xl text-orange-500"></i>
                        </div>
                    </div>
                    <div class="mt-4">
                        <span class="text-sm font-semibold text-orange-500">+3%</span>
                    </div>
                </p-card>
            </div>

            <!-- Anime -->
            <div class="col-span-12 sm:col-span-6 lg:col-span-3">
                <p-card styleClass="h-full">
                    <div class="flex items-start justify-between">
                        <div class="flex flex-col gap-1">
                            <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">{{
                                t("nav.anime")
                            }}</span>
                            <span class="text-surface-900 dark:text-surface-0 text-3xl font-bold">
                                @if (facade.loading()) {
                                    —
                                } @else {
                                    {{ facade.stats()?.animeCount ?? 0 }}
                                }
                            </span>
                        </div>
                        <div
                            class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-400/10"
                        >
                            <i class="pi pi-star text-xl text-purple-500"></i>
                        </div>
                    </div>
                    <div class="mt-4">
                        <span class="text-sm font-semibold text-purple-500">+8%</span>
                    </div>
                </p-card>
            </div>
        </ng-container>
    `
})
export class DashboardStatsWidget {
    protected readonly facade = inject(DashboardFacade);
}
