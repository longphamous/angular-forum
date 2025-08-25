import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
    selector: "lib-navbar",
    imports: [],
    templateUrl: "./navbar.component.html",
    styleUrl: "./navbar.component.css",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
    isLoggedIn = false; // Placeholder, will be updated with AuthService
    isAdmin = false; // Placeholder, based on user role

    login() {
        // Navigate to login route (to be implemented)
    }

    logout() {
        // Trigger logout via AuthService (to be implemented)
    }
}
