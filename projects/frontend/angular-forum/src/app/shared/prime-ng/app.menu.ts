import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoService } from "@jsverse/transloco";
import { MenuItem } from "primeng/api";
import { Subscription } from "rxjs";
import { startWith, switchMap } from "rxjs/operators";

import { AppMenuitem } from "./app.menuitem";

@Component({
    selector: "app-menu",
    standalone: true,
    imports: [AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item; let i = $index) {
            @if (!item.separator) {
                <li [index]="i" [item]="item" [root]="true" app-menuitem></li>
            }
            @if (item.separator) {
                <li class="menu-separator"></li>
            }
        }
    </ul>`
})
export class AppMenu implements OnInit, OnDestroy {
    model: MenuItem[] = [];

    private readonly translocoService = inject(TranslocoService);
    private langSub?: Subscription;

    ngOnInit() {
        this.langSub = this.translocoService.langChanges$
            .pipe(
                startWith(this.translocoService.getActiveLang()),
                switchMap((lang) => this.translocoService.selectTranslation(lang))
            )
            .subscribe(() => this.buildMenu());
    }

    ngOnDestroy(): void {
        this.langSub?.unsubscribe();
    }

    private t(key: string): string {
        return this.translocoService.translate(key);
    }

    private buildMenu(): void {
        this.model = [
            // ── Startseite ────────────────────────────────────────────
            {
                label: this.t("nav.home"),
                items: [
                    { label: this.t("nav.feed"), icon: "pi pi-fw pi-th-large", routerLink: ["/feed"] },
                    { label: this.t("nav.dashboard"), icon: "pi pi-fw pi-home", routerLink: ["/dashboard"] },
                    { label: this.t("nav.chronik"), icon: "pi pi-fw pi-history", routerLink: ["/chronik"] }
                ]
            },
            // ── Community ─────────────────────────────────────────────
            {
                label: this.t("nav.community"),
                items: [
                    { label: this.t("nav.forumOverview"), icon: "pi pi-fw pi-comments", routerLink: ["/forum"] },
                    { label: this.t("nav.blog"), icon: "pi pi-fw pi-file-edit", routerLink: ["/blog"] },
                    { label: this.t("nav.gallery"), icon: "pi pi-fw pi-images", routerLink: ["/gallery"] },
                    { label: this.t("nav.calendar"), icon: "pi pi-fw pi-calendar", routerLink: ["/calendar"] },
                    { label: this.t("nav.lexicon"), icon: "pi pi-fw pi-book", routerLink: ["/lexicon"] },
                    { label: this.t("nav.linkDatabase"), icon: "pi pi-fw pi-link", routerLink: ["/links"] },
                    { label: this.t("nav.recipes"), icon: "pi pi-fw pi-star", routerLink: ["/recipes"] },
                    { label: this.t("nav.messages"), icon: "pi pi-fw pi-envelope", routerLink: ["/messages"] },
                    { label: this.t("nav.friends"), icon: "pi pi-fw pi-users", routerLink: ["/friends"] }
                ]
            },
            // ── Anime ─────────────────────────────────────────────────
            {
                label: this.t("nav.anime"),
                items: [
                    { label: this.t("nav.topAnime"), icon: "pi pi-fw pi-list", routerLink: ["/anime-top-list"] },
                    {
                        label: this.t("nav.animeDatabase"),
                        icon: "pi pi-fw pi-database",
                        routerLink: ["/anime-database"]
                    },
                    { label: this.t("nav.myList"), icon: "pi pi-fw pi-heart", routerLink: ["/anime/my-list"] },
                    { label: this.t("nav.steam"), icon: "pi pi-fw pi-desktop", routerLink: ["/steam"] }
                ]
            },
            // ── Gamification ──────────────────────────────────────────
            {
                label: this.t("nav.gamificationSection"),
                items: [
                    {
                        label: this.t("nav.achievements"),
                        icon: "pi pi-fw pi-trophy",
                        routerLink: ["/achievements"]
                    },
                    { label: this.t("nav.shop"), icon: "pi pi-fw pi-shopping-bag", routerLink: ["/shop"] },
                    { label: this.t("nav.lotto"), icon: "pi pi-fw pi-ticket", routerLink: ["/lotto"] },
                    { label: this.t("nav.tcg"), icon: "pi pi-fw pi-id-card", routerLink: ["/tcg"] },
                    { label: this.t("nav.dynamicMarket"), icon: "pi pi-fw pi-chart-line", routerLink: ["/market"] },
                    {
                        label: this.t("nav.marketplace"),
                        icon: "pi pi-fw pi-shopping-cart",
                        routerLink: ["/marketplace"]
                    }
                ]
            },
            // ── Administration ────────────────────────────────────────
            {
                label: this.t("nav.adminSection"),
                items: [
                    { label: this.t("nav.overview"), icon: "pi pi-fw pi-chart-bar", routerLink: ["/admin/overview"] },
                    {
                        label: this.t("nav.adminUsers"),
                        icon: "pi pi-fw pi-users",
                        items: [
                            {
                                label: this.t("nav.userManagement"),
                                icon: "pi pi-fw pi-user",
                                routerLink: ["/admin/users"]
                            },
                            {
                                label: this.t("nav.groupManagement"),
                                icon: "pi pi-fw pi-shield",
                                routerLink: ["/admin/groups"]
                            },
                            {
                                label: this.t("nav.pagePermissions"),
                                icon: "pi pi-fw pi-lock",
                                routerLink: ["/admin/permissions"]
                            }
                        ]
                    },
                    {
                        label: this.t("nav.adminCommunity"),
                        icon: "pi pi-fw pi-comments",
                        items: [
                            {
                                label: this.t("nav.forumStructure"),
                                icon: "pi pi-fw pi-sitemap",
                                routerLink: ["/admin/forum"]
                            },
                            {
                                label: this.t("nav.blogManagement"),
                                icon: "pi pi-fw pi-file-edit",
                                routerLink: ["/admin/blog"]
                            },
                            {
                                label: this.t("nav.galleryManagement"),
                                icon: "pi pi-fw pi-images",
                                routerLink: ["/admin/gallery"]
                            },
                            {
                                label: this.t("nav.calendarManagement"),
                                icon: "pi pi-fw pi-calendar",
                                routerLink: ["/admin/calendar"]
                            },
                            {
                                label: this.t("nav.lexiconManagement"),
                                icon: "pi pi-fw pi-book",
                                routerLink: ["/admin/lexicon"]
                            },
                            {
                                label: this.t("nav.linkDatabaseManagement"),
                                icon: "pi pi-fw pi-link",
                                routerLink: ["/admin/link-database"]
                            },
                            {
                                label: this.t("nav.feedManagement"),
                                icon: "pi pi-fw pi-th-large",
                                routerLink: ["/admin/feed"]
                            },
                            {
                                label: this.t("nav.communityBot"),
                                icon: "pi pi-fw pi-robot",
                                routerLink: ["/admin/community-bot"]
                            }
                        ]
                    },
                    {
                        label: this.t("nav.adminGamification"),
                        icon: "pi pi-fw pi-trophy",
                        items: [
                            {
                                label: this.t("nav.gamification"),
                                icon: "pi pi-fw pi-star",
                                routerLink: ["/admin/gamification"]
                            },
                            {
                                label: this.t("nav.achievements"),
                                icon: "pi pi-fw pi-trophy",
                                routerLink: ["/admin/achievements"]
                            },
                            {
                                label: this.t("nav.shopManagement"),
                                icon: "pi pi-fw pi-shopping-bag",
                                routerLink: ["/admin/shop"]
                            },
                            {
                                label: this.t("nav.lottoManagement"),
                                icon: "pi pi-fw pi-ticket",
                                routerLink: ["/admin/lotto"]
                            },
                            { label: this.t("nav.adminTcg"), icon: "pi pi-fw pi-id-card", routerLink: ["/admin/tcg"] },
                            {
                                label: this.t("nav.dynamicMarketManagement"),
                                icon: "pi pi-fw pi-chart-line",
                                routerLink: ["/admin/market"]
                            },
                            {
                                label: this.t("nav.coinManagement"),
                                icon: "pi pi-fw pi-bitcoin",
                                routerLink: ["/admin/coins"]
                            },
                            {
                                label: this.t("nav.marketplaceManagement"),
                                icon: "pi pi-fw pi-shopping-cart",
                                routerLink: ["/admin/marketplace"]
                            }
                        ]
                    },
                    {
                        label: this.t("nav.adminAppearance"),
                        icon: "pi pi-fw pi-palette",
                        items: [
                            {
                                label: this.t("nav.slideshow"),
                                icon: "pi pi-fw pi-images",
                                routerLink: ["/admin/slideshow"]
                            }
                        ]
                    },
                    {
                        label: this.t("nav.adminSystem"),
                        icon: "pi pi-fw pi-cog",
                        items: [
                            {
                                label: this.t("nav.adminLogs"),
                                icon: "pi pi-fw pi-list-check",
                                routerLink: ["/admin/logs"]
                            }
                        ]
                    }
                ]
            }
        ];
    }
}
