import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";

import { DashboardFacade } from "../../../facade/dashboard/dashboard-facade";
import { ActiveForumsWidget } from "./components/active-forums-widget";
import { DashboardStatsWidget } from "./components/dashboard-stats-widget";
import { NewestAnimeWidget } from "./components/newest-anime-widget";
import { RecentThreadsWidget } from "./components/recent-threads-widget";
import { TopPostersWidget } from "./components/top-posters-widget";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ActiveForumsWidget, DashboardStatsWidget, NewestAnimeWidget, RecentThreadsWidget, TopPostersWidget],
    selector: "app-dashboard",
    template: `
        <div class="grid grid-cols-12 gap-6">
            <app-dashboard-stats-widget class="contents" />
            <div class="col-span-12 xl:col-span-8">
                <app-recent-threads-widget />
            </div>
            <div class="col-span-12 xl:col-span-4">
                <app-top-posters-widget />
            </div>
            <div class="col-span-12 xl:col-span-7">
                <app-newest-anime-widget />
            </div>
            <div class="col-span-12 xl:col-span-5">
                <app-active-forums-widget />
            </div>
        </div>
    `
})
export class Dashboard implements OnInit {
    private readonly dashboardFacade = inject(DashboardFacade);

    ngOnInit(): void {
        this.dashboardFacade.loadAll();
    }
}
