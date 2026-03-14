import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { PasswordModule } from "primeng/password";

import { AuthFacade } from "../../../facade/auth/auth-facade";

@Component({
    selector: "register-page",
    imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule, RouterLink, TranslocoModule],
    templateUrl: "./register-page.html",
    styleUrl: "./register-page.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterPage {
    readonly loading = signal(false);
    readonly errorMessage = signal<string | null>(null);

    username = "";
    email = "";
    password = "";
    displayName = "";

    private readonly authFacade = inject(AuthFacade);
    private readonly router = inject(Router);
    private readonly translocoService = inject(TranslocoService);

    onSubmit(): void {
        if (!this.username || !this.email || !this.password) return;

        this.loading.set(true);
        this.errorMessage.set(null);

        this.authFacade
            .register({
                username: this.username,
                email: this.email,
                password: this.password,
                displayName: this.displayName || undefined
            })
            .subscribe({
                next: () => {
                    this.router.navigate(["/login"]);
                },
                error: (err: { error?: { message?: string } }) => {
                    this.errorMessage.set(
                        err.error?.message ?? this.translocoService.translate("register.error")
                    );
                    this.loading.set(false);
                }
            });
    }
}
