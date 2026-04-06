import { ChangeDetectionStrategy, Component, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";

import { AuthFacade } from "../../../facade/auth/auth-facade";

@Component({
    selector: "admin-quicklink",
    standalone: true,
    imports: [ButtonModule, RouterModule, TooltipModule],
    template: `
        @if (authFacade.isAdmin()) {
            <a class="no-underline" [routerLink]="route()">
                <p-button
                    [rounded]="true"
                    [text]="true"
                    icon="pi pi-cog"
                    pTooltip="Admin"
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
