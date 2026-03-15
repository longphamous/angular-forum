import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslocoTestingModule } from "@jsverse/transloco";

import { API_CONFIG } from "../../../../core/config/api.config";
import { ThreadCreate } from "./thread-create";

describe("ThreadCreate", () => {
    let component: ThreadCreate;
    let fixture: ComponentFixture<ThreadCreate>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ThreadCreate,
                TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ["en"], defaultLang: "en" } })
            ],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: API_CONFIG, useValue: { baseUrl: "http://test" } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ThreadCreate);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
