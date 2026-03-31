import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { TranslocoService } from "@jsverse/transloco";
import { MenuItem } from "primeng/api";
import { Subscription } from "rxjs";
import { filter, startWith, switchMap } from "rxjs/operators";

import { AuthFacade } from "../../facade/auth/auth-facade";
import { AppMenuitem } from "./app.menuitem";

export type SidebarContext =
    | "admin"
    | "marketplace"
    | "tickets"
    | "anime"
    | "gamification"
    | null;

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
    context: SidebarContext = null;

    private readonly translocoService = inject(TranslocoService);
    private readonly authFacade = inject(AuthFacade);
    private readonly router = inject(Router);
    private langSub?: Subscription;
    private routeSub?: Subscription;

    ngOnInit() {
        this.langSub = this.translocoService.langChanges$
            .pipe(
                startWith(this.translocoService.getActiveLang()),
                switchMap((lang) => this.translocoService.selectTranslation(lang))
            )
            .subscribe(() => this.buildMenu());

        this.routeSub = this.router.events
            .pipe(filter((e) => e instanceof NavigationEnd))
            .subscribe((e: NavigationEnd) => {
                const url = e.urlAfterRedirects ?? e.url;
                const newContext = this.detectContext(url);
                if (newContext !== this.context) {
                    this.context = newContext;
                    this.buildMenu();
                }
            });

        // Initial context from current URL
        this.context = this.detectContext(this.router.url);
    }

    ngOnDestroy(): void {
        this.langSub?.unsubscribe();
        this.routeSub?.unsubscribe();
    }

    private detectContext(url: string): SidebarContext {
        if (url.startsWith("/admin")) return "admin";
        if (url.startsWith("/marketplace")) return "marketplace";
        if (url.startsWith("/tickets") || url.startsWith("/board") || url.startsWith("/backlog") || url.startsWith("/roadmap") || url.startsWith("/reports")) return "tickets";
        if (url.startsWith("/anime") || url.startsWith("/steam")) return "anime";
        if (url.startsWith("/wanted") || url.startsWith("/achievements") || url.startsWith("/shop") || url.startsWith("/lotto") || url.startsWith("/tcg") || url.startsWith("/market")) return "gamification";
        return null;
    }

    private t(key: string): string {
        return this.translocoService.translate(key);
    }

    private buildMenu(): void {
        switch (this.context) {
            case "admin":
                this.model = this.buildAdminMenu();
                break;
            case "marketplace":
                this.model = this.buildMarketplaceMenu();
                break;
            case "tickets":
                this.model = this.buildTicketsMenu();
                break;
            case "anime":
                this.model = this.buildAnimeMenu();
                break;
            case "gamification":
                this.model = this.buildGamificationMenu();
                break;
            default:
                this.model = [];
                break;
        }
    }

    private buildAdminMenu(): MenuItem[] {
        if (!this.authFacade.isAdmin()) return [];
        return [
            {
                label: this.t("nav.adminSection"),
                items: [
                    { label: this.t("nav.overview"), icon: "pi pi-fw pi-chart-bar", routerLink: ["/admin/overview"] },
                    { label: this.t("nav.userManagement"), icon: "pi pi-fw pi-user", routerLink: ["/admin/users"] },
                    { label: this.t("nav.groupManagement"), icon: "pi pi-fw pi-shield", routerLink: ["/admin/groups"] },
                    { label: this.t("nav.moderation"), icon: "pi pi-fw pi-verified", routerLink: ["/admin/moderation"] },
                    { label: this.t("nav.pagePermissions"), icon: "pi pi-fw pi-lock", routerLink: ["/admin/permissions"] }
                ]
            },
            {
                label: this.t("nav.adminCommunity"),
                items: [
                    { label: this.t("nav.forumStructure"), icon: "pi pi-fw pi-sitemap", routerLink: ["/admin/forum"] },
                    { label: this.t("nav.blogManagement"), icon: "pi pi-fw pi-file-edit", routerLink: ["/admin/blog"] },
                    { label: this.t("nav.galleryManagement"), icon: "pi pi-fw pi-images", routerLink: ["/admin/gallery"] },
                    { label: this.t("nav.calendarManagement"), icon: "pi pi-fw pi-calendar", routerLink: ["/admin/calendar"] },
                    { label: this.t("nav.lexiconManagement"), icon: "pi pi-fw pi-book", routerLink: ["/admin/lexicon"] },
                    { label: this.t("nav.linkDatabaseManagement"), icon: "pi pi-fw pi-link", routerLink: ["/admin/link-database"] },
                    { label: this.t("nav.feedManagement"), icon: "pi pi-fw pi-th-large", routerLink: ["/admin/feed"] },
                    { label: this.t("nav.communityBot"), icon: "pi pi-fw pi-robot", routerLink: ["/admin/community-bot"] },
                    { label: this.t("nav.mediaManagement"), icon: "pi pi-fw pi-cloud", routerLink: ["/admin/media"] },
                    { label: this.t("nav.ticketManagement"), icon: "pi pi-fw pi-ticket", routerLink: ["/admin/tickets"] },
                    { label: this.t("nav.clanManagement"), icon: "pi pi-fw pi-users", routerLink: ["/admin/clans"] }
                ]
            },
            {
                label: this.t("nav.adminGamification"),
                items: [
                    { label: this.t("nav.gamification"), icon: "pi pi-fw pi-star", routerLink: ["/admin/gamification"] },
                    { label: this.t("nav.achievements"), icon: "pi pi-fw pi-trophy", routerLink: ["/admin/achievements"] },
                    { label: this.t("nav.shopManagement"), icon: "pi pi-fw pi-shopping-bag", routerLink: ["/admin/shop"] },
                    { label: this.t("nav.lottoManagement"), icon: "pi pi-fw pi-ticket", routerLink: ["/admin/lotto"] },
                    { label: this.t("nav.adminTcg"), icon: "pi pi-fw pi-id-card", routerLink: ["/admin/tcg"] },
                    { label: this.t("nav.bountyManagement"), icon: "pi pi-fw pi-flag", routerLink: ["/admin/bounty"] },
                    { label: this.t("nav.dynamicMarketManagement"), icon: "pi pi-fw pi-chart-line", routerLink: ["/admin/market"] },
                    { label: this.t("nav.coinManagement"), icon: "pi pi-fw pi-bitcoin", routerLink: ["/admin/coins"] },
                    { label: this.t("nav.marketplaceManagement"), icon: "pi pi-fw pi-shopping-cart", routerLink: ["/admin/marketplace"] }
                ]
            },
            {
                label: this.t("nav.adminSystem"),
                items: [
                    { label: this.t("nav.slideshow"), icon: "pi pi-fw pi-images", routerLink: ["/admin/slideshow"] },
                    { label: this.t("nav.featuredItems"), icon: "pi pi-fw pi-star", routerLink: ["/admin/featured"] },
                    { label: this.t("nav.adminLogs"), icon: "pi pi-fw pi-list-check", routerLink: ["/admin/logs"] },
                    { label: this.t("nav.adminI18n"), icon: "pi pi-fw pi-language", routerLink: ["/admin/i18n"] }
                ]
            }
        ];
    }

    private buildMarketplaceMenu(): MenuItem[] {
        return [
            {
                label: this.t("nav.marketplace"),
                items: [
                    { label: this.t("marketplace.title"), icon: "pi pi-fw pi-shopping-cart", routerLink: ["/marketplace"] },
                    { label: this.t("marketplace.auction.title"), icon: "pi pi-fw pi-megaphone", routerLink: ["/marketplace/auctions"] },
                    { label: this.t("marketplace.myListings"), icon: "pi pi-fw pi-list", routerLink: ["/marketplace/my"] },
                    { label: this.t("marketplace.createListing"), icon: "pi pi-fw pi-plus", routerLink: ["/marketplace/create"] },
                    { label: this.t("marketplace.auction.myAuctions"), icon: "pi pi-fw pi-megaphone", routerLink: ["/marketplace/auctions/my"] },
                    { label: this.t("marketplace.auction.myBids"), icon: "pi pi-fw pi-history", routerLink: ["/marketplace/auctions/bids"] }
                ]
            }
        ];
    }

    private buildTicketsMenu(): MenuItem[] {
        return [
            {
                label: this.t("nav.tickets"),
                items: [
                    { label: this.t("nav.ticketOverview"), icon: "pi pi-fw pi-list", routerLink: ["/tickets"] },
                    { label: this.t("nav.ticketBoard"), icon: "pi pi-fw pi-objects-column", routerLink: ["/board-select"] },
                    { label: this.t("nav.ticketBacklog"), icon: "pi pi-fw pi-bars", routerLink: ["/backlog-select"] },
                    { label: this.t("nav.ticketRoadmap"), icon: "pi pi-fw pi-map", routerLink: ["/roadmap-select"] },
                    { label: this.t("nav.ticketReports"), icon: "pi pi-fw pi-chart-bar", routerLink: ["/reports-select"] }
                ]
            }
        ];
    }

    private buildAnimeMenu(): MenuItem[] {
        return [
            {
                label: this.t("nav.anime"),
                items: [
                    { label: this.t("nav.topAnime"), icon: "pi pi-fw pi-list", routerLink: ["/anime-top-list"] },
                    { label: this.t("nav.animeDatabase"), icon: "pi pi-fw pi-database", routerLink: ["/anime-database"] },
                    { label: this.t("nav.myList"), icon: "pi pi-fw pi-heart", routerLink: ["/anime/my-list"] },
                    { label: this.t("nav.steam"), icon: "pi pi-fw pi-desktop", routerLink: ["/steam"] }
                ]
            }
        ];
    }

    private buildGamificationMenu(): MenuItem[] {
        return [
            {
                label: this.t("nav.gamificationSection"),
                items: [
                    { label: this.t("nav.wanted"), icon: "pi pi-fw pi-flag", routerLink: ["/wanted"] },
                    { label: this.t("nav.achievements"), icon: "pi pi-fw pi-trophy", routerLink: ["/achievements"] },
                    { label: this.t("nav.shop"), icon: "pi pi-fw pi-shopping-bag", routerLink: ["/shop"] },
                    { label: this.t("nav.lotto"), icon: "pi pi-fw pi-ticket", routerLink: ["/lotto"] },
                    { label: this.t("nav.tcg"), icon: "pi pi-fw pi-id-card", routerLink: ["/tcg"] },
                    { label: this.t("nav.dynamicMarket"), icon: "pi pi-fw pi-chart-line", routerLink: ["/market"] },
                    { label: this.t("nav.marketplace"), icon: "pi pi-fw pi-shopping-cart", routerLink: ["/marketplace"] }
                ]
            }
        ];
    }
}
