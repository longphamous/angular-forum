import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
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
    { bg: "bg-yellow-100 dark:bg-yellow-400/10", label: "Gold", text: "text-yellow-600 dark:text-yellow-400" },
    { bg: "bg-surface-100 dark:bg-surface-700", label: "Silber", text: "text-surface-500 dark:text-surface-400" },
    { bg: "bg-orange-100 dark:bg-orange-400/10", label: "Bronze", text: "text-orange-600 dark:text-orange-400" }
];

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AvatarModule, CardModule, SkeletonModule, TagModule],
    selector: "app-top-posters-widget",
    template: `
        <p-card>
            <ng-template #title>Top Poster</ng-template>

            @if (facade.loading()) {
                <div class="flex flex-col gap-4">
                    @for (item of skeletonItems; track item) {
                        <div class="flex items-center gap-3">
                            <p-skeleton shape="circle" size="2.5rem" />
                            <div class="flex flex-1 flex-col gap-2">
                                <p-skeleton width="60%" height="1rem" />
                                <p-skeleton width="30%" height="0.75rem" />
                            </div>
                        </div>
                    }
                </div>
            } @else {
                <div class="flex flex-col divide-y divide-surface-100 dark:divide-surface-700">
                    @for (poster of facade.topPosters(); track poster.userId; let i = $index) {
                        <div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
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
                                        <p-tag [value]="rankLabel(i)" [severity]="rankSeverity(i)" styleClass="text-xs" />
                                    }
                                </div>
                                <div class="text-surface-500 dark:text-surface-400 flex items-center gap-1 text-sm">
                                    <i class="pi pi-comment text-xs"></i>
                                    <span>{{ poster.postCount }} Beiträge</span>
                                </div>
                            </div>
                        </div>
                    } @empty {
                        <p class="text-surface-500 dark:text-surface-400 text-sm">Keine Daten vorhanden.</p>
                    }
                </div>
            }
        </p-card>
    `
})
export class TopPostersWidget {
    protected readonly facade = inject(DashboardFacade);
    protected readonly skeletonItems = [1, 2, 3, 4, 5];

    protected rankBg(index: number): string {
        return RANK_STYLES[index]?.bg ?? "bg-surface-50 dark:bg-surface-800";
    }

    protected rankLabel(index: number): string {
        return RANK_STYLES[index]?.label ?? "";
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
