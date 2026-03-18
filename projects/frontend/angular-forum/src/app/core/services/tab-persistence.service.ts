import { inject, Injectable } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

/**
 * Lightweight service to persist the active tab via URL query param `tab=...`.
 *
 * Usage in a component:
 * ```ts
 * readonly tabService = inject(TabPersistenceService);
 * readonly activeTab = signal(this.tabService.get('overview'));
 *
 * onTabChange(value: string): void {
 *     this.activeTab.set(value);
 *     this.tabService.set(value);
 * }
 * ```
 */
@Injectable({ providedIn: "root" })
export class TabPersistenceService {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    /** Read the current tab from `?tab=...`, falling back to the given default. */
    get(defaultTab: string): string {
        return this.route.snapshot.queryParamMap.get("tab") ?? defaultTab;
    }

    /** Write the active tab to the URL without triggering navigation. */
    set(tab: string): void {
        void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tab },
            queryParamsHandling: "merge",
            replaceUrl: true
        });
    }
}
