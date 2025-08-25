import { Component } from "@angular/core";

import { SectionCardComponent } from "../../shared/components/section-card/section-card.component";

@Component({
    selector: "dashboard",
    imports: [SectionCardComponent],
    templateUrl: "./dashboard.component.html",
    styleUrl: "./dashboard.component.scss"
})
export class DashboardComponent {}
