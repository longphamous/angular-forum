import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, provideRouter, Router } from "@angular/router";
import { TranslocoTestingModule } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";

import { API_CONFIG } from "../../../core/config/api.config";
import { LexiconArticlePage } from "./lexicon-article-page";

const BASE = "http://test-api";

describe("LexiconArticlePage", () => {
    let component: LexiconArticlePage;
    let fixture: ComponentFixture<LexiconArticlePage>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                LexiconArticlePage,
                TranslocoTestingModule.forRoot({
                    langs: { en: {}, de: {} },
                    translocoConfig: { defaultLang: "en", availableLangs: ["en", "de"] }
                })
            ],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                ConfirmationService,
                MessageService,
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: { get: () => "test-slug" } } }
                },
                { provide: API_CONFIG, useValue: { baseUrl: BASE } }
            ]
        }).compileComponents();

        httpMock = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(LexiconArticlePage);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it("should create the component", () => {
        expect(component).toBeTruthy();
    });

    // ─── Initial state ──────────────────────────────────────────────────────────

    describe("initial state", () => {
        it("should have loading as false before ngOnInit", () => {
            expect(component.facade.loading()).toBe(false);
        });

        it("should have currentArticle as null before ngOnInit", () => {
            expect(component.facade.currentArticle()).toBeNull();
        });
    });

    // ─── formatDate ─────────────────────────────────────────────────────────────

    describe("formatDate", () => {
        beforeEach(() => {
            // Flush the request triggered by ngOnInit
            fixture.detectChanges();
            httpMock.match(() => true);
        });

        it("should format a date string correctly in German locale", () => {
            const result = (component as unknown as { formatDate: (d: string | null) => string }).formatDate(
                "2026-01-15T00:00:00Z"
            );
            expect(result).toContain("15");
            expect(result).toContain("2026");
        });

        it("should return an empty string for null input", () => {
            const result = (component as unknown as { formatDate: (d: string | null) => string }).formatDate(null);
            expect(result).toBe("");
        });
    });

    // ─── relativeTime ───────────────────────────────────────────────────────────

    describe("relativeTime", () => {
        beforeEach(() => {
            fixture.detectChanges();
            httpMock.match(() => true);
        });

        it("should return minutes for recent timestamps", () => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
            const result = (component as unknown as { relativeTime: (d: string) => string }).relativeTime(
                fiveMinutesAgo
            );
            expect(result).toBe("5m");
        });

        it("should return hours for timestamps within the last day", () => {
            const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
            const result = (component as unknown as { relativeTime: (d: string) => string }).relativeTime(
                threeHoursAgo
            );
            expect(result).toBe("3h");
        });

        it("should return days for timestamps older than 24 hours", () => {
            const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
            const result = (component as unknown as { relativeTime: (d: string) => string }).relativeTime(twoDaysAgo);
            expect(result).toBe("2d");
        });
    });

    // ─── goBack ─────────────────────────────────────────────────────────────────

    describe("goBack", () => {
        beforeEach(() => {
            fixture.detectChanges();
            httpMock.match(() => true);
        });

        it("should navigate to /lexicon", () => {
            const router = TestBed.inject(Router);
            const navigateSpy = vi.spyOn(router, "navigate");

            (component as unknown as { goBack: () => void }).goBack();

            expect(navigateSpy).toHaveBeenCalledWith(["/lexicon"]);
        });
    });
});
