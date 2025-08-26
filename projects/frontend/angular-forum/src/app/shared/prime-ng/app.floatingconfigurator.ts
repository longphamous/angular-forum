import { CommonModule } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { StyleClassModule } from "primeng/styleclass";

import { AppConfigurator } from "./app.configurator";
import { LayoutService } from "./service/layout.service";

@Component({
    selector: "app-floating-configurator",
    imports: [CommonModule, ButtonModule, StyleClassModule, AppConfigurator],
    template: `
        <div class="right-8 top-8 flex gap-4" [ngClass]="{ fixed: float() }">
            <p-button
                [icon]="isDarkTheme() ? 'pi pi-moon' : 'pi pi-sun'"
                [rounded]="true"
                (onClick)="toggleDarkMode()"
                severity="secondary"
                type="button"
            />
            <div class="relative">
                <p-button
                    [hideOnOutsideClick]="true"
                    enterActiveClass="animate-scalein"
                    enterFromClass="hidden"
                    icon="pi pi-palette"
                    leaveActiveClass="animate-fadeout"
                    leaveToClass="hidden"
                    pStyleClass="@next"
                    rounded
                    type="button"
                />
                <app-configurator />
            </div>
        </div>
    `
})
export class AppFloatingConfigurator {
    LayoutService = inject(LayoutService);

    float = input<boolean>(true);

    isDarkTheme = computed(() => this.LayoutService.layoutConfig().darkTheme);

    toggleDarkMode() {
        this.LayoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }
}
