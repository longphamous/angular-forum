import { ChangeDetectionStrategy, Component, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";

import { AuthFacade } from "../../../facade/auth/auth-facade";

/**
 * Admin quicklink button — renders a small settings icon-button
 * that navigates to the corresponding admin configuration page.
 *
 * Only visible to users with admin role.
 *
 * Usage:
 * ```html
 * <admin-quicklink route="/admin/lotto" />
 * ```
 */
@Component({
    selector: "admin-quicklink",
    standalone: true,
    imports: [ButtonModule, RouterModule, TooltipModule, TranslocoModule],
    template: `
        @if (authFacade.isAdmin()) {
        <a *transloco="let t" [routerLink]="route()" class="no-underline">
            <p-button
                [pTooltip]="t('common.adminSettings')"
                icon="pi pi-cog"
                [rounded]="true"
                [text]="true"
                severity="secondary"
                size="small"
                tooltipPosition="bottom"
            />
        </a>
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminQuicklink {
    readonly authFacade = inject(AuthFacade);
    readonly route = input.required<string>();
}
