import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";

import { TeaserSlideshowComponent } from "../../../core/components/teaser-slideshow/teaser-slideshow";
import { DashboardFacade } from "../../../facade/dashboard/dashboard-facade";
import { ActiveForumsWidget } from "./components/active-forums-widget";
import { ActivityFeedWidget } from "./components/activity-feed-widget";
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
        ActivityFeedWidget,
        DashboardStatsWidget,
        NewestAnimeWidget,
        OnlineUsersWidget,
        RecentThreadsWidget,
        TopPostersWidget,
        TopWealthWidget,
        UpcomingEventsWidget
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
        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
                <app-teaser-slideshow />
            </div>

            <app-dashboard-stats-widget class="contents" />

            <!-- Activity Feed (full width, scrollable) -->
            <div class="col-span-12">
                <app-activity-feed-widget />
            </div>

            <!-- Row 2: Rankings + Content -->
            <div class="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <app-top-posters-widget />
                <app-top-wealth-widget />
                <app-newest-anime-widget class="sm:col-span-1 xl:col-span-1" />
                <app-active-forums-widget class="sm:col-span-1 xl:col-span-1" />
            </div>

            <!-- Row 3: Threads + Sidebar -->
            <div class="col-span-12 xl:col-span-8">
                <app-recent-threads-widget />
            </div>
            <div class="col-span-12 flex flex-col gap-4 xl:col-span-4">
                <app-upcoming-events-widget class="flex-1" />
                <app-online-users-widget />
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
