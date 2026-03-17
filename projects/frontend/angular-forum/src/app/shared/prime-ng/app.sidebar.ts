import { Component } from "@angular/core";

import { AppMenu } from "./app.menu";
import { MarketActivityWidget } from "./market-activity-widget/market-activity-widget";

@Component({
    selector: "app-sidebar",
    standalone: true,
    imports: [AppMenu, MarketActivityWidget],
    template: ` <div class="layout-sidebar">
        <app-menu></app-menu>
        <app-market-activity-widget></app-market-activity-widget>
    </div>`
})
export class AppSidebar {}
