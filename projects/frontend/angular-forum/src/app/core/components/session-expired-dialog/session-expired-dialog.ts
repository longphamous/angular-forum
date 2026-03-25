import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";

import { SessionService } from "../../services/session.service";

@Component({
    selector: "app-session-expired-dialog",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonModule, DialogModule, TranslocoModule],
    template: `
        <p-dialog
            *transloco="let t"
            [closable]="false"
            [draggable]="false"
            [modal]="true"
            [style]="{ width: '28rem' }"
            [visible]="sessionService.sessionExpired()"
        >
            <ng-template pTemplate="header">
                <div class="flex items-center gap-2">
                    <i class="pi pi-lock text-xl text-orange-500"></i>
                    <span class="text-lg font-bold">{{ t("session.expiredTitle") }}</span>
                </div>
            </ng-template>

            <div class="flex flex-col items-center gap-4 py-4 text-center">
                <div
                    class="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30"
                >
                    <i class="pi pi-clock text-3xl text-orange-500"></i>
                </div>
                <p class="text-color-secondary m-0 text-sm">
                    @if (sessionService.sessionExpiredReason() === "inactivity") {
                        {{ t("session.inactivityMessage") }}
                    } @else {
                        {{ t("session.expiredMessage") }}
                    }
                </p>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex w-full justify-center">
                    <p-button
                        [label]="t('session.loginAgain')"
                        (onClick)="sessionService.confirmLogout()"
                        icon="pi pi-sign-in"
                    />
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class SessionExpiredDialog {
    protected readonly sessionService = inject(SessionService);
}
