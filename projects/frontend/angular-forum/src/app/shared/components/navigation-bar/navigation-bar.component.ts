import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MenuItem } from "primeng/api";
import { StyleClassModule } from "primeng/styleclass";

import { AppConfigurator } from "../../prime-ng/app.configurator";
import { LayoutService } from "../../prime-ng/service/layout.service";

@Component({
    selector: "navigation-bar",
    standalone: true,
    imports: [CommonModule, StyleClassModule, AppConfigurator],
    templateUrl: "./navigation-bar.component.html",
    styleUrl: "./navigation-bar.component.scss"
})
export class NavigationBarComponent {
    items!: MenuItem[];

    layoutService = inject(LayoutService);

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }
}
