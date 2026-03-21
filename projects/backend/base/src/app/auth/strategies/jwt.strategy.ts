import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { JWT_SECRET } from "../auth.constants";
import { AuthenticatedUser, JwtPayload } from "../models/jwt.model";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("JWT_SECRET") ?? JWT_SECRET
        });
    }

    validate(payload: JwtPayload): AuthenticatedUser {
        return { userId: payload.sub, username: payload.username, role: payload.role };
    }
}
