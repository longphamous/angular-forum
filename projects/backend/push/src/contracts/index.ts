export type UserRole = "admin" | "moderator" | "member" | "guest";

export const JWT_SECRET = process.env["JWT_SECRET"] ?? "";

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

// Re-export push event types
export * from "./push-event.types";
