import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { AuthenticatedUser } from "./models/jwt.model";

/**
 * Parameter decorator – extracts the authenticated user from the request.
 *
 * Usage:  @CurrentUser() user: AuthenticatedUser
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return request.user;
});
