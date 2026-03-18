import { Component, inject } from "@angular/core";
import { RouterModule } from "@angular/router";

import { NavigationHistoryService } from "./core/services/navigation-history.service";

/**
 * Root application component with authentication state and user menu.
 */
@Component({
    selector: "app-root",
    standalone: true,
    imports: [RouterModule],
    templateUrl: "./app.component.html"
})
export class AppComponent {
    // Eagerly instantiate so navigation history is tracked from the first route
    readonly navHistory = inject(NavigationHistoryService);
}
