import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MenuItem } from "primeng/api";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { PopoverModule } from "primeng/popover";
import { StyleClassModule } from "primeng/styleclass";

import { NotificationBell } from "../../core/components/notification-bell/notification-bell";
import { AuthFacade } from "../../facade/auth/auth-facade";
import { AppConfigurator } from "./app.configurator";
import { LayoutService } from "./service/layout.service";

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
                <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars"></i>
                </button>
                <a class="layout-topbar-logo" routerLink="/">
                    <img alt="Aniverse" src="assets/images/logo.png" style="height: 2.5rem; width: auto;" />
                    <span>Aniverse</span>
                </a>
            </div>

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
                            routerLink="/admin"
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
    </ng-container>`
})
export class AppTopbar {
    items!: MenuItem[];

    readonly layoutService = inject(LayoutService);
    readonly authFacade = inject(AuthFacade);
    private readonly translocoService = inject(TranslocoService);

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
