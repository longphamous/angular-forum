import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { In, Repository } from "typeorm";

import { AuthService } from "../auth/auth.service";
import { GroupEntity } from "../group/entities/group.entity";
import { AdminCreateUserDto } from "./dto/admin-create-user.dto";
import { AdminUpdateUserDto } from "./dto/admin-update-user.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UserEntity } from "./entities/user.entity";
import { AuthSession, UserProfile } from "./models/user.model";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 10;

function toProfile(user: UserEntity): UserProfile {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        status: user.status,
        groups: user.groups?.map((g) => g.name) ?? [],
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
        @InjectRepository(GroupEntity)
        private readonly groupRepo: Repository<GroupEntity>,
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

        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
        const defaultGroups = await this.groupRepo.findBy({ name: In(["Jeder", "Registrierte Benutzer"]) });
        const user = this.userRepo.create({
            username: dto.username,
            email: dto.email,
            passwordHash,
            displayName: dto.displayName ?? dto.username,
            role: "member",
            status: "active",
            groups: defaultGroups
        });
        await this.userRepo.save(user);
        return toProfile(user);
    }

    async login(dto: LoginDto): Promise<{ session: AuthSession; profile: UserProfile }> {
        const user = await this.userRepo.findOne({ where: { username: dto.username }, relations: { groups: true } });
        const passwordValid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

        if (!user || !passwordValid) {
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
        const users = await this.userRepo.find({ order: { createdAt: "ASC" }, relations: { groups: true } });
        return users.map(toProfile);
    }

    async adminCreateUser(dto: AdminCreateUserDto): Promise<UserProfile> {
        if (await this.userRepo.existsBy({ username: dto.username })) {
            throw new BadRequestException(`Username "${dto.username}" is already taken`);
        }
        if (await this.userRepo.existsBy({ email: dto.email })) {
            throw new BadRequestException(`Email "${dto.email}" is already registered`);
        }

        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
        const role = dto.role ?? "member";
        const groupNames = ["Jeder", "Registrierte Benutzer"];
        if (role === "admin") groupNames.push("Admin");
        if (role === "moderator") groupNames.push("Moderator");
        const defaultGroups = await this.groupRepo.findBy({ name: In(groupNames) });
        const user = this.userRepo.create({
            username: dto.username,
            email: dto.email,
            passwordHash,
            displayName: dto.displayName ?? dto.username,
            role,
            status: dto.status ?? "active",
            groups: defaultGroups
        });
        await this.userRepo.save(user);
        return toProfile(user);
    }

    async adminUpdateUser(userId: string, dto: AdminUpdateUserDto): Promise<UserProfile> {
        const user = await this.findById(userId);
        if (dto.displayName !== undefined) user.displayName = dto.displayName;
        if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
        if (dto.bio !== undefined) user.bio = dto.bio;
        if (dto.role !== undefined) user.role = dto.role;
        if (dto.status !== undefined) user.status = dto.status;
        await this.userRepo.save(user);
        return toProfile(user);
    }

    async deleteUser(userId: string): Promise<void> {
        const user = await this.findById(userId);
        await this.userRepo.remove(user);
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private async findById(id: string): Promise<UserEntity> {
        const user = await this.userRepo.findOne({ where: { id }, relations: { groups: true } });
        if (!user) throw new NotFoundException(`User with id "${id}" not found`);
        return user;
    }
}
