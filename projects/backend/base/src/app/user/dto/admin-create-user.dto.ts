import { UserRole, UserStatus } from "../entities/user.entity";

export class AdminCreateUserDto {
    username!: string;
    email!: string;
    password!: string;
    displayName?: string;
    role?: UserRole;
    status?: UserStatus;
}
