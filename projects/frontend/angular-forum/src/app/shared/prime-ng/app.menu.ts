import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { MenuItem } from "primeng/api";

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
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: "Home",
                items: [{ label: "Dashboard", icon: "pi pi-fw pi-home", routerLink: ["/dashboard"] }]
            },
            {
                label: "Forum",
                items: [{ label: "Forum Übersicht", icon: "pi pi-fw pi-comments", routerLink: ["/forum"] }]
            },
            {
                label: "Anime",
                items: [
                    { label: "Top Anime", icon: "pi pi-fw pi-list", routerLink: ["/anime-top-list"] },
                    { label: "Anime Database", icon: "pi pi-fw pi-database", routerLink: ["/anime-database"] },
                    { label: "Meine Liste", icon: "pi pi-fw pi-heart", routerLink: ["/anime/my-list"] }
                ]
            },

            {
                label: "Admin",
                items: [
                    { label: "Übersicht", icon: "pi pi-fw pi-chart-bar", routerLink: ["/admin/overview"] },
                    { label: "Forenstruktur", icon: "pi pi-fw pi-sitemap", routerLink: ["/admin/forum"] },
                    { label: "Benutzerverwaltung", icon: "pi pi-fw pi-users", routerLink: ["/admin/users"] },
                    { label: "Gruppenverwaltung", icon: "pi pi-fw pi-shield", routerLink: ["/admin/groups"] },
                    { label: "Seitenberechtigungen", icon: "pi pi-fw pi-lock", routerLink: ["/admin/permissions"] },
                    { label: "Gamification", icon: "pi pi-fw pi-star", routerLink: ["/admin/gamification"] }
                ]
            },
            {
                label: "Further Links",
                items: [
                    {
                        label: "Documentation",
                        icon: "pi pi-fw pi-book",
                        routerLink: ["/documentation"]
                    },
                    {
                        label: "View Source",
                        icon: "pi pi-fw pi-github",
                        url: "https://github.com/primefaces/sakai-ng",
                        target: "_blank"
                    }
                ]
            }
        ];
    }
}
