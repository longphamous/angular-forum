import { UserRole, UserStatus } from "../entities/user.entity";

export class AdminUpdateUserDto {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    role?: UserRole;
    status?: UserStatus;
}
