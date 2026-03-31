import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, Renderer2, ViewChild } from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { filter, Subscription } from "rxjs";

import { AchievementToast } from "../../core/components/achievement-toast/achievement-toast";
import { SessionExpiredDialog } from "../../core/components/session-expired-dialog/session-expired-dialog";
import { SessionService } from "../../core/services/session.service";
import { AppFooter } from "./app.footer";
import { AppSidebar } from "./app.sidebar";
import { AppTopbar } from "./app.topbar";
import { LayoutService } from "./service/layout.service";

@Component({
    selector: "app-layout",
    standalone: true,
    imports: [CommonModule, AchievementToast, SessionExpiredDialog, AppTopbar, AppSidebar, RouterModule, AppFooter],
    template: `<div class="layout-wrapper" [ngClass]="containerClass">
        <app-topbar></app-topbar>
        @if (hasSidebar) {
            <app-sidebar></app-sidebar>
        }
        <div class="layout-main-container">
            <div class="layout-main">
                <router-outlet></router-outlet>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein"></div>
        <app-achievement-toast />
        <app-session-expired-dialog />
    </div> `
})
export class AppLayout implements OnDestroy {
    @ViewChild(AppSidebar) appSidebar!: AppSidebar;
    @ViewChild(AppTopbar) appTopBar!: AppTopbar;

    overlayMenuOpenSubscription: Subscription;
    menuOutsideClickListener: (() => void) | null = null;
    hasSidebar = false;

    layoutService = inject(LayoutService);
    renderer = inject(Renderer2);
    router = inject(Router);
    private readonly sessionService = inject(SessionService);

    constructor() {
        this.sessionService.start();
        this.hasSidebar = this.detectSidebar(this.router.url);

        this.overlayMenuOpenSubscription = this.layoutService.overlayOpen$.subscribe(() => {
            if (!this.menuOutsideClickListener) {
                this.menuOutsideClickListener = this.renderer.listen("document", "click", (event) => {
                    if (this.isOutsideClicked(event)) {
                        this.hideMenu();
                    }
                });
            }

            if (this.layoutService.layoutState().staticMenuMobileActive) {
                this.blockBodyScroll();
            }
        });

        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
            this.hideMenu();
            this.hasSidebar = this.detectSidebar(e.urlAfterRedirects ?? e.url);
        });
    }

    private detectSidebar(url: string): boolean {
        if (url.startsWith("/admin")) return true;
        if (url.startsWith("/marketplace")) return true;
        if (url.startsWith("/tickets") || url.startsWith("/board") || url.startsWith("/backlog") || url.startsWith("/roadmap") || url.startsWith("/reports")) return true;
        if (url.startsWith("/anime") || url.startsWith("/steam")) return true;
        if (url.startsWith("/wanted") || url.startsWith("/achievements") || url.startsWith("/shop") || url.startsWith("/lotto") || url.startsWith("/tcg") || url.startsWith("/market")) return true;
        return false;
    }

    get containerClass() {
        const hasStaticSidebar = this.hasSidebar && this.layoutService.layoutConfig().menuMode === "static";
        return {
            "layout-overlay": this.layoutService.layoutConfig().menuMode === "overlay",
            "layout-static": hasStaticSidebar,
            "layout-static-inactive":
                (!this.hasSidebar || this.layoutService.layoutState().staticMenuDesktopInactive) &&
                this.layoutService.layoutConfig().menuMode === "static",
            "layout-overlay-active": this.layoutService.layoutState().overlayMenuActive,
            "layout-mobile-active": this.layoutService.layoutState().staticMenuMobileActive
        };
    }

    isOutsideClicked(event: MouseEvent) {
        const sidebarEl = document.querySelector(".layout-sidebar");
        const topbarEl = document.querySelector(".layout-menu-button");
        const eventTarget = event.target as Node;

        return !(
            sidebarEl?.isSameNode(eventTarget) ||
            sidebarEl?.contains(eventTarget) ||
            topbarEl?.isSameNode(eventTarget) ||
            topbarEl?.contains(eventTarget)
        );
    }

    hideMenu() {
        this.layoutService.layoutState.update((prev) => ({
            ...prev,
            overlayMenuActive: false,
            staticMenuMobileActive: false,
            menuHoverActive: false
        }));
        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
            this.menuOutsideClickListener = null;
        }
        this.unblockBodyScroll();
    }

    blockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.add("blocked-scroll");
        } else {
            document.body.className += " blocked-scroll";
        }
    }

    unblockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.remove("blocked-scroll");
        } else {
            document.body.className = document.body.className.replace(
                new RegExp("(^|\\b)" + "blocked-scroll".split(" ").join("|") + "(\\b|$)", "gi"),
                " "
            );
        }
    }

    ngOnDestroy() {
        if (this.overlayMenuOpenSubscription) {
            this.overlayMenuOpenSubscription.unsubscribe();
        }

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
        }
    }
}
