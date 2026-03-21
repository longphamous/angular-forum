import { vi } from "vitest";
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
        isAuthenticated: vi.fn().mockReturnValue(false),
        isAdmin: vi.fn().mockReturnValue(false),
        isModerator: vi.fn().mockReturnValue(false),
        currentUser: vi.fn().mockReturnValue(null)
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

        mockAuthFacade.isAuthenticated.mockReturnValue(false);
        mockAuthFacade.isAdmin.mockReturnValue(false);
        mockAuthFacade.isModerator.mockReturnValue(false);
        mockAuthFacade.currentUser.mockReturnValue(null);
    });

    it("should allow access when requiredGroups is empty", () => {
        expect(runGuard([])).toBe(true);
    });

    it("should allow access when 'Jeder' is in requiredGroups", () => {
        expect(runGuard(["Jeder"])).toBe(true);
    });

    it("should allow guest-only route when user is not authenticated", () => {
        mockAuthFacade.isAuthenticated.mockReturnValue(false);
        expect(runGuard(["Gast"])).toBe(true);
    });

    it("should redirect to /dashboard on guest-only route when user is authenticated", () => {
        mockAuthFacade.isAuthenticated.mockReturnValue(true);

        const result = runGuard(["Gast"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/dashboard");
    });

    it("should redirect to /login when not authenticated for registered-user route", () => {
        mockAuthFacade.isAuthenticated.mockReturnValue(false);

        const result = runGuard(["Registrierte Benutzer"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/login");
    });

    it("should allow access for 'Registrierte Benutzer' when authenticated", () => {
        mockAuthFacade.isAuthenticated.mockReturnValue(true);
        mockAuthFacade.currentUser.mockReturnValue({ id: "u1", groups: [] });

        expect(runGuard(["Registrierte Benutzer"])).toBe(true);
    });

    it("should allow Admin route when user is admin", () => {
        mockAuthFacade.isAuthenticated.mockReturnValue(true);
        mockAuthFacade.currentUser.mockReturnValue({ id: "u1", groups: [] });
        mockAuthFacade.isAdmin.mockReturnValue(true);

        expect(runGuard(["Admin"])).toBe(true);
    });

    it("should redirect to /dashboard on Admin route when user is not admin", () => {
        mockAuthFacade.isAuthenticated.mockReturnValue(true);
        mockAuthFacade.currentUser.mockReturnValue({ id: "u1", groups: [] });
        mockAuthFacade.isAdmin.mockReturnValue(false);

        const result = runGuard(["Admin"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/dashboard");
    });

    it("should allow Moderator route when user is moderator", () => {
        mockAuthFacade.isAuthenticated.mockReturnValue(true);
        mockAuthFacade.currentUser.mockReturnValue({ id: "u1", groups: [] });
        mockAuthFacade.isModerator.mockReturnValue(true);

        expect(runGuard(["Moderator"])).toBe(true);
    });

    it("should redirect to /dashboard on Moderator route when user is not moderator", () => {
        mockAuthFacade.isAuthenticated.mockReturnValue(true);
        mockAuthFacade.currentUser.mockReturnValue({ id: "u1", groups: [] });
        mockAuthFacade.isModerator.mockReturnValue(false);

        const result = runGuard(["Moderator"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/dashboard");
    });

    it("should allow access when user is in the required custom group", () => {
        mockAuthFacade.isAuthenticated.mockReturnValue(true);
        mockAuthFacade.currentUser.mockReturnValue({ id: "u1", groups: ["vip", "beta-testers"] });

        expect(runGuard(["vip"])).toBe(true);
    });

    it("should redirect to /dashboard when user is not in the required custom group", () => {
        mockAuthFacade.isAuthenticated.mockReturnValue(true);
        mockAuthFacade.currentUser.mockReturnValue({ id: "u1", groups: ["member"] });

        const result = runGuard(["vip"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/dashboard");
    });

    it("should redirect to /login when not authenticated for any restricted route", () => {
        mockAuthFacade.isAuthenticated.mockReturnValue(false);

        const result = runGuard(["some-group"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/login");
    });

    it("should redirect to /login when currentUser is null despite isAuthenticated being true", () => {
        mockAuthFacade.isAuthenticated.mockReturnValue(true);
        mockAuthFacade.currentUser.mockReturnValue(null);

        const result = runGuard(["some-group"]);

        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe("/login");
    });
});
