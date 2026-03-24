import { FieldVisibility, ProfileFieldSettings, UserRole, UserStatus } from "../entities/user.entity";

export type { FieldVisibility, ProfileFieldSettings, UserRole, UserStatus };

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    avatarMediaId?: string;
    coverUrl?: string;
    coverMediaId?: string;
    bio?: string;
    birthday?: string;
    gender?: string;
    location?: string;
    website?: string;
    signature?: string;
    socialLinks?: Record<string, string>;
    profileFieldSettings?: ProfileFieldSettings;
    role: UserRole;
    status: UserStatus;
    groups: string[];
    postCount: number;
    level: number;
    levelName: string;
    xp: number;
    xpToNextLevel: number;
    xpProgressPercent: number;
    createdAt: string;
    lastLoginAt?: string;
}

export interface AuthSession {
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}
