import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { TooltipModule } from "primeng/tooltip";

import { ONLINE_USERS_ROUTES } from "../../core/api/online-users.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { OnlineUser } from "../../core/models/user/online-user";

const MAX_FOOTER_AVATARS = 10;

@Component({
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-footer",
    imports: [AvatarModule, RouterModule, TooltipModule, TranslocoModule],
    template: `
        <div class="layout-footer" *transloco="let t">
            <div class="flex flex-col gap-3 w-full">

                <!-- Online users row -->
                <div class="flex flex-wrap items-center gap-3">
                    <div class="flex items-center gap-1.5">
                        <span class="relative flex h-2.5 w-2.5">
                            <span class="bg-green-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                            <span class="bg-green-500 relative inline-flex h-2.5 w-2.5 rounded-full"></span>
                        </span>
                        <span class="text-surface-500 dark:text-surface-400 text-xs font-medium">
                            {{ t('onlineUsers.footerLabel', { count: total() }) }}
                        </span>
                    </div>

                    <!-- Avatar row -->
                    @if (visible().length > 0) {
                        <div class="flex items-center">
                            @for (user of visible(); track user.userId; let i = $index) {
                                <a
                                    [routerLink]="['/users', user.userId]"
                                    class="-ml-2 first:ml-0 block no-underline"
                                    [style.z-index]="visible().length - i"
                                    [pTooltip]="user.displayName + ' (@' + user.username + ')'"
                                    tooltipPosition="top"
                                >
                                    <p-avatar
                                        [label]="user.displayName.charAt(0).toUpperCase()"
                                        shape="circle"
                                        styleClass="bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold border-2 border-white dark:border-surface-800 cursor-pointer"
                                        size="normal"
                                    />
                                </a>
                            }
                            @if (overflow() > 0) {
                                <div class="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-surface-800 bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300 text-xs font-semibold"
                                     [style.z-index]="0">
                                    +{{ overflow() }}
                                </div>
                            }
                        </div>
                    }
                </div>

                <!-- Bottom row: branding -->
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <span class="text-surface-400 text-xs">
                        © {{ year }} Aniverse — {{ t('footer.rights') }}
                    </span>
                    <span class="text-surface-300 dark:text-surface-600 text-xs">
                        Powered by
                        <a href="https://primeng.org" target="_blank" rel="noopener noreferrer"
                           class="text-primary font-medium hover:underline">PrimeNG</a>
                    </span>
                </div>
            </div>
        </div>
    `
})
export class AppFooter implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    protected readonly total = signal(0);
    protected readonly visible = signal<OnlineUser[]>([]);
    protected readonly overflow = signal(0);
    protected readonly year = new Date().getFullYear();

    ngOnInit(): void {
        this.http
            .get<OnlineUser[]>(`${this.apiConfig.baseUrl}${ONLINE_USERS_ROUTES.online({ window: "today", sort: "lastSeen", order: "desc", limit: 50 })}`)
            .subscribe({
                next: (users) => {
                    this.total.set(users.length);
                    this.visible.set(users.slice(0, MAX_FOOTER_AVATARS));
                    this.overflow.set(Math.max(0, users.length - MAX_FOOTER_AVATARS));
                },
                error: () => {}
            });
    }
}
