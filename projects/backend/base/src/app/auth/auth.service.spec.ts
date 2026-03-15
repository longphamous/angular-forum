import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";

import { AuthService } from "./auth.service";
import { JWT_EXPIRES_IN, JWT_SECRET } from "./auth.constants";

const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn()
};

describe("AuthService", () => {
    let service: AuthService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: JwtService, useValue: mockJwtService }
            ]
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("signTokens", () => {
        it("should sign and return an access and refresh token pair", () => {
            mockJwtService.sign
                .mockReturnValueOnce("access-token-123")
                .mockReturnValueOnce("refresh-token-456");

            const result = service.signTokens("user-1", "testuser", "member");

            expect(result.accessToken).toBe("access-token-123");
            expect(result.refreshToken).toBe("refresh-token-456");
            expect(result.expiresIn).toBe(JWT_EXPIRES_IN);
            expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
        });

        it("should include sub, username, and role in the payload", () => {
            mockJwtService.sign.mockReturnValue("any-token");

            service.signTokens("user-42", "alice", "admin");

            const firstCall = mockJwtService.sign.mock.calls[0];
            expect(firstCall[0]).toEqual({ sub: "user-42", username: "alice", role: "admin" });
        });
    });

    describe("refreshTokens", () => {
        it("should verify the refresh token and issue a new token pair", () => {
            const payload = { sub: "user-1", username: "testuser", role: "member" as const };
            mockJwtService.verify.mockReturnValue(payload);
            mockJwtService.sign.mockReturnValueOnce("new-access").mockReturnValueOnce("new-refresh");

            const result = service.refreshTokens("valid-refresh-token");

            expect(mockJwtService.verify).toHaveBeenCalledWith("valid-refresh-token", { secret: JWT_SECRET });
            expect(result.accessToken).toBe("new-access");
            expect(result.refreshToken).toBe("new-refresh");
        });

        it("should throw UnauthorizedException for an invalid refresh token", () => {
            mockJwtService.verify.mockImplementation(() => {
                throw new Error("jwt expired");
            });

            expect(() => service.refreshTokens("expired-token")).toThrow(UnauthorizedException);
            expect(() => service.refreshTokens("expired-token")).toThrow("Invalid or expired refresh token");
        });

        it("should throw UnauthorizedException for a malformed token", () => {
            mockJwtService.verify.mockImplementation(() => {
                throw new Error("invalid token");
            });

            expect(() => service.refreshTokens("bad-token")).toThrow(UnauthorizedException);
        });
    });

    describe("decodeToken", () => {
        it("should return the decoded payload without verifying", () => {
            const decoded = { sub: "user-1", username: "alice", role: "admin" };
            mockJwtService.decode.mockReturnValue(decoded);

            const result = service.decodeToken("some-token");

            expect(result).toEqual(decoded);
            expect(mockJwtService.decode).toHaveBeenCalledWith("some-token");
        });

        it("should return null for an invalid token", () => {
            mockJwtService.decode.mockReturnValue(null);

            const result = service.decodeToken("invalid-token");

            expect(result).toBeNull();
        });
    });
});
