import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ThreadCreate } from "./thread-create";

describe("ThreadCreate", () => {
    let component: ThreadCreate;
    let fixture: ComponentFixture<ThreadCreate>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ThreadCreate]
        }).compileComponents();

        fixture = TestBed.createComponent(ThreadCreate);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
