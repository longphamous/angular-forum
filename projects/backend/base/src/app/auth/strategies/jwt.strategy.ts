import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { JWT_SECRET } from "../auth.constants";
import { AuthenticatedUser, JwtPayload } from "../models/jwt.model";

/**
 * Validates incoming Bearer JWT tokens.
 * The decoded payload is attached to request.user as AuthenticatedUser.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: JWT_SECRET
        });
    }

    validate(payload: JwtPayload): AuthenticatedUser {
        return { userId: payload.sub, username: payload.username, role: payload.role };
    }
}
