import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { ONLINE_USERS_ROUTES } from "../../../../core/api/online-users.routes";
import { API_CONFIG, ApiConfig } from "../../../../core/config/api.config";
import {
    OnlineDisplayMode,
    OnlineSort,
    OnlineSortOrder,
    OnlineTimeWindow,
    OnlineUser
} from "../../../../core/models/user/online-user";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AvatarModule,
        ButtonModule,
        CardModule,
        RouterModule,
        SkeletonModule,
        TagModule,
        TooltipModule,
        TranslocoModule
    ],
    selector: "app-online-users-widget",
    template: `
        <p-card *transloco="let t">
            <ng-template #title>
                <div class="flex items-center justify-between gap-2 flex-wrap">
                    <span class="flex items-center gap-2">
                        <span class="relative flex h-3 w-3">
                            <span class="bg-green-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                            <span class="bg-green-500 relative inline-flex h-3 w-3 rounded-full"></span>
                        </span>
                        {{ t('onlineUsers.title') }}
                        @if (!loading()) {
                            <span class="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full px-2 py-0.5 text-xs font-semibold">
                                {{ users().length }}
                            </span>
                        }
                    </span>
                    <!-- Display mode toggle -->
                    <div class="flex items-center gap-1">
                        <button
                            class="flex h-7 w-7 items-center justify-center rounded transition-colors"
                            [class.bg-surface-100]="displayMode() === 'avatars'"
                            [class.dark:bg-surface-700]="displayMode() === 'avatars'"
                            [class.text-primary]="displayMode() === 'avatars'"
                            (click)="displayMode.set('avatars')"
                            [title]="t('onlineUsers.modeAvatars')"
                        ><i class="pi pi-th-large text-sm"></i></button>
                        <button
                            class="flex h-7 w-7 items-center justify-center rounded transition-colors"
                            [class.bg-surface-100]="displayMode() === 'list'"
                            [class.dark:bg-surface-700]="displayMode() === 'list'"
                            [class.text-primary]="displayMode() === 'list'"
                            (click)="displayMode.set('list')"
                            [title]="t('onlineUsers.modeList')"
                        ><i class="pi pi-list text-sm"></i></button>
                    </div>
                </div>
            </ng-template>

            <!-- Controls row -->
            <div class="mb-3 flex flex-wrap items-center gap-2">
                <!-- Time window -->
                <div class="flex rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700 text-xs">
                    <button
                        class="px-2.5 py-1 transition-colors font-medium"
                        [class.bg-primary]="timeWindow() === 'today'"
                        [class.text-white]="timeWindow() === 'today'"
                        [class.text-surface-600]="timeWindow() !== 'today'"
                        [class.dark:text-surface-400]="timeWindow() !== 'today'"
                        (click)="timeWindow.set('today')"
                    >{{ t('onlineUsers.today') }}</button>
                    <button
                        class="px-2.5 py-1 transition-colors font-medium border-l border-surface-200 dark:border-surface-700"
                        [class.bg-primary]="timeWindow() === '24h'"
                        [class.text-white]="timeWindow() === '24h'"
                        [class.text-surface-600]="timeWindow() !== '24h'"
                        [class.dark:text-surface-400]="timeWindow() !== '24h'"
                        (click)="timeWindow.set('24h')"
                    >{{ t('onlineUsers.last24h') }}</button>
                </div>

                <!-- Sort -->
                <div class="flex rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700 text-xs ml-auto">
                    <button
                        class="px-2.5 py-1 transition-colors font-medium flex items-center gap-1"
                        [class.bg-surface-100]="sort() === 'lastSeen'"
                        [class.dark:bg-surface-700]="sort() === 'lastSeen'"
                        (click)="sort.set('lastSeen')"
                    ><i class="pi pi-clock text-xs"></i> {{ t('onlineUsers.sortLastSeen') }}</button>
                    <button
                        class="px-2.5 py-1 transition-colors font-medium flex items-center gap-1 border-l border-surface-200 dark:border-surface-700"
                        [class.bg-surface-100]="sort() === 'username'"
                        [class.dark:bg-surface-700]="sort() === 'username'"
                        (click)="sort.set('username')"
                    ><i class="pi pi-sort-alpha-down text-xs"></i> {{ t('onlineUsers.sortUsername') }}</button>
                    <button
                        class="px-2.5 py-1 transition-colors border-l border-surface-200 dark:border-surface-700"
                        (click)="toggleOrder()"
                        [title]="sortOrder() === 'asc' ? t('onlineUsers.orderAsc') : t('onlineUsers.orderDesc')"
                    ><i class="pi text-xs" [class.pi-sort-amount-up]="sortOrder() === 'asc'" [class.pi-sort-amount-down]="sortOrder() === 'desc'"></i></button>
                </div>
            </div>

            @if (loading()) {
                @if (displayMode() === 'avatars') {
                    <div class="flex flex-wrap gap-2">
                        @for (_ of skeletons; track $index) {
                            <p-skeleton shape="circle" size="2.5rem" />
                        }
                    </div>
                } @else {
                    <div class="flex flex-col gap-2">
                        @for (_ of skeletons; track $index) {
                            <p-skeleton height="2rem" />
                        }
                    </div>
                }
            } @else if (users().length === 0) {
                <p class="text-surface-500 dark:text-surface-400 text-sm text-center py-4">
                    {{ t('onlineUsers.noUsers') }}
                </p>
            } @else if (displayMode() === 'avatars') {
                <!-- Avatar grid -->
                <div class="flex flex-wrap gap-2">
                    @for (user of users(); track user.userId) {
                        <a
                            [routerLink]="['/users', user.userId]"
                            [pTooltip]="user.displayName + ' (@' + user.username + ')'"
                            tooltipPosition="top"
                            class="relative no-underline"
                        >
                            <p-avatar
                                [label]="user.displayName.charAt(0).toUpperCase()"
                                shape="circle"
                                size="large"
                                styleClass="bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-semibold text-sm cursor-pointer"
                            />
                            <span class="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-surface-800 bg-green-500"></span>
                        </a>
                    }
                </div>
            } @else {
                <!-- Username list -->
                <div class="divide-surface-100 dark:divide-surface-700 flex flex-col divide-y">
                    @for (user of users(); track user.userId) {
                        <a
                            class="hover:bg-surface-50 dark:hover:bg-surface-800 -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 no-underline transition-colors first:pt-0 last:pb-0"
                            [routerLink]="['/users', user.userId]"
                        >
                            <span class="relative flex-shrink-0">
                                <p-avatar
                                    [label]="user.displayName.charAt(0).toUpperCase()"
                                    shape="circle"
                                    styleClass="bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-semibold text-sm"
                                />
                                <span class="absolute right-0 bottom-0 h-2 w-2 rounded-full border border-white dark:border-surface-800 bg-green-500"></span>
                            </span>
                            <div class="min-w-0 flex-1">
                                <div class="text-surface-900 dark:text-surface-0 truncate text-sm font-medium">{{ user.displayName }}</div>
                                <div class="text-surface-400 text-xs">&#64;{{ user.username }}</div>
                            </div>
                        </a>
                    }
                </div>
            }
        </p-card>
    `
})
export class OnlineUsersWidget implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    protected readonly loading = signal(true);
    protected readonly users = signal<OnlineUser[]>([]);
    protected readonly displayMode = signal<OnlineDisplayMode>("avatars");
    protected readonly timeWindow = signal<OnlineTimeWindow>("today");
    protected readonly sort = signal<OnlineSort>("lastSeen");
    protected readonly sortOrder = signal<OnlineSortOrder>("desc");
    protected readonly skeletons = [1, 2, 3, 4, 5, 6];

    constructor() {
        effect(() => {
            // Reload whenever any filter param changes
            const window = this.timeWindow();
            const sort = this.sort();
            const order = this.sortOrder();
            this.load(window, sort, order);
        });
    }

    ngOnInit(): void {
        // Initial load handled by effect
    }

    protected toggleOrder(): void {
        this.sortOrder.update((o) => (o === "asc" ? "desc" : "asc"));
    }

    private load(window: OnlineTimeWindow, sort: OnlineSort, order: OnlineSortOrder): void {
        this.loading.set(true);
        const url = `${this.apiConfig.baseUrl}${ONLINE_USERS_ROUTES.online({ window, sort, order, limit: 50 })}`;
        this.http.get<OnlineUser[]>(url).subscribe({
            next: (data) => {
                this.users.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }
}
