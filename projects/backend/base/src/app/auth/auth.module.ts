import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { JWT_EXPIRES_IN, JWT_SECRET } from "./auth.constants";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: JWT_EXPIRES_IN } })
    ],
    providers: [
        AuthService,
        JwtStrategy,
        // Both guards are registered globally – every route is protected by default.
        // Use @Public() to opt out of JWT validation.
        // Use @Roles('admin') etc. to restrict by role.
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard }
    ],
    exports: [AuthService, JwtModule]
})
export class AuthModule {}
