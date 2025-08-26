import { animate, state, style, transition, trigger } from "@angular/animations";
import { CommonModule } from "@angular/common";
import { Component, HostBinding, inject, Input, OnDestroy, OnInit } from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { MenuItem } from "primeng/api";
import { RippleModule } from "primeng/ripple";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";

import { LayoutService } from "./service/layout.service";

@Component({
    selector: "[app-menuitem]",
    imports: [CommonModule, RouterModule, RippleModule],
    template: `
        <ng-container>
            <div class="layout-menuitem-root-text" *ngIf="root && item.visible !== false">{{ item.label }}</div>
            <a
                *ngIf="(!item.routerLink || item.items) && item.visible !== false"
                [attr.href]="item.url"
                [attr.target]="item.target"
                [ngClass]="item.styleClass"
                (click)="itemClick($event)"
                pRipple
                tabindex="0"
            >
                <i class="layout-menuitem-icon" [ngClass]="item.icon"></i>
                <span class="layout-menuitem-text">{{ item.label }}</span>
                <i class="pi pi-fw pi-angle-down layout-submenu-toggler" *ngIf="item.items"></i>
            </a>
            <a
                *ngIf="item.routerLink && !item.items && item.visible !== false"
                [attr.target]="item.target"
                [fragment]="item.fragment"
                [ngClass]="item.styleClass"
                [preserveFragment]="item.preserveFragment"
                [queryParams]="item.queryParams"
                [queryParamsHandling]="item.queryParamsHandling"
                [replaceUrl]="item.replaceUrl"
                [routerLink]="item.routerLink"
                [routerLinkActiveOptions]="
                    item.routerLinkActiveOptions || {
                        paths: 'exact',
                        queryParams: 'ignored',
                        matrixParams: 'ignored',
                        fragment: 'ignored'
                    }
                "
                [skipLocationChange]="item.skipLocationChange"
                [state]="item.state"
                (click)="itemClick($event)"
                pRipple
                routerLinkActive="active-route"
                tabindex="0"
            >
                <i class="layout-menuitem-icon" [ngClass]="item.icon"></i>
                <span class="layout-menuitem-text">{{ item.label }}</span>
                <i class="pi pi-fw pi-angle-down layout-submenu-toggler" *ngIf="item.items"></i>
            </a>

            <ul *ngIf="item.items && item.visible !== false" [@children]="submenuAnimation">
                <ng-template [ngForOf]="item.items" let-child let-i="index" ngFor>
                    <li [class]="child['badgeClass']" [index]="i" [item]="child" [parentKey]="key" app-menuitem></li>
                </ng-template>
            </ul>
        </ng-container>
    `,
    animations: [
        trigger("children", [
            state(
                "collapsed",
                style({
                    height: "0"
                })
            ),
            state(
                "expanded",
                style({
                    height: "*"
                })
            ),
            transition("collapsed <=> expanded", animate("400ms cubic-bezier(0.86, 0, 0.07, 1)"))
        ])
    ],
    providers: [LayoutService]
})
export class AppMenuitem implements OnInit, OnDestroy {
    @Input() item!: MenuItem;

    @Input() index!: number;

    @Input() @HostBinding("class.layout-root-menuitem") root!: boolean;

    @Input() parentKey!: string;

    active = false;

    menuSourceSubscription: Subscription;

    menuResetSubscription: Subscription;

    key = "";

    router = inject(Router);
    layoutService = inject(LayoutService);

    constructor() {
        this.menuSourceSubscription = this.layoutService.menuSource$.subscribe((value) => {
            Promise.resolve(null).then(() => {
                if (value.routeEvent) {
                    this.active = value.key === this.key || value.key.startsWith(this.key + "-") ? true : false;
                } else {
                    if (value.key !== this.key && !value.key.startsWith(this.key + "-")) {
                        this.active = false;
                    }
                }
            });
        });

        this.menuResetSubscription = this.layoutService.resetSource$.subscribe(() => {
            this.active = false;
        });

        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((params) => {
            if (this.item.routerLink) {
                this.updateActiveStateFromRoute();
            }
        });
    }

    @HostBinding("class.active-menuitem")
    get activeClass() {
        return this.active && !this.root;
    }

    get submenuAnimation() {
        return this.root ? "expanded" : this.active ? "expanded" : "collapsed";
    }

    ngOnInit() {
        this.key = this.parentKey ? this.parentKey + "-" + this.index : String(this.index);

        if (this.item.routerLink) {
            this.updateActiveStateFromRoute();
        }
    }

    updateActiveStateFromRoute() {
        const activeRoute = this.router.isActive(this.item.routerLink[0], {
            paths: "exact",
            queryParams: "ignored",
            matrixParams: "ignored",
            fragment: "ignored"
        });

        if (activeRoute) {
            this.layoutService.onMenuStateChange({ key: this.key, routeEvent: true });
        }
    }

    itemClick(event: Event) {
        // avoid processing disabled items
        if (this.item.disabled) {
            event.preventDefault();
            return;
        }

        // execute command
        if (this.item.command) {
            this.item.command({ originalEvent: event, item: this.item });
        }

        // toggle active state
        if (this.item.items) {
            this.active = !this.active;
        }

        this.layoutService.onMenuStateChange({ key: this.key });
    }

    ngOnDestroy() {
        if (this.menuSourceSubscription) {
            this.menuSourceSubscription.unsubscribe();
        }

        if (this.menuResetSubscription) {
            this.menuResetSubscription.unsubscribe();
        }
    }
}
