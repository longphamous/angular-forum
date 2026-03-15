import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { API_CONFIG } from "../../core/config/api.config";
import { AuthFacade } from "./auth-facade";

const BASE = "http://test-api";

const mockProfile = {
    id: "user-1",
    username: "alice",
    email: "alice@example.com",
    displayName: "Alice",
    role: "member" as const,
    status: "active" as const,
    groups: ["group-a"],
    postCount: 10,
    level: 2,
    levelName: "Novice",
    xp: 150,
    xpToNextLevel: 100,
    xpProgressPercent: 60,
    createdAt: "2024-01-01T00:00:00Z"
};

const mockSession = {
    userId: "user-1",
    accessToken: "access-abc",
    refreshToken: "refresh-xyz",
    expiresIn: "24h"
};

describe("AuthFacade", () => {
    let facade: AuthFacade;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        localStorage.clear();

        TestBed.configureTestingModule({
            providers: [
                AuthFacade,
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: API_CONFIG, useValue: { baseUrl: BASE } }
            ]
        });

        facade = TestBed.inject(AuthFacade);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it("should be created", () => {
        expect(facade).toBeTruthy();
    });

    // ─── Initial state ─────────────────────────────────────────────────────────

    describe("initial state", () => {
        it("should be unauthenticated with no user", () => {
            expect(facade.isAuthenticated()).toBeFalse();
            expect(facade.currentUser()).toBeNull();
            expect(facade.accessToken).toBeNull();
        });

        it("should not be admin or moderator when unauthenticated", () => {
            expect(facade.isAdmin()).toBeFalse();
            expect(facade.isModerator()).toBeFalse();
        });
    });

    // ─── Restore from storage ──────────────────────────────────────────────────

    describe("_restoreFromStorage", () => {
        it("should restore session from localStorage on construction", () => {
            localStorage.setItem("aniverse_access_token", "stored-token");
            localStorage.setItem("aniverse_user_profile", JSON.stringify(mockProfile));

            // Re-create the facade to trigger _restoreFromStorage
            const restoredFacade = TestBed.runInInjectionContext(() => new AuthFacade());

            expect(restoredFacade.isAuthenticated()).toBeTrue();
            expect(restoredFacade.currentUser()?.username).toBe("alice");
            expect(restoredFacade.accessToken).toBe("stored-token");
        });

        it("should remain unauthenticated when storage is empty", () => {
            expect(facade.isAuthenticated()).toBeFalse();
        });

        it("should clear storage and remain unauthenticated on corrupt profile JSON", () => {
            localStorage.setItem("aniverse_access_token", "token");
            localStorage.setItem("aniverse_user_profile", "{corrupt json");

            TestBed.runInInjectionContext(() => new AuthFacade());

            expect(localStorage.getItem("aniverse_access_token")).toBeNull();
        });
    });

    // ─── Login ─────────────────────────────────────────────────────────────────

    describe("login", () => {
        it("should set isAuthenticated and currentUser on successful login", () => {
            let completed = false;

            facade.login("alice", "secret").subscribe(() => {
                completed = true;
            });

            const req = httpMock.expectOne(`${BASE}/user/login`);
            expect(req.request.method).toBe("POST");
            expect(req.request.body).toEqual({ username: "alice", password: "secret" });

            req.flush({ session: mockSession, profile: mockProfile });

            expect(completed).toBeTrue();

            expect(facade.isAuthenticated()).toBeTrue();
            expect(facade.currentUser()?.username).toBe("alice");
            expect(facade.accessToken).toBe("access-abc");
        });

        it("should persist tokens and profile to localStorage after login", () => {
            facade.login("alice", "secret").subscribe();

            const req = httpMock.expectOne(`${BASE}/user/login`);
            req.flush({ session: mockSession, profile: mockProfile });

            expect(localStorage.getItem("aniverse_access_token")).toBe("access-abc");
            expect(localStorage.getItem("aniverse_refresh_token")).toBe("refresh-xyz");
            expect(JSON.parse(localStorage.getItem("aniverse_user_profile")!).username).toBe("alice");
        });
    });

    // ─── Logout ────────────────────────────────────────────────────────────────

    describe("logout", () => {
        it("should clear signals and localStorage on logout", () => {
            localStorage.setItem("aniverse_access_token", "access-abc");
            localStorage.setItem("aniverse_refresh_token", "refresh-xyz");
            localStorage.setItem("aniverse_user_profile", JSON.stringify(mockProfile));

            // Simulate logged-in state
            facade.login("alice", "secret").subscribe();
            httpMock.expectOne(`${BASE}/user/login`).flush({ session: mockSession, profile: mockProfile });

            facade.logout();

            expect(facade.isAuthenticated()).toBeFalse();
            expect(facade.currentUser()).toBeNull();
            expect(facade.accessToken).toBeNull();
            expect(localStorage.getItem("aniverse_access_token")).toBeNull();
            expect(localStorage.getItem("aniverse_refresh_token")).toBeNull();
            expect(localStorage.getItem("aniverse_user_profile")).toBeNull();
        });
    });

    // ─── Role computed signals ─────────────────────────────────────────────────

    describe("role signals", () => {
        function loginAs(role: "admin" | "moderator" | "member"): void {
            const profile = { ...mockProfile, role };
            facade.login("alice", "secret").subscribe();
            httpMock.expectOne(`${BASE}/user/login`).flush({
                session: mockSession,
                profile
            });
        }

        it("should be admin and moderator for admin role", () => {
            loginAs("admin");
            expect(facade.isAdmin()).toBeTrue();
            expect(facade.isModerator()).toBeTrue();
        });

        it("should be moderator but not admin for moderator role", () => {
            loginAs("moderator");
            expect(facade.isAdmin()).toBeFalse();
            expect(facade.isModerator()).toBeTrue();
        });

        it("should be neither admin nor moderator for member role", () => {
            loginAs("member");
            expect(facade.isAdmin()).toBeFalse();
            expect(facade.isModerator()).toBeFalse();
        });
    });

    // ─── Refresh token ─────────────────────────────────────────────────────────

    describe("refreshToken", () => {
        it("should update access token in signal and storage on success", () => {
            localStorage.setItem("aniverse_refresh_token", "old-refresh");

            facade.refreshToken().subscribe();

            const req = httpMock.expectOne(`${BASE}/user/refresh`);
            req.flush({ ...mockSession, accessToken: "new-access", refreshToken: "new-refresh" });

            expect(facade.accessToken).toBe("new-access");
            expect(localStorage.getItem("aniverse_access_token")).toBe("new-access");
        });
    });

    // ─── Register ──────────────────────────────────────────────────────────────

    describe("register", () => {
        it("should POST to the register endpoint and return the created profile", () => {
            let result: unknown;

            facade.register({ username: "bob", email: "bob@example.com", password: "pass123" }).subscribe((p) => {
                result = p;
            });

            const req = httpMock.expectOne(`${BASE}/user/register`);
            expect(req.request.method).toBe("POST");
            req.flush(mockProfile);

            expect(result).toEqual(mockProfile);
        });
    });
});
