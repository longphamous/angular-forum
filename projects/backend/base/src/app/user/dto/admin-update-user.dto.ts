import { UserRole, UserStatus } from "../entities/user.entity";

export class AdminUpdateUserDto {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    birthday?: string;
    gender?: string;
    location?: string;
    website?: string;
    signature?: string;
    role?: UserRole;
    status?: UserStatus;
}
