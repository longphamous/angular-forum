import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AnimeTopList } from "./anime-top-list";

describe("AnimeTopList", () => {
    let component: AnimeTopList;
    let fixture: ComponentFixture<AnimeTopList>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AnimeTopList]
        }).compileComponents();

        fixture = TestBed.createComponent(AnimeTopList);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
