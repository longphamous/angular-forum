import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { provideRouter } from "@angular/router";
import { vi } from "vitest";

import { AuthFacade } from "../../facade/auth/auth-facade";
import { adminGuard, authGuard } from "./auth.guard";

describe("authGuard", () => {
    let router: Router;

    const mockAuthFacade = {
        isAuthenticated: vi.fn(),
        isAdmin: vi.fn()
    };

    function runGuard(guard: typeof authGuard): boolean | UrlTree {
        return TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)) as
            | boolean
            | UrlTree;
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideRouter([]), { provide: AuthFacade, useValue: mockAuthFacade }]
        });

        router = TestBed.inject(Router);
    });

    afterEach(() => {
        mockAuthFacade.isAuthenticated.mockReset();
        mockAuthFacade.isAdmin.mockReset();
    });

    describe("authGuard", () => {
        it("should return true when user is authenticated", () => {
            mockAuthFacade.isAuthenticated.mockReturnValue(true);

            const result = runGuard(authGuard);

            expect(result).toBe(true);
        });

        it("should return a UrlTree to /login when user is not authenticated", () => {
            mockAuthFacade.isAuthenticated.mockReturnValue(false);

            const result = runGuard(authGuard);

            expect(result).toBeInstanceOf(UrlTree);
            expect(router.serializeUrl(result as UrlTree)).toBe("/login");
        });
    });

    describe("adminGuard", () => {
        it("should return true when user is admin", () => {
            mockAuthFacade.isAdmin.mockReturnValue(true);

            const result = runGuard(adminGuard);

            expect(result).toBe(true);
        });

        it("should return a UrlTree to /dashboard when user is not admin", () => {
            mockAuthFacade.isAdmin.mockReturnValue(false);

            const result = runGuard(adminGuard);

            expect(result).toBeInstanceOf(UrlTree);
            expect(router.serializeUrl(result as UrlTree)).toBe("/dashboard");
        });
    });
});
