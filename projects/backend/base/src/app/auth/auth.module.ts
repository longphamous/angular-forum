import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { JWT_EXPIRES_IN, JWT_SECRET } from "./auth.constants";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>("JWT_SECRET") ?? JWT_SECRET,
                signOptions: { expiresIn: JWT_EXPIRES_IN }
            })
        }),
        // Rate limiting: 60 requests per 60 seconds per IP by default
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])
    ],
    providers: [
        AuthService,
        JwtStrategy,
        // Guards registered globally (order matters):
        // 1. Rate limiter — blocks excessive requests first
        // 2. JWT auth — validates token
        // 3. Roles — checks authorization
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard }
    ],
    exports: [AuthService, JwtModule]
})
export class AuthModule {}
