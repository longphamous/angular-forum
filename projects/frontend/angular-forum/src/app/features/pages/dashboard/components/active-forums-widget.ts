import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { CardModule } from "primeng/card";
import { ProgressBarModule } from "primeng/progressbar";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";

import { ActiveForum, DashboardFacade } from "../../../../facade/dashboard/dashboard-facade";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CardModule, ProgressBarModule, SkeletonModule, TagModule],
    selector: "app-active-forums-widget",
    template: `
        <p-card>
            <ng-template #title>Aktivste Foren</ng-template>

            @if (facade.loading()) {
                <div class="flex flex-col gap-4">
                    @for (item of skeletonItems; track item) {
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center justify-between">
                                <p-skeleton width="50%" height="1rem" />
                                <p-skeleton width="20%" height="1rem" />
                            </div>
                            <p-skeleton width="100%" height="0.5rem" borderRadius="4px" />
                        </div>
                    }
                </div>
            } @else {
                <div class="flex flex-col gap-4">
                    @for (forum of facade.activeForums(); track forum.id) {
                        <div>
                            <div class="mb-1 flex flex-wrap items-center justify-between gap-2">
                                <div class="flex min-w-0 items-center gap-2">
                                    <span
                                        class="text-surface-900 dark:text-surface-0 truncate text-sm font-medium"
                                    >
                                        {{ forum.name }}
                                    </span>
                                    <p-tag
                                        [value]="forum.categoryName"
                                        severity="secondary"
                                        styleClass="text-xs shrink-0"
                                    />
                                </div>
                                <div
                                    class="text-surface-500 dark:text-surface-400 flex shrink-0 items-center gap-3 text-xs"
                                >
                                    <span class="flex items-center gap-1">
                                        <i class="pi pi-comments text-xs"></i>
                                        {{ forum.threadCount }}
                                    </span>
                                    <span class="flex items-center gap-1">
                                        <i class="pi pi-file-edit text-xs"></i>
                                        {{ forum.postCount }}
                                    </span>
                                </div>
                            </div>
                            <p-progressbar
                                [value]="progressValue(forum)"
                                [showValue]="false"
                                styleClass="h-1.5"
                            />
                        </div>
                    } @empty {
                        <p class="text-surface-500 dark:text-surface-400 text-sm">Keine Foren gefunden.</p>
                    }
                </div>
            }
        </p-card>
    `
})
export class ActiveForumsWidget {
    protected readonly facade = inject(DashboardFacade);
    protected readonly skeletonItems = [1, 2, 3, 4, 5];

    protected progressValue(forum: ActiveForum): number {
        const forums = this.facade.activeForums();
        const max = forums.reduce((m, f) => Math.max(m, f.threadCount), 1);
        return Math.round((forum.threadCount / max) * 100);
    }
}
