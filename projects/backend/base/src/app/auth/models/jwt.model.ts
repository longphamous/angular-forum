import { UserRole } from "../../user/models/user.model";

/** Shape of the JWT payload that gets signed into the token. */
export interface JwtPayload {
    sub: string; // userId
    username: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

/** Shape attached to request.user after the JWT guard validates a token. */
export interface AuthenticatedUser {
    userId: string;
    username: string;
    role: UserRole;
}
