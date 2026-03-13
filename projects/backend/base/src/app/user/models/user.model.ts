import { UserRole, UserStatus } from "../entities/user.entity";

// User interface is now the UserEntity (TypeORM) – kept here for reference only
export type { UserRole, UserStatus };

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    role: UserRole;
    status: UserStatus;
    groups: string[];
    createdAt: string;
    lastLoginAt?: string;
}

export interface AuthSession {
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}
