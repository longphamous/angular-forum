import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";

import { DashboardFacade } from "../../../facade/dashboard/dashboard-facade";
import { TeaserSlideshowComponent } from "../../../core/components/teaser-slideshow/teaser-slideshow";
import { ActiveForumsWidget } from "./components/active-forums-widget";
import { DashboardStatsWidget } from "./components/dashboard-stats-widget";
import { NewestAnimeWidget } from "./components/newest-anime-widget";
import { RecentThreadsWidget } from "./components/recent-threads-widget";
import { TopPostersWidget } from "./components/top-posters-widget";
import { TopWealthWidget } from "./components/top-wealth-widget";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TeaserSlideshowComponent, ActiveForumsWidget, DashboardStatsWidget, NewestAnimeWidget, RecentThreadsWidget, TopPostersWidget, TopWealthWidget],
    selector: "app-dashboard",
    template: `
        <div class="grid grid-cols-12 gap-6">
            <div class="col-span-12">
                <app-teaser-slideshow />
            </div>
            <app-dashboard-stats-widget class="contents" />
            <div class="col-span-12 xl:col-span-8">
                <app-recent-threads-widget />
            </div>
            <div class="col-span-12 xl:col-span-4 flex flex-col gap-6">
                <app-top-posters-widget />
                <app-top-wealth-widget />
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
