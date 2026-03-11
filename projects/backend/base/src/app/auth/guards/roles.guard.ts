import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { UserRole } from "../../user/models/user.model";
import { ROLES_KEY } from "../auth.decorators";
import { AuthenticatedUser } from "../models/jwt.model";

/**
 * Checks whether the authenticated user has the required role(s).
 * Must be used in combination with JwtAuthGuard.
 *
 * Usage: @Roles('admin') or @Roles('admin', 'moderator')
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        if (!requiredRoles?.length) return true;

        const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
        if (!user) throw new ForbiddenException("No authenticated user found");

        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException(`Required role(s): ${requiredRoles.join(", ")}. Your role: ${user.role}`);
        }
        return true;
    }
}
