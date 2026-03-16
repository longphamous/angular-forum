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
            <!-- Root section header (clickable toggle, no routerLink) -->
            <div
                class="layout-menuitem-root-text"
                *ngIf="root && item.visible !== false"
                (click)="rootToggle($event)"
                (keydown.enter)="rootToggle($event)"
                role="button"
                tabindex="0"
            >
                <span>{{ item.label }}</span>
                <i class="pi pi-angle-down layout-section-toggler" [class.rotated]="!active"></i>
            </div>

            <!-- Non-root item with submenu (no routerLink, has children) -->
            <a
                *ngIf="!root && !item.routerLink && item.items && item.visible !== false"
                [attr.href]="item.url"
                [attr.target]="item.target"
                [ngClass]="item.styleClass"
                (click)="itemClick($event)"
                pRipple
                tabindex="0"
            >
                <i class="layout-menuitem-icon" [ngClass]="item.icon"></i>
                <span class="layout-menuitem-text">{{ item.label }}</span>
                <i class="pi pi-fw pi-angle-down layout-submenu-toggler"></i>
            </a>

            <!-- Non-root item with no children and no routerLink (plain link) -->
            <a
                *ngIf="!root && !item.routerLink && !item.items && item.visible !== false"
                [attr.href]="item.url"
                [attr.target]="item.target"
                [ngClass]="item.styleClass"
                (click)="itemClick($event)"
                pRipple
                tabindex="0"
            >
                <i class="layout-menuitem-icon" [ngClass]="item.icon"></i>
                <span class="layout-menuitem-text">{{ item.label }}</span>
            </a>

            <!-- Non-root item with routerLink (leaf navigation) -->
            <a
                *ngIf="!root && item.routerLink && !item.items && item.visible !== false"
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
            </a>

            <ul *ngIf="item.items && item.visible !== false" [@children]="submenuAnimation" style="overflow: hidden;">
                <ng-template [ngForOf]="item.items" let-child let-i="index" ngFor>
                    <li [class]="child['badgeClass']" [index]="i" [item]="child" [parentKey]="key" app-menuitem></li>
                </ng-template>
            </ul>
        </ng-container>
    `,
    styles: [
        `
            .layout-menuitem-root-text {
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
                user-select: none;
                padding: 0.25rem 0;
            }
            .layout-menuitem-root-text:hover {
                opacity: 0.8;
            }
            .layout-section-toggler {
                transition: transform 0.3s cubic-bezier(0.86, 0, 0.07, 1);
                font-size: 0.75rem;
                opacity: 0.6;
            }
            .layout-section-toggler.rotated {
                transform: rotate(-90deg);
            }
        `
    ],
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
    ]
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
                // Root sections manage their own expand/collapse independently
                if (this.root) return;

                if (value.routeEvent) {
                    this.active = value.key === this.key || value.key.startsWith(this.key + "-");
                } else {
                    if (value.key !== this.key && !value.key.startsWith(this.key + "-")) {
                        this.active = false;
                    }
                }
            });
        });

        this.menuResetSubscription = this.layoutService.resetSource$.subscribe(() => {
            // Do not collapse root sections on reset — they manage their own state
            if (!this.root) {
                this.active = false;
            }
        });

        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe((_params: NavigationEnd) => {
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
        return this.active ? "expanded" : "collapsed";
    }

    ngOnInit() {
        this.key = this.parentKey ? this.parentKey + "-" + this.index : String(this.index);

        // Root sections: expand by default unless item['data']?.collapsed is true
        if (this.root && this.item.items) {
            const data = this.item["data"] as { collapsed?: boolean } | undefined;
            this.active = !(data?.collapsed === true);
        }

        if (this.item.routerLink) {
            this.updateActiveStateFromRoute();
        }
    }

    updateActiveStateFromRoute() {
        const activeRoute = this.router.isActive(this.item.routerLink![0], {
            paths: "exact",
            queryParams: "ignored",
            matrixParams: "ignored",
            fragment: "ignored"
        });

        if (activeRoute) {
            this.layoutService.onMenuStateChange({ key: this.key, routeEvent: true });
        }
    }

    /** Toggle root section independently (no sibling collapse). */
    rootToggle(event: Event): void {
        event.preventDefault();
        this.active = !this.active;
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

        // toggle active state for items with children
        if (this.item.items) {
            this.active = !this.active;
            this.layoutService.onMenuStateChange({ key: this.key });
        }
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
