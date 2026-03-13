import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AvatarModule } from "primeng/avatar";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";

import { DashboardFacade } from "../../../../facade/dashboard/dashboard-facade";

function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "gerade eben";
    if (minutes < 60) return `vor ${minutes} Min.`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours} Std.`;
    const days = Math.floor(hours / 24);
    return `vor ${days} Tag${days === 1 ? "" : "en"}`;
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AvatarModule, CardModule, RouterModule, SkeletonModule, TagModule],
    selector: "app-recent-threads-widget",
    template: `
        <p-card>
            <ng-template #title>Neueste Themen</ng-template>

            @if (facade.loading()) {
                <div class="flex flex-col gap-4">
                    @for (item of skeletonItems; track item) {
                        <div class="flex items-center gap-3">
                            <p-skeleton shape="circle" size="2.5rem" />
                            <div class="flex flex-1 flex-col gap-2">
                                <p-skeleton height="1rem" width="70%" />
                                <p-skeleton height="0.75rem" width="40%" />
                            </div>
                        </div>
                    }
                </div>
            } @else {
                <div class="divide-surface-100 dark:divide-surface-700 flex flex-col divide-y">
                    @for (thread of facade.recentThreads(); track thread.id) {
                        <a
                            class="hover:bg-surface-50 dark:hover:bg-surface-800 -mx-2 flex items-start gap-3 rounded-lg px-2 py-3 no-underline transition-colors first:pt-0 last:pb-0"
                            [routerLink]="['/forum/threads', thread.id]"
                        >
                            <p-avatar
                                [label]="thread.authorName.charAt(0).toUpperCase()"
                                shape="circle"
                                styleClass="shrink-0 bg-primary/10 text-primary font-semibold"
                            />
                            <div class="min-w-0 flex-1">
                                <div class="text-surface-900 dark:text-surface-0 truncate font-medium">
                                    {{ thread.title }}
                                </div>
                                <div class="mt-1 flex flex-wrap items-center gap-2">
                                    <p-tag [value]="thread.forumName" severity="secondary" styleClass="text-xs" />
                                    <span class="text-surface-500 dark:text-surface-400 text-xs">
                                        {{ thread.authorName }}
                                    </span>
                                    <span class="text-surface-400 dark:text-surface-500 text-xs">·</span>
                                    <span
                                        class="text-surface-500 dark:text-surface-400 flex items-center gap-1 text-xs"
                                    >
                                        <i class="pi pi-comment text-xs"></i>
                                        {{ thread.replyCount }}
                                    </span>
                                    <span class="text-surface-400 dark:text-surface-500 text-xs">·</span>
                                    <span class="text-surface-500 dark:text-surface-400 text-xs">
                                        {{ relativeTime(thread.lastPostAt) }}
                                    </span>
                                </div>
                            </div>
                            <i class="pi pi-chevron-right text-surface-300 shrink-0 self-center text-xs"></i>
                        </a>
                    } @empty {
                        <p class="text-surface-500 dark:text-surface-400 text-sm">Keine Themen gefunden.</p>
                    }
                </div>
            }
        </p-card>
    `
})
export class RecentThreadsWidget {
    protected readonly facade = inject(DashboardFacade);
    protected readonly relativeTime = relativeTime;
    protected readonly skeletonItems = [1, 2, 3, 4, 5];
}
