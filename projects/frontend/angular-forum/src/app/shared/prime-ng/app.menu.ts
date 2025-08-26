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
                items: [{ label: "Forum List", icon: "pi pi-fw pi-th-large", routerLink: ["/forum"] }]
            },
            {
                label: "Anime",
                items: [
                    { label: "Top Anime", icon: "pi pi-fw pi-list", routerLink: ["/top-anime"] },
                    { label: "Anime Database", icon: "pi pi-fw pi-database", routerLink: ["/anime-database"] }
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
