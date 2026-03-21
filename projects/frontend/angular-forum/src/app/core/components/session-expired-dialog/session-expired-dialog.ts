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
            [visible]="sessionService.sessionExpired()"
            [closable]="false"
            [modal]="true"
            [draggable]="false"
            [style]="{ width: '28rem' }"
            *transloco="let t"
        >
            <ng-template pTemplate="header">
                <div class="flex items-center gap-2">
                    <i class="pi pi-lock text-orange-500 text-xl"></i>
                    <span class="font-bold text-lg">{{ t('session.expiredTitle') }}</span>
                </div>
            </ng-template>

            <div class="flex flex-col items-center gap-4 py-4 text-center">
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <i class="pi pi-clock text-orange-500 text-3xl"></i>
                </div>
                <p class="text-color-secondary m-0 text-sm">
                    @if (sessionService.sessionExpiredReason() === 'inactivity') {
                        {{ t('session.inactivityMessage') }}
                    } @else {
                        {{ t('session.expiredMessage') }}
                    }
                </p>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-center w-full">
                    <p-button
                        [label]="t('session.loginAgain')"
                        icon="pi pi-sign-in"
                        (onClick)="sessionService.confirmLogout()"
                    />
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class SessionExpiredDialog {
    protected readonly sessionService = inject(SessionService);
}
