import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslocoTestingModule } from "@jsverse/transloco";

import { API_CONFIG } from "../../../../core/config/api.config";
import { AnimeDatabase } from "./anime-database";

describe("AnimeDatabase", () => {
    let component: AnimeDatabase;
    let fixture: ComponentFixture<AnimeDatabase>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                AnimeDatabase,
                TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ["en"], defaultLang: "en" } })
            ],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: API_CONFIG, useValue: { baseUrl: "http://test" } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AnimeDatabase);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
