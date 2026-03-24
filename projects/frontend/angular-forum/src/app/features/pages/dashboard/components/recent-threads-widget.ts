import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";

import { DashboardFacade } from "../../../../facade/dashboard/dashboard-facade";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AvatarModule, RouterModule, SkeletonModule, TagModule, TranslocoModule],
    selector: "app-recent-threads-widget",
    template: `
        <div *transloco="let t">
            <h2 class="text-surface-900 dark:text-surface-0 mb-4 text-xl font-semibold">
                {{ t("dashboard.recentThreads") }}
            </h2>

            @if (facade.loading()) {
                <div class="flex flex-col">
                    @for (item of skeletonItems; track item) {
                        <div class="border-surface flex items-center gap-3 border-b py-3">
                            <p-skeleton shape="circle" size="2.5rem" />
                            <div class="flex flex-1 flex-col gap-2">
                                <p-skeleton height="1rem" width="70%" />
                                <p-skeleton height="0.75rem" width="40%" />
                            </div>
                            <p-skeleton height="0.75rem" width="3rem" />
                        </div>
                    }
                </div>
            } @else {
                <div class="flex flex-col">
                    @for (thread of facade.recentThreads(); track thread.id) {
                        <a
                            class="border-surface hover:bg-surface-50 dark:hover:bg-surface-800 flex items-center gap-3 border-b py-3 no-underline transition-colors last:border-b-0"
                            [routerLink]="['/forum/threads', thread.id]"
                        >
                            <!-- Avatar -->
                            <p-avatar
                                [label]="thread.authorName.charAt(0).toUpperCase()"
                                shape="circle"
                                styleClass="shrink-0 bg-primary/10 text-primary font-semibold"
                            />

                            <!-- Center: title + meta -->
                            <div class="min-w-0 flex-1">
                                <div
                                    class="text-surface-900 dark:text-surface-0 truncate text-sm font-bold"
                                >
                                    {{ thread.title }}
                                </div>
                                <div class="mt-0.5 flex flex-wrap items-center gap-1.5">
                                    <span class="text-surface-500 dark:text-surface-400 text-xs">
                                        {{ thread.authorName }}
                                    </span>
                                    <span class="text-surface-400 dark:text-surface-500 text-xs"
                                        >&middot;</span
                                    >
                                    <span class="text-surface-500 dark:text-surface-400 text-xs">
                                        {{ relativeTime(thread.lastPostAt) }}
                                    </span>
                                    <p-tag
                                        [value]="thread.forumName"
                                        severity="secondary"
                                        styleClass="text-xs"
                                    />
                                </div>
                            </div>

                            <!-- Right: reply count + last activity -->
                            <div class="flex shrink-0 flex-col items-end gap-1">
                                <span
                                    class="text-surface-500 dark:text-surface-400 flex items-center gap-1 text-xs"
                                >
                                    <i class="pi pi-comment text-xs"></i>
                                    {{ thread.replyCount }}
                                </span>
                                <span class="text-surface-400 dark:text-surface-500 text-xs">
                                    {{ relativeTime(thread.lastPostAt) }}
                                </span>
                            </div>
                        </a>
                    } @empty {
                        <p class="text-surface-500 dark:text-surface-400 text-sm">
                            {{ t("dashboard.noThreads") }}
                        </p>
                    }
                </div>
            }
        </div>
    `
})
export class RecentThreadsWidget {
    protected readonly facade = inject(DashboardFacade);
    protected readonly skeletonItems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    private readonly translocoService = inject(TranslocoService);

    protected relativeTime(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return this.translocoService.translate("common.justNow");
        if (minutes < 60) return this.translocoService.translate("common.minutesAgo", { count: minutes });
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return this.translocoService.translate("common.hoursAgo", { count: hours });
        const days = Math.floor(hours / 24);
        return this.translocoService.translate(days === 1 ? "common.daysAgo" : "common.daysAgoPlural", {
            count: days
        });
    }
}
