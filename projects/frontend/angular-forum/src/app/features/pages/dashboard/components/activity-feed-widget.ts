import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";

import { ACTIVITY_ROUTES } from "../../../../core/api/activity.routes";
import { API_CONFIG, ApiConfig } from "../../../../core/config/api.config";
import { Activity, ACTIVITY_COLORS, ACTIVITY_ICONS, ActivityType } from "../../../../core/models/activity/activity";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-activity-feed-widget",
    standalone: true,
    imports: [AvatarModule, CardModule, SkeletonModule, TranslocoModule],
    template: `
        <p-card *transloco="let t">
            <ng-template #title>{{ t("dashboard.activityFeed") }}</ng-template>

            @if (loading()) {
                <div class="flex flex-col gap-4">
                    @for (i of [1, 2, 3, 4, 5]; track i) {
                        <div class="flex items-start gap-3">
                            <p-skeleton shape="circle" size="2.5rem" />
                            <div class="flex flex-1 flex-col gap-2">
                                <p-skeleton height="0.875rem" width="70%" />
                                <p-skeleton height="0.75rem" width="50%" />
                            </div>
                            <p-skeleton height="0.75rem" width="3.5rem" />
                        </div>
                    }
                </div>
            } @else if (activities().length === 0) {
                <div class="text-color-secondary py-8 text-center text-sm">
                    <i class="pi pi-clock mb-2 block text-3xl"></i>
                    <p class="m-0">{{ t("dashboard.noActivity") }}</p>
                </div>
            } @else {
                <div class="flex flex-col overflow-x-hidden overflow-y-auto" style="max-height: 36rem">
                    @for (item of activities(); track item.id) {
                        <div
                            class="border-surface hover:bg-emphasis -mx-1 flex cursor-pointer items-start gap-3 rounded-lg border-b px-1 py-3 transition-colors first:pt-0 last:border-b-0 last:pb-0"
                            (click)="navigate(item)"
                            (keydown.enter)="navigate(item)"
                            role="button"
                            tabindex="0"
                        >
                            <!-- Avatar -->
                            <p-avatar
                                [image]="item.avatarUrl ?? ''"
                                [label]="item.displayName.charAt(0).toUpperCase()"
                                shape="circle"
                                styleClass="shrink-0"
                            />

                            <!-- Content -->
                            <div class="min-w-0 flex-1">
                                <div class="text-sm">
                                    <span class="font-semibold">{{ item.displayName }}</span>
                                    <span class="text-color-secondary ml-1">
                                        {{ t("activity.type." + item.type) }}
                                    </span>
                                </div>
                                <div class="text-color mt-0.5 truncate text-sm font-medium">
                                    {{ item.title }}
                                </div>
                                @if (item.description) {
                                    <div class="text-color-secondary mt-0.5 truncate text-xs">
                                        {{ item.description }}
                                    </div>
                                }
                            </div>

                            <!-- Timestamp + Icon -->
                            <div class="flex shrink-0 flex-col items-end gap-1">
                                <i
                                    class="pi text-sm"
                                    [class]="'pi ' + activityIcon(item.type) + ' ' + activityColor(item.type)"
                                ></i>
                                <span class="text-color-secondary text-xs whitespace-nowrap">
                                    {{ formatTime(item.createdAt) }}
                                </span>
                            </div>
                        </div>
                    }
                </div>
            }
        </p-card>
    `
})
export class ActivityFeedWidget implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);
    private readonly router = inject(Router);

    protected readonly loading = signal(true);
    protected readonly activities = signal<Activity[]>([]);

    ngOnInit(): void {
        this.loadActivities();
    }

    private loadActivities(): void {
        this.loading.set(true);
        this.http.get<Activity[]>(`${this.config.baseUrl}${ACTIVITY_ROUTES.globalFeed()}?limit=20`).subscribe({
            next: (data) => {
                this.activities.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    protected navigate(item: Activity): void {
        if (item.link) {
            void this.router.navigate([item.link]);
        }
    }

    protected activityIcon(type: ActivityType): string {
        return ACTIVITY_ICONS[type] ?? "pi-clock";
    }

    protected activityColor(type: ActivityType): string {
        return ACTIVITY_COLORS[type] ?? "text-surface-500";
    }

    protected formatTime(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const min = Math.floor(diff / 60_000);
        if (min < 1) return "now";
        if (min < 60) return `${min}m`;
        const h = Math.floor(min / 60);
        if (h < 24) return `${h}h`;
        const d = Math.floor(h / 24);
        if (d < 7) return `${d}d`;
        return new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
    }
}
