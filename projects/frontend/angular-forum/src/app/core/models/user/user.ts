export type UserRole = "admin" | "moderator" | "member" | "guest";
export type UserStatus = "active" | "inactive" | "banned" | "pending";
export type FieldVisibility = "everyone" | "members" | "nobody";

export interface ProfileFieldSettings {
    gender?: FieldVisibility;
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    coverUrl?: string;
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

export interface LoginResponse {
    session: AuthSession;
    profile: UserProfile;
}
