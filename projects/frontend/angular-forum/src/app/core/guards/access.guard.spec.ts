import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { provideRouter } from "@angular/router";

import { AuthFacade } from "../../facade/auth/auth-facade";
import { accessGuard } from "./access.guard";

function makeRoute(requiredGroups: string[]): ActivatedRouteSnapshot {
    const snapshot = new ActivatedRouteSnapshot();
    (snapshot as { data: unknown }).data = { requiredGroups };
    return snapshot;
}

describe("accessGuard", () => {
    let router: Router;

    const mockAuthFacade = {
        isAuthenticated: jasmine.createSpy("isAuthenticated").and.returnValue(false),
        isAdmin: jasmine.createSpy("isAdmin").and.returnValue(false),
        isModerator: jasmine.createSpy("isModerator").and.returnValue(false),
        currentUser: jasmine.createSpy("currentUser").and.returnValue(null)
    };

    function runGuard(requiredGroups: string[]): boolean | UrlTree {
        return TestBed.runInInjectionContext(() =>
            accessGuard(makeRoute(requiredGroups), {} as RouterStateSnapshot)
        ) as boolean | UrlTree;
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideRouter([]), { provide: AuthFacade, useValue: mockAuthFacade }]
        });

        router = TestBed.inject(Router);

        mockAuthFacade.isAuthenticated.and.returnValue(false);
        mockAuthFacade.isAdmin.and.returnValue(false);
        mockAuthFacade.isModerator.and.returnValue(false);
        mockAuthFacade.currentUser.and.returnValue(null);
    });

    it("should allow access when requiredGroups is empty", () => {
        expect(runGuard([])).toBeTrue();
    });

    it("should allow access when 'Jeder' is in requiredGroups", () => {
        expect(runGuard(["Jeder"])).toBeTrue();
    });

    it("should allow guest-only route when user is not authenticated", () => {
        mockAuthFacade.isAuthenticated.and.returnValue(false);
        expect(runGuard(["Gast"])).toBeTrue();
    });

    it("should redirect to /dashboard on guest-only route when user is authenticated", () => {
        mockAuthFacade.isAuthenticated.and.returnValue(true);

        const result = runGuard(["Gast"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/dashboard");
    });

    it("should redirect to /login when not authenticated for registered-user route", () => {
        mockAuthFacade.isAuthenticated.and.returnValue(false);

        const result = runGuard(["Registrierte Benutzer"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/login");
    });

    it("should allow access for 'Registrierte Benutzer' when authenticated", () => {
        mockAuthFacade.isAuthenticated.and.returnValue(true);
        mockAuthFacade.currentUser.and.returnValue({ id: "u1", groups: [] });

        expect(runGuard(["Registrierte Benutzer"])).toBeTrue();
    });

    it("should allow Admin route when user is admin", () => {
        mockAuthFacade.isAuthenticated.and.returnValue(true);
        mockAuthFacade.currentUser.and.returnValue({ id: "u1", groups: [] });
        mockAuthFacade.isAdmin.and.returnValue(true);

        expect(runGuard(["Admin"])).toBeTrue();
    });

    it("should redirect to /dashboard on Admin route when user is not admin", () => {
        mockAuthFacade.isAuthenticated.and.returnValue(true);
        mockAuthFacade.currentUser.and.returnValue({ id: "u1", groups: [] });
        mockAuthFacade.isAdmin.and.returnValue(false);

        const result = runGuard(["Admin"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/dashboard");
    });

    it("should allow Moderator route when user is moderator", () => {
        mockAuthFacade.isAuthenticated.and.returnValue(true);
        mockAuthFacade.currentUser.and.returnValue({ id: "u1", groups: [] });
        mockAuthFacade.isModerator.and.returnValue(true);

        expect(runGuard(["Moderator"])).toBeTrue();
    });

    it("should redirect to /dashboard on Moderator route when user is not moderator", () => {
        mockAuthFacade.isAuthenticated.and.returnValue(true);
        mockAuthFacade.currentUser.and.returnValue({ id: "u1", groups: [] });
        mockAuthFacade.isModerator.and.returnValue(false);

        const result = runGuard(["Moderator"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/dashboard");
    });

    it("should allow access when user is in the required custom group", () => {
        mockAuthFacade.isAuthenticated.and.returnValue(true);
        mockAuthFacade.currentUser.and.returnValue({ id: "u1", groups: ["vip", "beta-testers"] });

        expect(runGuard(["vip"])).toBeTrue();
    });

    it("should redirect to /dashboard when user is not in the required custom group", () => {
        mockAuthFacade.isAuthenticated.and.returnValue(true);
        mockAuthFacade.currentUser.and.returnValue({ id: "u1", groups: ["member"] });

        const result = runGuard(["vip"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/dashboard");
    });

    it("should redirect to /login when not authenticated for any restricted route", () => {
        mockAuthFacade.isAuthenticated.and.returnValue(false);

        const result = runGuard(["some-group"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/login");
    });

    it("should redirect to /login when currentUser is null despite isAuthenticated being true", () => {
        mockAuthFacade.isAuthenticated.and.returnValue(true);
        mockAuthFacade.currentUser.and.returnValue(null);

        const result = runGuard(["some-group"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/login");
    });
});
