import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";

import { TeaserSlideshowComponent } from "../../../core/components/teaser-slideshow/teaser-slideshow";
import { DashboardFacade } from "../../../facade/dashboard/dashboard-facade";
import { ActiveForumsWidget } from "./components/active-forums-widget";
import { DashboardStatsWidget } from "./components/dashboard-stats-widget";
import { NewestAnimeWidget } from "./components/newest-anime-widget";
import { OnlineUsersWidget } from "./components/online-users-widget";
import { RecentThreadsWidget } from "./components/recent-threads-widget";
import { TopPostersWidget } from "./components/top-posters-widget";
import { TopWealthWidget } from "./components/top-wealth-widget";
import { UpcomingEventsWidget } from "./components/upcoming-events-widget";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TeaserSlideshowComponent,
        ActiveForumsWidget,
        DashboardStatsWidget,
        NewestAnimeWidget,
        OnlineUsersWidget,
        RecentThreadsWidget,
        TopPostersWidget,
        TopWealthWidget,
        UpcomingEventsWidget
    ],
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
            <div class="col-span-12 flex flex-col gap-6 xl:col-span-4">
                <app-upcoming-events-widget />
                <app-top-posters-widget />
                <app-top-wealth-widget />
                <app-online-users-widget />
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
