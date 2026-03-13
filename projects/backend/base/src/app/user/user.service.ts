import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { DataSource, In, Repository } from "typeorm";

import { AuthService } from "../auth/auth.service";
import { GamificationService } from "../gamification/gamification.service";
import { UserXpData } from "../gamification/level.config";
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

const DEFAULT_XP: UserXpData = { xp: 0, level: 1, levelName: "Neuling", xpToNextLevel: 100, xpProgressPercent: 0 };

function toProfile(user: UserEntity, postCount = 0, xpData: UserXpData = DEFAULT_XP): UserProfile {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        birthday: user.birthday ? (user.birthday as Date).toISOString().split("T")[0] : undefined,
        gender: user.gender,
        location: user.location,
        website: user.website,
        signature: user.signature,
        role: user.role,
        status: user.status,
        groups: user.groups?.map((g) => g.name) ?? [],
        postCount,
        level: xpData.level,
        levelName: xpData.levelName,
        xp: xpData.xp,
        xpToNextLevel: xpData.xpToNextLevel,
        xpProgressPercent: xpData.xpProgressPercent,
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
        @InjectDataSource()
        private readonly dataSource: DataSource,
        private readonly authService: AuthService,
        private readonly gamificationService: GamificationService
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
        const [user, [{ count }], xpData] = await Promise.all([
            this.findById(userId),
            this.dataSource.query<{ count: string }[]>(
                `SELECT COUNT(*) AS count FROM forum_posts WHERE author_id = $1 AND deleted_at IS NULL`,
                [userId]
            ),
            this.gamificationService.getUserXpData(userId)
        ]);
        return toProfile(user, Number(count), xpData);
    }

    async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
        const user = await this.findById(userId);
        if (dto.displayName !== undefined) user.displayName = dto.displayName;
        if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
        if (dto.bio !== undefined) user.bio = dto.bio;
        if (dto.birthday !== undefined) user.birthday = dto.birthday ? new Date(dto.birthday) : undefined;
        if (dto.gender !== undefined) user.gender = dto.gender;
        if (dto.location !== undefined) user.location = dto.location;
        if (dto.website !== undefined) user.website = dto.website;
        if (dto.signature !== undefined) user.signature = dto.signature;
        await this.userRepo.save(user);
        return toProfile(user);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    async getAllUsers(): Promise<UserProfile[]> {
        const users = await this.userRepo.find({ order: { createdAt: "ASC" }, relations: { groups: true } });
        return users.map((u) => toProfile(u));
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
        if (dto.birthday !== undefined) user.birthday = dto.birthday ? new Date(dto.birthday) : undefined;
        if (dto.gender !== undefined) user.gender = dto.gender;
        if (dto.location !== undefined) user.location = dto.location;
        if (dto.website !== undefined) user.website = dto.website;
        if (dto.signature !== undefined) user.signature = dto.signature;
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
