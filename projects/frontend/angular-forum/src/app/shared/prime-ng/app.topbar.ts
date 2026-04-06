import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MenuItem } from "primeng/api";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { PopoverModule } from "primeng/popover";
import { StyleClassModule } from "primeng/styleclass";
import { filter, startWith, switchMap } from "rxjs/operators";

import { NotificationBell } from "../../core/components/notification-bell/notification-bell";
import { AuthFacade } from "../../facade/auth/auth-facade";
import { AppConfigurator } from "./app.configurator";
import { LayoutService } from "./service/layout.service";

interface NavGroup {
    label: string;
    icon: string;
    routePrefix: string[];
    items: { label: string; icon: string; route: string }[];
}

@Component({
    selector: "app-topbar",
    standalone: true,
    imports: [
        RouterModule,
        CommonModule,
        StyleClassModule,
        AppConfigurator,
        PopoverModule,
        ButtonModule,
        AvatarModule,
        DividerModule,
        TranslocoModule,
        NotificationBell
    ],
    template: ` <ng-container *transloco="let t">
        <div class="layout-topbar">
            <div class="layout-topbar-logo-container">
                <button
                    class="layout-menu-button layout-topbar-action lg:!hidden"
                    (click)="mobileMenuOpen.set(!mobileMenuOpen())"
                >
                    <i class="pi pi-bars"></i>
                </button>
                <a class="layout-topbar-logo" routerLink="/">
                    <img alt="Aniverse" src="assets/images/logo.png" style="height: 2.5rem; width: auto;" />
                    <span>Aniverse</span>
                </a>
            </div>

            <!-- ── Desktop Header Nav ─────────────────────────────────── -->
            <nav class="layout-topbar-nav">
                <!-- Home (direct link) -->
                <a
                    class="topbar-nav-item"
                    [class.topbar-nav-active]="isRouteActive(['/feed', '/chronik'])"
                    routerLink="/feed"
                >
                    <i class="pi pi-home"></i>
                    <span>{{ t("nav.home") }}</span>
                </a>

                <!-- Dashboard (direct link) -->
                <a
                    class="topbar-nav-item"
                    [class.topbar-nav-active]="isRouteActive(['/dashboard'])"
                    routerLink="/dashboard"
                >
                    <i class="pi pi-th-large"></i>
                    <span>{{ t("nav.dashboard") }}</span>
                </a>

                <!-- Grouped dropdowns -->
                @for (group of navGroups; track group.label) {
                    @if (group.label !== "Admin" || authFacade.isAdmin()) {
                        <div
                            class="topbar-nav-dropdown"
                            (mouseenter)="openGroup.set(group.label)"
                            (mouseleave)="openGroup.set(null)"
                        >
                            <button
                                class="topbar-nav-item"
                                [class.topbar-nav-active]="isRouteActive(group.routePrefix)"
                                (click)="openGroup.set(openGroup() === group.label ? null : group.label)"
                                type="button"
                            >
                                <i [class]="'pi ' + group.icon"></i>
                                <span>{{ group.label }}</span>
                                <i class="pi pi-angle-down topbar-nav-caret"></i>
                            </button>
                            @if (openGroup() === group.label) {
                                <div class="topbar-dropdown-panel" (click)="openGroup.set(null)">
                                    @for (item of group.items; track item.route) {
                                        <a
                                            class="topbar-dropdown-item"
                                            [routerLink]="item.route"
                                            routerLinkActive="topbar-dropdown-item-active"
                                        >
                                            <i [class]="'pi ' + item.icon"></i>
                                            <span>{{ item.label }}</span>
                                        </a>
                                    }
                                </div>
                            }
                        </div>
                    }
                }
            </nav>

            <div class="layout-topbar-actions">
                <div class="layout-config-menu">
                    <button
                        class="layout-topbar-action"
                        [title]="currentLang() === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'"
                        (click)="toggleLanguage()"
                        type="button"
                    >
                        <span class="text-xs font-semibold">{{ currentLang() === "de" ? "EN" : "DE" }}</span>
                    </button>
                    <button class="layout-topbar-action" (click)="toggleDarkMode()" type="button">
                        <i
                            [ngClass]="{
                                'pi': true,
                                'pi-moon': layoutService.isDarkTheme(),
                                'pi-sun': !layoutService.isDarkTheme()
                            }"
                        ></i>
                    </button>
                    <div class="relative">
                        <button
                            class="layout-topbar-action layout-topbar-action-highlight"
                            [hideOnOutsideClick]="true"
                            enterActiveClass="animate-scalein"
                            enterFromClass="hidden"
                            leaveActiveClass="animate-fadeout"
                            leaveToClass="hidden"
                            pStyleClass="@next"
                        >
                            <i class="pi pi-palette"></i>
                        </button>
                        <app-configurator />
                    </div>
                </div>

                <button
                    class="layout-topbar-menu-button layout-topbar-action"
                    [hideOnOutsideClick]="true"
                    enterActiveClass="animate-scalein"
                    enterFromClass="hidden"
                    leaveActiveClass="animate-fadeout"
                    leaveToClass="hidden"
                    pStyleClass="@next"
                >
                    <i class="pi pi-ellipsis-v"></i>
                </button>

                <div class="layout-topbar-menu hidden lg:block">
                    <div class="layout-topbar-menu-content">
                        @if (authFacade.isAuthenticated()) {
                            <app-notification-bell />
                        }
                        <button class="layout-topbar-action" (click)="userMenu.toggle($event)" type="button">
                            @if (authFacade.isAuthenticated()) {
                                <p-avatar
                                    [label]="userInitial()"
                                    shape="circle"
                                    size="normal"
                                    styleClass="text-sm font-semibold"
                                />
                            } @else {
                                <i class="pi pi-user"></i>
                            }
                            <span>{{
                                authFacade.isAuthenticated() ? authFacade.currentUser()?.displayName : t("nav.profile")
                            }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Mobile Menu Overlay ────────────────────────────────────── -->
        @if (mobileMenuOpen()) {
            <div class="topbar-mobile-overlay" (click)="mobileMenuOpen.set(false)"></div>
            <div class="topbar-mobile-menu">
                <div class="topbar-mobile-header">
                    <span class="font-semibold">{{ t("nav.home") }}</span>
                    <button class="layout-topbar-action" (click)="mobileMenuOpen.set(false)" type="button">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="topbar-mobile-content">
                    <!-- Home -->
                    <a class="topbar-dropdown-item" (click)="mobileMenuOpen.set(false)" routerLink="/feed">
                        <i class="pi pi-home"></i>
                        <span>{{ t("nav.feed") }}</span>
                    </a>
                    <a class="topbar-dropdown-item" (click)="mobileMenuOpen.set(false)" routerLink="/dashboard">
                        <i class="pi pi-th-large"></i>
                        <span>{{ t("nav.dashboard") }}</span>
                    </a>

                    @for (group of navGroups; track group.label) {
                        @if (group.label !== "Admin" || authFacade.isAdmin()) {
                            <div class="topbar-mobile-group">
                                <span class="topbar-mobile-group-label">{{ group.label }}</span>
                                @for (item of group.items; track item.route) {
                                    <a
                                        class="topbar-dropdown-item"
                                        [routerLink]="item.route"
                                        (click)="mobileMenuOpen.set(false)"
                                    >
                                        <i [class]="'pi ' + item.icon"></i>
                                        <span>{{ item.label }}</span>
                                    </a>
                                }
                            </div>
                        }
                    }
                </div>
            </div>
        }

        <p-popover #userMenu>
            @if (authFacade.isAuthenticated()) {
                <div class="flex min-w-44 flex-col gap-1">
                    <a
                        class="flex cursor-pointer items-center gap-3 px-1 pb-2 text-inherit no-underline"
                        [routerLink]="['/users', authFacade.currentUser()?.id]"
                        (click)="userMenu.hide()"
                    >
                        <p-avatar [label]="userInitial()" shape="circle" size="large" styleClass="font-semibold" />
                        <div class="flex flex-col">
                            <span class="text-sm font-semibold">{{ authFacade.currentUser()?.displayName }}</span>
                            <span class="text-surface-500 text-xs">{{ authFacade.currentUser()?.username }}</span>
                        </div>
                    </a>
                    <p-divider styleClass="my-0" />
                    <a
                        class="hover:bg-surface-100 dark:hover:bg-surface-800 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-inherit no-underline"
                        [routerLink]="['/users', authFacade.currentUser()?.id]"
                        (click)="userMenu.hide()"
                    >
                        <i class="pi pi-user text-surface-500"></i>
                        <span>{{ t("nav.profile") }}</span>
                    </a>
                    @if (authFacade.isAdmin()) {
                        <a
                            class="hover:bg-surface-100 dark:hover:bg-surface-800 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-inherit no-underline"
                            (click)="userMenu.hide()"
                            routerLink="/admin/overview"
                        >
                            <i class="pi pi-shield text-surface-500"></i>
                            <span>{{ t("nav.admin") }}</span>
                        </a>
                    }
                    <p-divider styleClass="my-0" />
                    <button
                        class="hover:bg-surface-100 dark:hover:bg-surface-800 flex w-full cursor-pointer items-center gap-2 rounded-md border-none bg-transparent px-3 py-2 text-left text-sm text-red-500"
                        (click)="logout(); userMenu.hide()"
                        type="button"
                    >
                        <i class="pi pi-sign-out"></i>
                        <span>{{ t("nav.logout") }}</span>
                    </button>
                </div>
            } @else {
                <div class="flex min-w-40 flex-col gap-1">
                    <a
                        class="hover:bg-surface-100 dark:hover:bg-surface-800 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-inherit no-underline"
                        (click)="userMenu.hide()"
                        routerLink="/login"
                    >
                        <i class="pi pi-sign-in text-surface-500"></i>
                        <span>{{ t("nav.login") }}</span>
                    </a>
                    <a
                        class="hover:bg-surface-100 dark:hover:bg-surface-800 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-inherit no-underline"
                        (click)="userMenu.hide()"
                        routerLink="/register"
                    >
                        <i class="pi pi-user-plus text-surface-500"></i>
                        <span>{{ t("nav.register") }}</span>
                    </a>
                </div>
            }
        </p-popover>
    </ng-container>`,
    styles: [
        `
            .layout-topbar-nav {
                display: none;
                align-items: center;
                gap: 0.25rem;
                margin-left: 1rem;
            }

            @media (min-width: 992px) {
                .layout-topbar-nav {
                    display: flex;
                }
            }

            .topbar-nav-item {
                display: inline-flex;
                align-items: center;
                gap: 0.375rem;
                padding: 0.5rem 0.75rem;
                border-radius: var(--content-border-radius);
                color: var(--text-color-secondary);
                font-size: 0.875rem;
                font-weight: 500;
                white-space: nowrap;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
                background: none;
                text-decoration: none;
            }

            .topbar-nav-item:hover {
                color: var(--text-color);
                background-color: var(--surface-hover);
            }

            .topbar-nav-item i {
                font-size: 1rem;
            }

            .topbar-nav-caret {
                font-size: 0.625rem !important;
                opacity: 0.5;
            }

            .topbar-nav-active {
                color: var(--primary-color) !important;
            }

            .topbar-nav-dropdown {
                position: relative;
            }

            .topbar-dropdown-panel {
                position: absolute;
                top: 100%;
                left: 0;
                min-width: 13rem;
                padding: 0.5rem;
                background: var(--glass-bg-strong);
                backdrop-filter: blur(var(--glass-blur-strong));
                -webkit-backdrop-filter: blur(var(--glass-blur-strong));
                border: 1px solid var(--glass-border);
                border-radius: var(--content-border-radius);
                box-shadow: var(--glass-shadow);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 0.125rem;
                animation: dropdownFadeIn 0.15s ease-out;
            }

            @keyframes dropdownFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-4px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .topbar-dropdown-item {
                display: flex;
                align-items: center;
                gap: 0.625rem;
                padding: 0.5rem 0.75rem;
                border-radius: calc(var(--content-border-radius) - 2px);
                color: var(--text-color);
                font-size: 0.8125rem;
                text-decoration: none;
                transition: background-color 0.15s;
                white-space: nowrap;
            }

            .topbar-dropdown-item:hover {
                background-color: var(--glass-hover);
            }

            .topbar-dropdown-item i {
                font-size: 0.875rem;
                color: var(--text-color-secondary);
                width: 1.25rem;
                text-align: center;
            }

            .topbar-dropdown-item-active {
                color: var(--primary-color);
            }

            .topbar-dropdown-item-active i {
                color: var(--primary-color);
            }

            /* ── Mobile ─────────────────────────────── */
            .topbar-mobile-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.4);
                z-index: 998;
            }

            .topbar-mobile-menu {
                position: fixed;
                top: 0;
                left: 0;
                bottom: 0;
                width: 18rem;
                background: var(--glass-bg-strong);
                backdrop-filter: blur(var(--glass-blur-strong));
                -webkit-backdrop-filter: blur(var(--glass-blur-strong));
                border-right: 1px solid var(--glass-border);
                z-index: 999;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                animation: slideInLeft 0.2s ease-out;
            }

            @keyframes slideInLeft {
                from {
                    transform: translateX(-100%);
                }
                to {
                    transform: translateX(0);
                }
            }

            .topbar-mobile-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem 1.25rem;
                border-bottom: 1px solid var(--glass-border);
            }

            .topbar-mobile-content {
                padding: 0.5rem;
                display: flex;
                flex-direction: column;
                gap: 0.125rem;
            }

            .topbar-mobile-group {
                margin-top: 0.5rem;
                display: flex;
                flex-direction: column;
                gap: 0.125rem;
            }

            .topbar-mobile-group-label {
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--text-color-secondary);
                padding: 0.5rem 0.75rem 0.25rem;
            }
        `
    ]
})
export class AppTopbar {
    items!: MenuItem[];
    navGroups: NavGroup[] = [];

