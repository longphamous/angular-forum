import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { UserRole } from "../user/models/user.model";
import { JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, JWT_SECRET } from "./auth.constants";
import { JwtPayload } from "./models/jwt.model";

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}

    /** Sign a new access + refresh token pair for the given user. */
    signTokens(userId: string, username: string, role: UserRole): TokenPair {
        const payload: JwtPayload = { sub: userId, username, role };
        const accessToken = this.jwtService.sign(payload, { expiresIn: JWT_EXPIRES_IN });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: JWT_REFRESH_EXPIRES_IN });
        return { accessToken, refreshToken, expiresIn: JWT_EXPIRES_IN };
    }

    /** Verify a refresh token and issue a new token pair. */
    refreshTokens(refreshToken: string): TokenPair {
        let payload: JwtPayload;
        try {
            payload = this.jwtService.verify<JwtPayload>(refreshToken, { secret: JWT_SECRET });
        } catch {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }
        return this.signTokens(payload.sub, payload.username, payload.role);
    }

    /** Decode without verifying – for logging/debugging only. */
    decodeToken(token: string): JwtPayload | null {
        return this.jwtService.decode<JwtPayload>(token);
    }
}
