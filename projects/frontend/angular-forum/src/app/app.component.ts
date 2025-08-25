import { CommonModule } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterOutlet } from "@angular/router";
import { RouterLink, RouterLinkActive } from "@angular/router";

import { AuthFacade } from "./facade/auth/auth-facade";

/**
 * Root application component with authentication state and user menu.
 */
@Component({
    selector: "app-root",
    standalone: true,
    imports: [CommonModule, RouterOutlet, ReactiveFormsModule, RouterLink, RouterLinkActive],
    templateUrl: "./app.component.html"
})
export class AppComponent {
    // computed signals can be public readonly
    readonly currentUser = computed(() => this.authFacade.currentUser());
    readonly isAuthenticated = computed(() => this.authFacade.isAuthenticated);

    // public reactive form (declared, initialized later)
    loginForm: FormGroup;

    loading = false;
    error: string | null = null;
    menuOpen = false;
    currentYear = new Date().getFullYear();

    // private injected dependencies first (member ordering)
    private readonly authFacade = inject(AuthFacade);
    private readonly formBuilder = inject(FormBuilder);

    constructor() {
        const fb = inject(FormBuilder);
        this.loginForm = fb.group({
            username: ["", [Validators.required]],
            password: ["", [Validators.required]]
        });
    }

    submitLogin(): void {
        if (this.loginForm.invalid) {
            return;
        }

        this.loading = true;
        this.error = null;

        const username = this.loginForm.get("username")?.value ?? "";
        const password = this.loginForm.get("password")?.value ?? "";

        this.authFacade.login(username, password).subscribe({
            next: () => {
                this.loading = false;
                this.loginForm.reset();
            },
            error: (err: unknown) => {
                this.loading = false;
                const message =
                    typeof err === "object" && err !== null && "error" in err
                        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (err as any).error?.message
                        : null;
                this.error = message ?? "Login failed. Please check your credentials.";
            }
        });
    }

    logout(): void {
        this.authFacade.logout();
        this.closeMenu();
    }

    toggleMenu(): void {
        this.menuOpen = !this.menuOpen;
    }

    closeMenu(): void {
        this.menuOpen = false;
    }
}
