import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { TooltipModule } from "primeng/tooltip";

import { ONLINE_USERS_ROUTES } from "../../core/api/online-users.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { OnlineUser } from "../../core/models/user/online-user";

const MAX_FOOTER_AVATARS = 12;

@Component({
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-footer",
    imports: [AvatarModule, RouterModule, TooltipModule, TranslocoModule],
    styles: `
        :host {
            display: block;
        }

        .footer-wrap {
            background: var(--glass-bg-strong);
            backdrop-filter: blur(var(--glass-blur-strong));
            -webkit-backdrop-filter: blur(var(--glass-blur-strong));
            border-top: 1px solid var(--glass-border);
        }

        .footer-section {
            max-width: 80rem;
            margin: 0 auto;
            padding: 0 1.5rem;
        }

        /* ── Statistics bar ───────────────────────────── */
        .footer-stats {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.375rem;
            padding: 0.875rem 0;
            border-bottom: 1px solid var(--glass-border);
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }
        .footer-stats strong {
            color: var(--text-color);
            font-weight: 600;
        }
        .footer-stats .sep {
            opacity: 0.35;
        }

        /* ── Online bar ──────────────────────────────── */
        .footer-online {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--glass-border);
        }

        /* ── Main grid ───────────────────────────────── */
        .footer-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
            padding: 2rem 0;
        }
        @media (min-width: 640px) {
            .footer-grid {
                grid-template-columns: 1fr 1fr;
            }
        }
        @media (min-width: 1024px) {
            .footer-grid {
                grid-template-columns: 2fr 1fr 1fr;
            }
        }

        .footer-heading {
            font-size: 0.6875rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-color-secondary);
            margin: 0 0 0.75rem;
        }

        .footer-links {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem 1.25rem;
        }
        .footer-links a {
            font-size: 0.8125rem;
            color: var(--text-color-secondary);
            text-decoration: none;
            transition: color 0.15s;
        }
        .footer-links a:hover {
            color: var(--primary-color);
        }

        .footer-connect {
            display: flex;
            flex-wrap: wrap;
            gap: 0.625rem;
        }
        .footer-social-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2.25rem;
            height: 2.25rem;
            border-radius: 0.5rem;
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            color: var(--text-color-secondary);
            transition:
                background 0.15s,
                color 0.15s;
            font-size: 1rem;
        }
        .footer-social-icon:hover {
            background: var(--primary-color);
            color: white;
        }

        /* ── About / brand ───────────────────────────── */
        .footer-about {
            display: flex;
            flex-direction: column;
            gap: 0.625rem;
        }
        .footer-about-text {
            font-size: 0.8125rem;
            color: var(--text-color-secondary);
            line-height: 1.6;
            max-width: 36rem;
        }

        /* ── Bottom bar ──────────────────────────────── */
        .footer-bottom {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
            padding: 1rem 0;
            border-top: 1px solid var(--glass-border);
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }
        .footer-bottom a {
            color: var(--text-color-secondary);
            text-decoration: none;
            transition: color 0.15s;
        }
        .footer-bottom a:hover {
            color: var(--primary-color);
        }
    `,
    template: `
        <footer class="footer-wrap" *transloco="let t">
            <!-- ── Statistics ─────────────────────────────── -->
            <div class="footer-section">
                <div class="footer-stats">
                    <span
                        ><strong>{{ total() }}</strong> {{ t("footer.stat.members") }}</span
                    >
                    <span class="sep">·</span>
                    <span>{{ t("footer.stat.guests") }}</span>
                    <span class="sep">·</span>
                    <span>{{ t("footer.stat.online", { count: total() }) }}</span>
                </div>
            </div>

            <!-- ── Online users ───────────────────────────── -->
            <div class="footer-section">
                <div class="footer-online">
                    <div class="flex items-center gap-1.5">
                        <span class="relative flex h-2.5 w-2.5">
                            <span
                                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
                            ></span>
                            <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                        </span>
                        <span class="text-xs font-medium" style="color: var(--text-color-secondary)">
                            {{ t("onlineUsers.footerLabel", { count: total() }) }}
                        </span>
                    </div>
                    @if (visible().length > 0) {
                        <div class="flex items-center">
                            @for (user of visible(); track user.userId; let i = $index) {
                                <a
                                    class="-ml-1.5 block no-underline first:ml-0"
                                    [pTooltip]="user.displayName + ' (@' + user.username + ')'"
                                    [routerLink]="['/users', user.userId]"
                                    [style.z-index]="visible().length - i"
                                    tooltipPosition="top"
                                >
                                    <p-avatar
                                        [label]="user.displayName.charAt(0).toUpperCase()"
                                        shape="circle"
                                        size="normal"
                                        styleClass="bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold border-2 border-surface-card cursor-pointer"
                                    />
                                </a>
                            }
                            @if (overflow() > 0) {
                                <div
                                    class="bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300 -ml-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold"
                                    [style.z-index]="0"
                                    style="border-color: var(--surface-card)"
                                >
                                    +{{ overflow() }}
                                </div>
                            }
                        </div>
                    }
                </div>
            </div>

            <!-- ── Main grid ──────────────────────────────── -->
            <div class="footer-section">
                <div class="footer-grid">
                    <!-- Navigation links -->
                    <div>
                        <h5 class="footer-heading">{{ t("footer.navigation") }}</h5>
                        <ul class="footer-links">
                            <li>
                                <a routerLink="/dashboard">{{ t("nav.dashboard") }}</a>
                            </li>
                            <li>
                                <a routerLink="/forum">{{ t("nav.forum") }}</a>
                            </li>
                            <li>
                                <a routerLink="/blog">{{ t("nav.blog") }}</a>
                            </li>
                            <li>
                                <a routerLink="/gallery">{{ t("nav.gallery") }}</a>
                            </li>
                            <li>
                                <a routerLink="/lexicon">{{ t("nav.lexicon") }}</a>
                            </li>
                            <li>
                                <a routerLink="/clips">{{ t("nav.clips") }}</a>
                            </li>
                            <li>
                                <a routerLink="/anime-database">{{ t("nav.anime") }}</a>
                            </li>
                            <li>
                                <a routerLink="/marketplace">{{ t("nav.marketplace") }}</a>
                            </li>
                            <li>
                                <a routerLink="/recipes">{{ t("nav.recipes") }}</a>
                            </li>
                            <li>
                                <a routerLink="/calendar">{{ t("nav.calendar") }}</a>
                            </li>
                            <li>
                                <a routerLink="/shop">{{ t("nav.shop") }}</a>
                            </li>
                            <li>
                                <a routerLink="/lotto">{{ t("nav.lotto") }}</a>
                            </li>
                        </ul>
                    </div>

                    <!-- Connect -->
                    <div>
                        <h5 class="footer-heading">{{ t("footer.connect") }}</h5>
                        <div class="footer-connect">
                            <a
                                class="footer-social-icon"
                                href="https://discord.gg/"
                                pTooltip="Discord"
                                rel="noopener noreferrer"
                                target="_blank"
                                tooltipPosition="top"
                            >
                                <i class="pi pi-discord"></i>
                            </a>
                            <a
                                class="footer-social-icon"
                                href="https://twitter.com/"
                                pTooltip="X / Twitter"
                                rel="noopener noreferrer"
                                target="_blank"
                                tooltipPosition="top"
                            >
                                <i class="pi pi-twitter"></i>
                            </a>
                            <a
                                class="footer-social-icon"
                                href="https://github.com/"
                                pTooltip="GitHub"
                                rel="noopener noreferrer"
                                target="_blank"
                                tooltipPosition="top"
                            >
                                <i class="pi pi-github"></i>
                            </a>
                            <a
                                class="footer-social-icon"
                                href="https://youtube.com/"
                                pTooltip="YouTube"
                                rel="noopener noreferrer"
                                target="_blank"
                                tooltipPosition="top"
                            >
                                <i class="pi pi-youtube"></i>
                            </a>
                        </div>
                    </div>

                    <!-- About -->
                    <div class="footer-about">
                        <h5 class="footer-heading">{{ t("footer.about") }}</h5>
                        <span class="text-primary text-xl font-bold">Aniverse</span>
                        <p class="footer-about-text">{{ t("footer.aboutText") }}</p>
                    </div>
                </div>
            </div>

            <!-- ── Bottom bar ─────────────────────────────── -->
            <div class="footer-section">
                <div class="footer-bottom">
                    <span>© {{ year }} Aniverse — {{ t("footer.rights") }}</span>
                    <div class="flex flex-wrap items-center gap-3">
                        <a routerLink="/privacy">{{ t("footer.privacy") }}</a>
                        <span class="opacity-30">·</span>
                        <a routerLink="/legal">{{ t("footer.legal") }}</a>
                        <span class="opacity-30">·</span>
                        <span>
                            Powered by
                            <a
                                class="text-primary font-medium"
                                href="https://primeng.org"
                                rel="noopener noreferrer"
                                target="_blank"
                                >PrimeNG</a
                            >
                        </span>
                    </div>
                </div>
            </div>
        </footer>
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
            .get<
                OnlineUser[]
            >(`${this.apiConfig.baseUrl}${ONLINE_USERS_ROUTES.online({ window: "today", sort: "lastSeen", order: "desc", limit: 50 })}`)
            .subscribe({
                next: (users) => {
                    this.total.set(users.length);
                    this.visible.set(users.slice(0, MAX_FOOTER_AVATARS));
                    this.overflow.set(Math.max(0, users.length - MAX_FOOTER_AVATARS));
                },
                error: () => undefined
            });
    }
}
