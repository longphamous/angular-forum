import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LayoutService } from "../../prime-ng/service/layout.service";
import { NavigationBarComponent } from "./navigation-bar.component";

/**
 * NavigationBarComponent uses PrimeNG StyleClassModule which directly manipulates
 * the DOM and causes Karma/Chrome to disconnect when rendering is triggered.
 * We test the component class logic without triggering change detection.
 */
describe("NavigationBarComponent", () => {
    let component: NavigationBarComponent;
    let fixture: ComponentFixture<NavigationBarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NavigationBarComponent],
            providers: [LayoutService]
        }).compileComponents();

        fixture = TestBed.createComponent(NavigationBarComponent);
        component = fixture.componentInstance;
        // Intentionally NOT calling fixture.detectChanges() to avoid PrimeNG
        // StyleClassModule DOM manipulation that crashes headless Chrome.
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should toggle dark mode via LayoutService", () => {
        const layoutService = TestBed.inject(LayoutService);
        const initialDark = layoutService.layoutConfig().darkTheme;

        component.toggleDarkMode();

        expect(layoutService.layoutConfig().darkTheme).toBe(!initialDark);
    });
});
