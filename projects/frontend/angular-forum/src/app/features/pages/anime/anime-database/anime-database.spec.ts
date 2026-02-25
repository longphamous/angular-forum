import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AnimeDatabase } from "./anime-database";

describe("AnimeDatabase", () => {
    let component: AnimeDatabase;
    let fixture: ComponentFixture<AnimeDatabase>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AnimeDatabase]
        }).compileComponents();

        fixture = TestBed.createComponent(AnimeDatabase);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
