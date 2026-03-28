import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { PasswordModule } from "primeng/password";

import { AuthFacade } from "../../../facade/auth/auth-facade";

@Component({
    selector: "login-page",
    imports: [
        FormsModule,
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PasswordModule,
        MessageModule,
        RouterLink,
        TranslocoModule
    ],
    templateUrl: "./login-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
    readonly loading = signal(false);
    readonly errorMessage = signal<string | null>(null);

    username = "";
    password = "";
    rememberMe = false;

    private readonly authFacade = inject(AuthFacade);
    private readonly router = inject(Router);
    private readonly translocoService = inject(TranslocoService);

    onSubmit(): void {
        if (!this.username || !this.password) return;

        this.loading.set(true);
        this.errorMessage.set(null);

        this.authFacade.login(this.username, this.password, this.rememberMe).subscribe({
            next: () => {
                this.router.navigate(["/dashboard"]);
            },
            error: (err: { error?: { message?: string } }) => {
                this.errorMessage.set(err.error?.message ?? this.translocoService.translate("login.error"));
                this.loading.set(false);
            }
        });
    }
}
