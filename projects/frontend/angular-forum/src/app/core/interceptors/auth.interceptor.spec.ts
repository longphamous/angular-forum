import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { AuthFacade } from "../../facade/auth/auth-facade";
import { authInterceptor } from "./auth.interceptor";

describe("authInterceptor", () => {
    let httpMock: HttpTestingController;
    let httpClient: HttpClient;

    const mockAuthFacade = {
        accessToken: null as string | null
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthFacade, useValue: mockAuthFacade }
            ]
        });

        httpMock = TestBed.inject(HttpTestingController);
        httpClient = TestBed.inject(HttpClient);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it("should add Authorization header when access token is present", () => {
        mockAuthFacade.accessToken = "test-token-abc";

        httpClient.get("/api/test").subscribe();

        const req = httpMock.expectOne("/api/test");
        expect(req.request.headers.get("Authorization")).toBe("Bearer test-token-abc");
        req.flush({});
    });

    it("should not add Authorization header when access token is null", () => {
        mockAuthFacade.accessToken = null;

        httpClient.get("/api/test").subscribe();

        const req = httpMock.expectOne("/api/test");
        expect(req.request.headers.has("Authorization")).toBe(false);
        req.flush({});
    });

    it("should not modify the original request body", () => {
        mockAuthFacade.accessToken = "token";

        const body = { username: "alice" };
        httpClient.post("/api/login", body).subscribe();

        const req = httpMock.expectOne("/api/login");
        expect(req.request.body).toEqual(body);
        req.flush({});
    });

    it("should forward the request to the next handler", () => {
        mockAuthFacade.accessToken = null;
        let responseReceived = false;

        httpClient.get<{ ok: boolean }>("/api/data").subscribe((res) => {
            responseReceived = res.ok;
        });

        const req = httpMock.expectOne("/api/data");
        req.flush({ ok: true });

        expect(responseReceived).toBe(true);
    });
});
