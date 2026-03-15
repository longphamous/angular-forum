import { CommonModule } from "@angular/common";
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
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li *ngIf="!item.separator" [index]="i" [item]="item" [root]="true" app-menuitem></li>
            <li class="menu-separator" *ngIf="item.separator"></li>
        </ng-container>
    </ul> `
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
            {
                label: this.t("nav.home"),
                items: [{ label: this.t("nav.dashboard"), icon: "pi pi-fw pi-home", routerLink: ["/dashboard"] }]
            },
            {
                label: this.t("nav.forum"),
                items: [{ label: this.t("nav.forumOverview"), icon: "pi pi-fw pi-comments", routerLink: ["/forum"] }]
            },
            {
                label: this.t("nav.shopSection"),
                items: [{ label: this.t("nav.shop"), icon: "pi pi-fw pi-shopping-bag", routerLink: ["/shop"] }]
            },
            {
                label: this.t("nav.calendarSection"),
                items: [{ label: this.t("nav.calendar"), icon: "pi pi-fw pi-calendar", routerLink: ["/calendar"] }]
            },
            {
                label: this.t("nav.lottoSection"),
                items: [{ label: this.t("nav.lotto"), icon: "pi pi-fw pi-ticket", routerLink: ["/lotto"] }]
            },
            {
                label: this.t("nav.messagesSection"),
                items: [{ label: this.t("nav.messages"), icon: "pi pi-fw pi-envelope", routerLink: ["/messages"] }]
            },
            {
                label: this.t("nav.gallerySection"),
                items: [{ label: this.t("nav.gallery"), icon: "pi pi-fw pi-images", routerLink: ["/gallery"] }]
            },
            {
                label: this.t("nav.blogSection"),
                items: [
                    { label: this.t("nav.blog"), icon: "pi pi-fw pi-file-edit", routerLink: ["/blog"] },
                    { label: this.t("nav.writeBlog"), icon: "pi pi-fw pi-pencil", routerLink: ["/blog/write"] }
                ]
            },
            {
                label: this.t("nav.anime"),
                items: [
                    { label: this.t("nav.topAnime"), icon: "pi pi-fw pi-list", routerLink: ["/anime-top-list"] },
                    {
                        label: this.t("nav.animeDatabase"),
                        icon: "pi pi-fw pi-database",
                        routerLink: ["/anime-database"]
                    },
                    { label: this.t("nav.myList"), icon: "pi pi-fw pi-heart", routerLink: ["/anime/my-list"] }
                ]
            },
            {
                label: this.t("nav.adminSection"),
                items: [
                    { label: this.t("nav.overview"), icon: "pi pi-fw pi-chart-bar", routerLink: ["/admin/overview"] },
                    { label: this.t("nav.forumStructure"), icon: "pi pi-fw pi-sitemap", routerLink: ["/admin/forum"] },
                    { label: this.t("nav.userManagement"), icon: "pi pi-fw pi-users", routerLink: ["/admin/users"] },
                    { label: this.t("nav.groupManagement"), icon: "pi pi-fw pi-shield", routerLink: ["/admin/groups"] },
                    {
                        label: this.t("nav.pagePermissions"),
                        icon: "pi pi-fw pi-lock",
                        routerLink: ["/admin/permissions"]
                    },
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
                    { label: this.t("nav.slideshow"), icon: "pi pi-fw pi-images", routerLink: ["/admin/slideshow"] },
                    {
                        label: this.t("nav.shopManagement"),
                        icon: "pi pi-fw pi-shopping-bag",
                        routerLink: ["/admin/shop"]
                    },
                    {
                        label: this.t("nav.calendarManagement"),
                        icon: "pi pi-fw pi-calendar",
                        routerLink: ["/admin/calendar"]
                    },
                    {
                        label: this.t("nav.lottoManagement"),
                        icon: "pi pi-fw pi-ticket",
                        routerLink: ["/admin/lotto"]
                    },
                    {
                        label: this.t("nav.galleryManagement"),
                        icon: "pi pi-fw pi-images",
                        routerLink: ["/admin/gallery"]
                    },
                    {
                        label: this.t("nav.blogManagement"),
                        icon: "pi pi-fw pi-file-edit",
                        routerLink: ["/admin/blog"]
                    },
                    { label: this.t("nav.coinManagement"), icon: "pi pi-fw pi-bitcoin", routerLink: ["/admin/coins"] }
                ]
            },
            {
                label: this.t("nav.furtherLinks"),
                items: [
                    {
                        label: this.t("nav.documentation"),
                        icon: "pi pi-fw pi-book",
                        routerLink: ["/documentation"]
                    },
                    {
                        label: this.t("nav.viewSource"),
                        icon: "pi pi-fw pi-github",
                        url: "https://github.com/primefaces/sakai-ng",
                        target: "_blank"
                    }
                ]
            }
        ];
    }
}
