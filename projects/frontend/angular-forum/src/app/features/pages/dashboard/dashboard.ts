import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";

import { StorefrontWidget } from "../../../core/components/storefront-widget/storefront-widget";
import { TeaserSlideshowComponent } from "../../../core/components/teaser-slideshow/teaser-slideshow";
import { DashboardFacade } from "../../../facade/dashboard/dashboard-facade";
import { ActiveForumsWidget } from "./components/active-forums-widget";
import { ActivityFeedWidget } from "./components/activity-feed-widget";
import { DashboardStatsWidget } from "./components/dashboard-stats-widget";
import { LatestThreadsSidebarWidget } from "./components/latest-threads-sidebar-widget";
import { NewestAnimeWidget } from "./components/newest-anime-widget";
import { NewestMembersWidget } from "./components/newest-members-widget";
import { OnlineUsersWidget } from "./components/online-users-widget";
import { RecentThreadsWidget } from "./components/recent-threads-widget";
import { TopPostersWidget } from "./components/top-posters-widget";
import { TopWealthWidget } from "./components/top-wealth-widget";
import { UpcomingEventsWidget } from "./components/upcoming-events-widget";
import { WeatherWidget } from "./components/weather-widget";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        StorefrontWidget,
        TeaserSlideshowComponent,
        ActiveForumsWidget,
        ActivityFeedWidget,
        DashboardStatsWidget,
        LatestThreadsSidebarWidget,
        NewestAnimeWidget,
        NewestMembersWidget,
        OnlineUsersWidget,
        RecentThreadsWidget,
        TopPostersWidget,
        TopWealthWidget,
        UpcomingEventsWidget,
        WeatherWidget
    ],
    selector: "app-dashboard",
    styles: `
        :host ::ng-deep .p-card {
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        :host ::ng-deep .p-card-body {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        :host ::ng-deep .p-card-content {
            flex: 1;
        }
    `,
    template: `
        <app-teaser-slideshow />
        <app-storefront-widget class="mt-6" />

        <div class="mt-6 grid grid-cols-12 gap-6">
            <!-- Main (8 cols on xl) -->
            <div class="col-span-12 flex flex-col gap-6 xl:col-span-8">
                <app-recent-threads-widget />
                <app-activity-feed-widget />
            </div>

            <!-- Sidebar (4 cols on xl) -->
            <div class="col-span-12 flex flex-col gap-4 xl:col-span-4">
                <app-dashboard-stats-widget />
                <app-newest-members-widget />
                <app-latest-threads-sidebar-widget />
                <app-online-users-widget />
            </div>
        </div>

        <!-- Secondary row -->
        <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <app-top-posters-widget />
            <app-top-wealth-widget />
            <app-newest-anime-widget />
            <app-active-forums-widget />
        </div>

        <!-- Weather & Events -->
        <div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <app-weather-widget />
            <app-upcoming-events-widget />
        </div>
    `
})
export class Dashboard implements OnInit {
    private readonly dashboardFacade = inject(DashboardFacade);

    ngOnInit(): void {
        this.dashboardFacade.loadAll();
    }
}
