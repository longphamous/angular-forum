import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";

import { DashboardFacade } from "../../../../facade/dashboard/dashboard-facade";

interface RankStyle {
    bg: string;
    label: string;
    text: string;
}

const RANK_STYLES: RankStyle[] = [
    { bg: "bg-yellow-100 dark:bg-yellow-400/10", label: "adminAchievements.rarities.gold", text: "text-yellow-600 dark:text-yellow-400" },
    { bg: "bg-surface-100 dark:bg-surface-700", label: "adminAchievements.rarities.silver", text: "text-surface-500 dark:text-surface-400" },
    { bg: "bg-orange-100 dark:bg-orange-400/10", label: "adminAchievements.rarities.bronze", text: "text-orange-600 dark:text-orange-400" }
];

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AvatarModule, CardModule, RouterModule, SkeletonModule, TagModule, TranslocoModule],
    selector: "app-top-posters-widget",
    template: `
        <p-card *transloco="let t">
            <ng-template #title>{{ t('dashboard.topPosters') }}</ng-template>

            @if (facade.loading()) {
                <div class="flex flex-col gap-4">
                    @for (item of skeletonItems; track item) {
                        <div class="flex items-center gap-3">
                            <p-skeleton shape="circle" size="2.5rem" />
                            <div class="flex flex-1 flex-col gap-2">
                                <p-skeleton height="1rem" width="60%" />
                                <p-skeleton height="0.75rem" width="30%" />
                            </div>
                        </div>
                    }
                </div>
            } @else {
                <div class="divide-surface-100 dark:divide-surface-700 flex flex-col divide-y">
                    @for (poster of facade.topPosters(); track poster.userId; let i = $index) {
                        <a
                            class="hover:bg-surface-50 dark:hover:bg-surface-800 -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 no-underline transition-colors first:pt-0 last:pb-0"
                            [routerLink]="['/users', poster.userId]"
                        >
                            <div
                                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                                [class]="rankBg(i)"
                            >
                                <span [class]="rankText(i)">{{ i + 1 }}</span>
                            </div>
                            <p-avatar
                                [label]="poster.displayName.charAt(0).toUpperCase()"
                                shape="circle"
                                styleClass="shrink-0 bg-primary/10 text-primary font-semibold"
                            />
                            <div class="min-w-0 flex-1">
                                <div class="text-surface-900 dark:text-surface-0 flex items-center gap-2 font-medium">
                                    <span class="truncate">{{ poster.displayName }}</span>
                                    @if (i < 3) {
                                        <p-tag
                                            [severity]="rankSeverity(i)"
                                            [value]="rankLabel(i)"
                                            styleClass="text-xs"
                                        />
                                    }
                                </div>
                                <div class="text-surface-500 dark:text-surface-400 flex items-center gap-1 text-sm">
                                    <i class="pi pi-comment text-xs"></i>
                                    <span>{{ poster.postCount }} {{ t('dashboard.posts') }}</span>
                                </div>
                            </div>
                            <i class="pi pi-chevron-right text-surface-300 text-xs"></i>
                        </a>
                    } @empty {
                        <p class="text-surface-500 dark:text-surface-400 text-sm">{{ t('dashboard.noPosters') }}</p>
                    }
                </div>
            }
        </p-card>
    `
})
export class TopPostersWidget {
    protected readonly facade = inject(DashboardFacade);
    private readonly translocoService = inject(TranslocoService);
    protected readonly skeletonItems = [1, 2, 3, 4, 5];

    protected rankBg(index: number): string {
        return RANK_STYLES[index]?.bg ?? "bg-surface-50 dark:bg-surface-800";
    }

    protected rankLabel(index: number): string {
        const key = RANK_STYLES[index]?.label;
        return key ? this.translocoService.translate(key) : "";
    }

    protected rankSeverity(index: number): "warn" | "secondary" | "contrast" {
        if (index === 0) return "warn";
        if (index === 1) return "secondary";
        return "contrast";
    }

    protected rankText(index: number): string {
        return RANK_STYLES[index]?.text ?? "text-surface-500";
    }
}
