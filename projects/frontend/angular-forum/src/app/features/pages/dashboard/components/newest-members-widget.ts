import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";

import { DashboardFacade } from "../../../../facade/dashboard/dashboard-facade";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AvatarModule, CardModule, DatePipe, RouterModule, SkeletonModule, TranslocoModule],
    selector: "app-newest-members-widget",
    template: `
        <p-card *transloco="let t">
            <ng-template #title>{{ t("dashboard.newestMembers") }}</ng-template>

            @if (facade.loading()) {
                <div class="flex flex-col gap-3">
                    @for (item of skeletonItems; track item) {
                        <div class="flex items-center gap-3">
                            <p-skeleton shape="circle" size="2rem" />
                            <div class="flex flex-1 flex-col gap-1">
                                <p-skeleton height="0.875rem" width="60%" />
                                <p-skeleton height="0.625rem" width="40%" />
                            </div>
                        </div>
                    }
                </div>
            } @else {
                <div class="flex flex-col gap-3">
                    @for (member of facade.newestMembers(); track member.userId) {
                        <a
                            class="hover:bg-surface-50 dark:hover:bg-surface-800 flex items-center gap-3 rounded-lg p-1 no-underline transition-colors"
                            [routerLink]="['/users', member.userId]"
                        >
                            <p-avatar
                                [label]="member.displayName.charAt(0).toUpperCase()"
                                shape="circle"
                                size="normal"
                                styleClass="shrink-0 bg-primary/10 text-primary font-semibold"
                            />
                            <div class="min-w-0 flex-1">
                                <div
                                    class="text-surface-900 dark:text-surface-0 truncate text-sm font-medium"
                                >
                                    {{ member.displayName }}
                                </div>
                                <div class="text-surface-500 dark:text-surface-400 text-xs">
                                    {{ member.joinedAt | date: "mediumDate" }}
                                </div>
                            </div>
                        </a>
                    } @empty {
                        <p class="text-surface-500 dark:text-surface-400 text-sm">
                            {{ t("dashboard.noMembers") }}
                        </p>
                    }
                </div>
            }
        </p-card>
    `
})
export class NewestMembersWidget {
    protected readonly facade = inject(DashboardFacade);
    protected readonly skeletonItems = [1, 2, 3, 4, 5];
}
