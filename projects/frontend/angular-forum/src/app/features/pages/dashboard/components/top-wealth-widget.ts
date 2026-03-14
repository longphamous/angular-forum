import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";

import { WALLET_ROUTES } from "../../../../core/api/wallet.routes";
import { API_CONFIG, ApiConfig } from "../../../../core/config/api.config";
import { WalletLeaderboardEntry } from "../../../../core/models/wallet/wallet";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AvatarModule, CardModule, RouterModule, SkeletonModule, TranslocoModule],
    selector: "app-top-wealth-widget",
    template: `
        <p-card *transloco="let t">
            <ng-template #title>
                <span class="flex items-center gap-2">
                    <i class="pi pi-wallet text-yellow-500"></i>
                    {{ t('dashboard.topWealth') }}
                </span>
            </ng-template>

            @if (loading()) {
                <div class="flex flex-col gap-4">
                    @for (item of skeletonItems; track item) {
                        <div class="flex items-center gap-3">
                            <p-skeleton shape="circle" size="2.5rem" />
                            <div class="flex flex-1 flex-col gap-2">
                                <p-skeleton height="1rem" width="55%" />
                                <p-skeleton height="0.75rem" width="35%" />
                            </div>
                            <p-skeleton height="1rem" width="4rem" />
                        </div>
                    }
                </div>
            } @else {
                <div class="divide-surface-100 dark:divide-surface-700 flex flex-col divide-y">
                    @for (entry of leaders(); track entry.userId; let i = $index) {
                        <a
                            class="hover:bg-surface-50 dark:hover:bg-surface-800 -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 no-underline transition-colors first:pt-0 last:pb-0"
                            [routerLink]="['/users', entry.userId]"
                        >
                            <div
                                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                                [class]="rankBg(i)"
                            >
                                <span [class]="rankText(i)">{{ i + 1 }}</span>
                            </div>
                            <p-avatar
                                [label]="entry.displayName.charAt(0).toUpperCase()"
                                shape="circle"
                                styleClass="shrink-0 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-semibold"
                            />
                            <div class="min-w-0 flex-1">
                                <div class="text-surface-900 dark:text-surface-0 truncate font-medium">
                                    {{ entry.displayName }}
                                </div>
                                <div class="text-surface-400 text-xs">&#64;{{ entry.username }}</div>
                            </div>
                            <div class="flex shrink-0 items-center gap-1 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                                <i class="pi pi-wallet text-xs"></i>
                                <span>{{ entry.balance }}</span>
                            </div>
                        </a>
                    } @empty {
                        <p class="text-surface-500 dark:text-surface-400 text-sm">{{ t('dashboard.noWealth') }}</p>
                    }
                </div>
            }
        </p-card>
    `
})
export class TopWealthWidget implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    protected readonly loading = signal(true);
    protected readonly leaders = signal<WalletLeaderboardEntry[]>([]);
    protected readonly skeletonItems = [1, 2, 3, 4, 5];

    ngOnInit(): void {
        this.http
            .get<WalletLeaderboardEntry[]>(`${this.apiConfig.baseUrl}${WALLET_ROUTES.leaderboard(5)}`)
            .subscribe({
                next: (data) => {
                    this.leaders.set(data);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false)
            });
    }

    protected rankBg(index: number): string {
        if (index === 0) return "bg-yellow-100 dark:bg-yellow-400/10";
        if (index === 1) return "bg-surface-100 dark:bg-surface-700";
        if (index === 2) return "bg-orange-100 dark:bg-orange-400/10";
        return "bg-surface-50 dark:bg-surface-800";
    }

    protected rankText(index: number): string {
        if (index === 0) return "text-yellow-600 dark:text-yellow-400";
        if (index === 1) return "text-surface-500 dark:text-surface-400";
        if (index === 2) return "text-orange-600 dark:text-orange-400";
        return "text-surface-400";
    }
}
