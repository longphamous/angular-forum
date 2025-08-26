import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";

/**
 * Root application component with authentication state and user menu.
 */
@Component({
    selector: "app-root",
    standalone: true,
    imports: [RouterModule],
    templateUrl: "./app.component.html"
})
export class AppComponent {}
