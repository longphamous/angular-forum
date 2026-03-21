import { UserRole } from "../user/user-role.type";

export interface JwtPayload {
    sub: string;
    username: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

export interface AuthenticatedUser {
    userId: string;
    username: string;
    role: UserRole;
}
