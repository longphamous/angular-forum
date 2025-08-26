import { computed, effect, Injectable, signal } from "@angular/core";
import { Observable, Subject } from "rxjs";

// Interfaces

export interface LayoutConfig {
    preset?: string;
    primary?: string;
    surface?: string | null;
    darkTheme?: boolean;
    menuMode?: string;
}

interface LayoutState {
    staticMenuDesktopInactive?: boolean;
    overlayMenuActive?: boolean;
    configSidebarVisible?: boolean;
    staticMenuMobileActive?: boolean;
    menuHoverActive?: boolean;
}

interface MenuChangeEvent {
    key: string;
    routeEvent?: boolean;
}

// Injectable Service

@Injectable({
    providedIn: "root"
})
export class LayoutService {
    _config: LayoutConfig = {
        preset: "Aura",
        primary: "emerald",
        surface: null,
        darkTheme: false,
        menuMode: "static"
    };

    _state: LayoutState = {
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false
    };

    layoutConfig = signal<LayoutConfig>(this._config);
    layoutState = signal<LayoutState>(this._state);

    menuSource$: Observable<MenuChangeEvent>;
    resetSource$: Observable<boolean>;
    configUpdate$: Observable<LayoutConfig>;
    overlayOpen$: Observable<null>;

    theme = computed<string>(() => (this.layoutConfig()?.darkTheme ? "light" : "dark"));

    isSidebarActive = computed<boolean>(
        () => !!this.layoutState().overlayMenuActive || !!this.layoutState().staticMenuMobileActive
    );

    isDarkTheme = computed<boolean>(() => this.layoutConfig().darkTheme ?? false);

    getPrimary = computed<string | undefined>(() => this.layoutConfig().primary);

    getSurface = computed<string | null | undefined>(() => this.layoutConfig().surface);

    isOverlay = computed<boolean>(() => this.layoutConfig().menuMode === "overlay");

    transitionComplete = signal<boolean>(false);

    private initialized = false;

    private configUpdate: Subject<LayoutConfig> = new Subject<LayoutConfig>();
    private overlayOpen: Subject<null> = new Subject<null>();
    private menuSource: Subject<MenuChangeEvent> = new Subject<MenuChangeEvent>();
    private resetSource: Subject<boolean> = new Subject<boolean>();

    constructor() {
        effect(() => {
            const config = this.layoutConfig();
            if (config) {
                this.onConfigUpdate();
            }
        });

        effect(() => {
            const config = this.layoutConfig();

            if (!this.initialized || !config) {
                this.initialized = true;
                return;
            }

            this.handleDarkModeTransition(config);
        });

        this.menuSource$ = this.menuSource.asObservable();
        this.resetSource$ = this.resetSource.asObservable();
        this.configUpdate$ = this.configUpdate.asObservable();
        this.overlayOpen$ = this.overlayOpen.asObservable();
    }

    toggleDarkMode(config?: LayoutConfig): void {
        const _config = config || this.layoutConfig();
        if (_config.darkTheme) {
            document.documentElement.classList.add("app-dark");
        } else {
            document.documentElement.classList.remove("app-dark");
        }
    }

    onMenuToggle(): void {
        if (this.isOverlay()) {
            this.layoutState.update((prev) => ({
                ...prev,
                overlayMenuActive: !this.layoutState().overlayMenuActive
            }));

            if (this.layoutState().overlayMenuActive) {
                this.overlayOpen.next(null);
            }
        }

        if (this.isDesktop()) {
            this.layoutState.update((prev) => ({
                ...prev,
                staticMenuDesktopInactive: !this.layoutState().staticMenuDesktopInactive
            }));
        } else {
            this.layoutState.update((prev) => ({
                ...prev,
                staticMenuMobileActive: !this.layoutState().staticMenuMobileActive
            }));

            if (this.layoutState().staticMenuMobileActive) {
                this.overlayOpen.next(null);
            }
        }
    }

    isDesktop(): boolean {
        return window.innerWidth > 991;
    }

    isMobile(): boolean {
        return !this.isDesktop();
    }

    onConfigUpdate(): void {
        this._config = { ...this.layoutConfig() };
        this.configUpdate.next(this.layoutConfig());
    }

    onMenuStateChange(event: MenuChangeEvent): void {
        this.menuSource.next(event);
    }

    reset(): void {
        this.resetSource.next(true);
    }

    private onTransitionEnd(): void {
        this.transitionComplete.set(true);
        setTimeout(() => {
            this.transitionComplete.set(false);
        });
    }

    private handleDarkModeTransition(config: LayoutConfig): void {
        const doc = document as Document & {
            startViewTransition?: (callback: () => void) => { ready: Promise<void> };
        };

        if (doc.startViewTransition()) {
            this.startViewTransition(config);
        } else {
            this.toggleDarkMode(config);
            this.onTransitionEnd();
        }
    }

    private startViewTransition(config: LayoutConfig): void {
        const doc = document as Document & {
            startViewTransition?: (callback: () => void) => { ready: Promise<void> };
        };

        const transition = doc.startViewTransition?.(() => {
            this.toggleDarkMode(config);
        });

        transition?.ready
            .then(() => this.onTransitionEnd())
            .catch(() => {
                // TODO error handling
            });
    }
}
