import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { PasswordModule } from "primeng/password";

import { AuthFacade } from "../../../facade/auth/auth-facade";

@Component({
    selector: "login-page",
    imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule, RouterLink],
    templateUrl: "./login-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
    readonly loading = signal(false);
    readonly errorMessage = signal<string | null>(null);

    username = "";
    password = "";

    private readonly authFacade = inject(AuthFacade);
    private readonly router = inject(Router);

    onSubmit(): void {
        if (!this.username || !this.password) return;

        this.loading.set(true);
        this.errorMessage.set(null);

        this.authFacade.login(this.username, this.password).subscribe({
            next: () => {
                this.router.navigate(["/dashboard"]);
            },
            error: (err: { error?: { message?: string } }) => {
                this.errorMessage.set(err.error?.message ?? "Login fehlgeschlagen. Bitte versuche es erneut.");
                this.loading.set(false);
            }
        });
    }
}