    readonly layoutService = inject(LayoutService);
    readonly authFacade = inject(AuthFacade);
    private readonly translocoService = inject(TranslocoService);
    private readonly router = inject(Router);

    readonly openGroup = signal<string | null>(null);
    readonly mobileMenuOpen = signal(false);
    private currentUrl = "";

    constructor() {
        this.translocoService.langChanges$
            .pipe(
                startWith(this.translocoService.getActiveLang()),
                switchMap((lang) => this.translocoService.selectTranslation(lang))
            )
            .subscribe(() => this.buildNavGroups());

        this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
            this.currentUrl = e.urlAfterRedirects ?? e.url;
            this.openGroup.set(null);
            this.mobileMenuOpen.set(false);
        });
    }

    private t(key: string): string {
        return this.translocoService.translate(key);
    }

    private buildNavGroups(): void {
        this.navGroups = [
            {
                label: this.t("nav.community"),
                icon: "pi-comments",
                routePrefix: [
                    "/forum",
                    "/blog",
                    "/gallery",
                    "/calendar",
                    "/lexicon",
                    "/links",
                    "/recipes",
                    "/messages",
                    "/friends",
                    "/clips",
                    "/clans"
                ],
                items: [
                    { label: this.t("nav.forumOverview"), icon: "pi-comments", route: "/forum" },
                    { label: this.t("nav.blog"), icon: "pi-file-edit", route: "/blog" },
                    { label: this.t("nav.gallery"), icon: "pi-images", route: "/gallery" },
                    { label: this.t("nav.calendar"), icon: "pi-calendar", route: "/calendar" },
                    { label: this.t("nav.lexicon"), icon: "pi-book", route: "/lexicon" },
                    { label: this.t("nav.linkDatabase"), icon: "pi-link", route: "/links" },
                    { label: this.t("nav.recipes"), icon: "pi-star", route: "/recipes" },
                    { label: this.t("nav.messages"), icon: "pi-envelope", route: "/messages" },
                    { label: this.t("nav.friends"), icon: "pi-users", route: "/friends" },
                    { label: this.t("nav.clips"), icon: "pi-video", route: "/clips" },
                    { label: this.t("nav.clans"), icon: "pi-users", route: "/clans" }
                ]
            },
            {
                label: this.t("nav.anime"),
                icon: "pi-star",
                routePrefix: ["/anime", "/steam"],
                items: [
                    { label: this.t("nav.topAnime"), icon: "pi-list", route: "/anime-top-list" },
                    { label: this.t("nav.animeDatabase"), icon: "pi-database", route: "/anime-database" },
                    { label: this.t("nav.characterDatabase"), icon: "pi-users", route: "/anime/characters" },
                    { label: this.t("nav.peopleDatabase"), icon: "pi-id-card", route: "/anime/people" },
                    { label: this.t("nav.myList"), icon: "pi-heart", route: "/anime/my-list" },
                    { label: this.t("nav.steam"), icon: "pi-desktop", route: "/steam" }
                ]
            },
            {
                label: this.t("nav.manga"),
                icon: "pi-book",
                routePrefix: ["/manga"],
                items: [
                    { label: this.t("nav.topManga"), icon: "pi-list", route: "/manga-top-list" },
                    { label: this.t("nav.mangaDatabase"), icon: "pi-database", route: "/manga-database" },
                    { label: this.t("nav.myMangaList"), icon: "pi-heart", route: "/manga/my-list" }
                ]
            },
            {
                label: this.t("nav.tickets"),
                icon: "pi-ticket",
                routePrefix: ["/tickets", "/board", "/backlog", "/roadmap", "/reports"],
                items: [
                    { label: this.t("nav.ticketOverview"), icon: "pi-list", route: "/tickets" },
                    { label: this.t("nav.ticketBoard"), icon: "pi-objects-column", route: "/board-select" },
                    { label: this.t("nav.ticketBacklog"), icon: "pi-bars", route: "/backlog-select" },
                    { label: this.t("nav.ticketRoadmap"), icon: "pi-map", route: "/roadmap-select" },
                    { label: this.t("nav.ticketReports"), icon: "pi-chart-bar", route: "/reports-select" }
                ]
            },
            {
                label: this.t("nav.gamificationSection"),
                icon: "pi-trophy",
                routePrefix: [
                    "/rpg",
                    "/leaderboard",
                    "/hashtags",
                    "/wanted",
                    "/achievements",
                    "/shop",
                    "/lotto",
                    "/tcg",
                    "/market",
                    "/marketplace"
                ],
                items: [
                    { label: this.t("nav.rpg"), icon: "pi-shield", route: "/rpg" },
                    { label: this.t("nav.quests"), icon: "pi-map", route: "/rpg/quests" },
                    { label: this.t("nav.leaderboard"), icon: "pi-chart-bar", route: "/leaderboard" },
                    { label: this.t("nav.hashtags"), icon: "pi-hashtag", route: "/hashtags" },
                    { label: this.t("nav.wanted"), icon: "pi-flag", route: "/wanted" },
                    { label: this.t("nav.achievements"), icon: "pi-trophy", route: "/achievements" },
                    { label: this.t("nav.shop"), icon: "pi-shopping-bag", route: "/shop" },
                    { label: this.t("nav.lotto"), icon: "pi-ticket", route: "/lotto" },
                    { label: this.t("nav.tcg"), icon: "pi-id-card", route: "/tcg" },
                    { label: this.t("nav.dynamicMarket"), icon: "pi-chart-line", route: "/market" },
                    { label: this.t("nav.marketplace"), icon: "pi-shopping-cart", route: "/marketplace" }
                ]
            },
            {
                label: "Admin",
                icon: "pi-shield",
                routePrefix: ["/admin"],
                items: [
                    { label: this.t("nav.overview"), icon: "pi-chart-bar", route: "/admin/overview" },
                    { label: this.t("nav.userManagement"), icon: "pi-user", route: "/admin/users" },
                    { label: this.t("nav.groupManagement"), icon: "pi-shield", route: "/admin/groups" },
                    { label: this.t("nav.moderation"), icon: "pi-verified", route: "/admin/moderation" },
                    { label: this.t("nav.forumStructure"), icon: "pi-sitemap", route: "/admin/forum" },
                    { label: this.t("nav.blogManagement"), icon: "pi-file-edit", route: "/admin/blog" },
                    { label: this.t("nav.ticketManagement"), icon: "pi-ticket", route: "/admin/tickets" },
                    {
                        label: this.t("nav.marketplaceManagement"),
                        icon: "pi-shopping-cart",
                        route: "/admin/marketplace"
                    },
                    { label: this.t("nav.gamification"), icon: "pi-star", route: "/admin/gamification" },
                    { label: this.t("nav.shopManagement"), icon: "pi-shopping-bag", route: "/admin/shop" }
                ]
            }
        ];
    }

    isRouteActive(prefixes: string[]): boolean {
        return prefixes.some((p) => this.currentUrl.startsWith(p));
    }

    currentLang(): string {
        return this.translocoService.getActiveLang();
    }

    toggleLanguage(): void {
        const next = this.currentLang() === "de" ? "en" : "de";
        localStorage.setItem("lang", next);
        this.translocoService.setActiveLang(next);
    }

    userInitial(): string {
        const name = this.authFacade.currentUser()?.displayName ?? this.authFacade.currentUser()?.username ?? "?";
        return name.charAt(0).toUpperCase();
    }

    toggleDarkMode(): void {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    logout(): void {
        this.authFacade.logout();
    }
}
