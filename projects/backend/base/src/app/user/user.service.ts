import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AuthService } from "../auth/auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UserEntity } from "./entities/user.entity";
import { AuthSession, UserProfile } from "./models/user.model";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simple mock hash – replace with bcrypt/argon2 in production. */
function hashPassword(plain: string): string {
    return `hashed:${plain}`;
}

function verifyPassword(plain: string, hash: string): boolean {
    return hash === hashPassword(plain);
}

function toProfile(user: UserEntity): UserProfile {
    return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString()
    };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly authService: AuthService
    ) {}

    // ── Auth ──────────────────────────────────────────────────────────────────

    async register(dto: RegisterDto): Promise<UserProfile> {
        if (await this.userRepo.existsBy({ username: dto.username })) {
            throw new BadRequestException(`Username "${dto.username}" is already taken`);
        }
        if (await this.userRepo.existsBy({ email: dto.email })) {
            throw new BadRequestException(`Email "${dto.email}" is already registered`);
        }

        const user = this.userRepo.create({
            username: dto.username,
            email: dto.email,
            passwordHash: hashPassword(dto.password),
            displayName: dto.displayName ?? dto.username,
            role: "member",
            status: "active"
        });
        await this.userRepo.save(user);
        return toProfile(user);
    }

    async login(dto: LoginDto): Promise<{ session: AuthSession; profile: UserProfile }> {
        const user = await this.userRepo.findOneBy({ username: dto.username });
        if (!user || !verifyPassword(dto.password, user.passwordHash)) {
            throw new UnauthorizedException("Invalid username or password");
        }
        if (user.status === "banned") {
            throw new UnauthorizedException("Your account has been banned");
        }

        user.lastLoginAt = new Date();
        await this.userRepo.save(user);

        const tokens = this.authService.signTokens(user.id, user.username, user.role);
        const session: AuthSession = { userId: user.id, ...tokens };
        return { session, profile: toProfile(user) };
    }

    async refreshTokens(refreshToken: string): Promise<AuthSession> {
        const tokens = this.authService.refreshTokens(refreshToken);
        const decoded = this.authService.decodeToken(tokens.accessToken);
        return { userId: decoded?.sub ?? "", ...tokens };
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    async getProfile(userId: string): Promise<UserProfile> {
        return toProfile(await this.findById(userId));
    }

    async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
        const user = await this.findById(userId);
        if (dto.displayName !== undefined) user.displayName = dto.displayName;
        if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
        if (dto.bio !== undefined) user.bio = dto.bio;
        await this.userRepo.save(user);
        return toProfile(user);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    async getAllUsers(): Promise<UserProfile[]> {
        const users = await this.userRepo.find({ order: { createdAt: "ASC" } });
        return users.map(toProfile);
    }

    async deleteUser(userId: string): Promise<void> {
        const user = await this.findById(userId);
        await this.userRepo.remove(user);
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private async findById(id: string): Promise<UserEntity> {
        const user = await this.userRepo.findOneBy({ id });
        if (!user) throw new NotFoundException(`User with id "${id}" not found`);
        return user;
    }
}
