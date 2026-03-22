import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { DataSource, In, MoreThanOrEqual, Repository } from "typeorm";

import { AuthService } from "../auth/auth.service";
import { GamificationService } from "../gamification/gamification.service";
import { UserXpData } from "../gamification/level.config";
import { GroupEntity } from "../group/entities/group.entity";
import { ModerationService } from "../moderation/moderation.service";
import { PushService } from "../push/push.service";
import { AdminCreateUserDto } from "./dto/admin-create-user.dto";
import { AdminUpdateUserDto } from "./dto/admin-update-user.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UserEntity } from "./entities/user.entity";
import { AuthSession, UserProfile } from "./models/user.model";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface OnlineUserDto {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    lastSeenAt: string;
}

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
        coverUrl: user.coverUrl ?? undefined,
        bio: user.bio,
        birthday: user.birthday ? (user.birthday as Date).toISOString().split("T")[0] : undefined,
        gender: user.gender,
        location: user.location,
        website: user.website,
        signature: user.signature,
        socialLinks: user.socialLinks,
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
        private readonly gamificationService: GamificationService,
        private readonly moderationService: ModerationService,
        private readonly pushService: PushService
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
                "SELECT COUNT(*) AS count FROM forum_posts WHERE author_id = $1 AND deleted_at IS NULL",
                [userId]
            ),
            this.gamificationService.getUserXpData(userId)
        ]);
        return toProfile(user, Number(count), xpData);
    }

    async updateProfile(
        userId: string,
        dto: UpdateProfileDto
    ): Promise<{ profile: UserProfile; pendingFields?: string[] }> {
        const user = await this.findById(userId);
        const exempt = await this.moderationService.isExempt(userId);
        const pendingFields: string[] = [];

        // Fields that require moderation for non-exempt users
        const moderatedFields: { dtoKey: keyof UpdateProfileDto; type: "avatar_url" | "cover" | "signature"; userKey: keyof UserEntity }[] = [
            { dtoKey: "avatarUrl", type: "avatar_url", userKey: "avatarUrl" },
            { dtoKey: "coverUrl", type: "cover", userKey: "coverUrl" },
            { dtoKey: "signature", type: "signature", userKey: "signature" }
        ];

        for (const { dtoKey, type, userKey } of moderatedFields) {
            const newValue = dto[dtoKey];
            if (newValue !== undefined) {
                if (exempt) {
                    (user as unknown as Record<string, unknown>)[userKey] = newValue;
                } else {
                    try {
                        await this.moderationService.submitForApproval(
                            userId,
                            type,
                            (user[userKey] as string | undefined) ?? null,
                            newValue as string
                        );
                        pendingFields.push(dtoKey);
                    } catch {
                        // Already has a pending entry for this type — skip silently
                        pendingFields.push(dtoKey);
                    }
                }
            }
        }

        // Non-moderated fields — apply directly
        if (dto.displayName !== undefined) user.displayName = dto.displayName;
        if (dto.bio !== undefined) user.bio = dto.bio;
        if (dto.birthday !== undefined) user.birthday = dto.birthday ? new Date(dto.birthday) : undefined;
        if (dto.gender !== undefined) user.gender = dto.gender;
        if (dto.location !== undefined) user.location = dto.location;
        if (dto.website !== undefined) user.website = dto.website;
        if (dto.socialLinks !== undefined) user.socialLinks = dto.socialLinks;

        await this.userRepo.save(user);
        const profile = toProfile(user);
        return pendingFields.length > 0 ? { profile, pendingFields } : { profile };
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    async getAllUsers(): Promise<UserProfile[]> {
        const users = await this.userRepo.find({ order: { createdAt: "ASC" }, relations: { groups: true } });
        return users.map((u) => toProfile(u));
    }

    async autocompleteUsers(query: string): Promise<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]> {
        if (!query || query.length < 2) return [];
        const users = await this.userRepo
            .createQueryBuilder("u")
            .where("u.username ILIKE :q OR u.display_name ILIKE :q", { q: `%${query}%` })
            .orderBy("u.username", "ASC")
            .take(10)
            .getMany();
        return users.map((u) => ({ id: u.id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl ?? null }));
    }

    async searchUsers(query: string, limit: number): Promise<{ id: string; username: string; displayName: string }[]> {
        const users = await this.userRepo
            .createQueryBuilder("u")
            .where("u.username ILIKE :q OR u.displayName ILIKE :q", { q: `%${query}%` })
            .orderBy("u.username", "ASC")
            .take(limit)
            .getMany();
        return users.map((u) => ({ id: u.id, username: u.username, displayName: u.displayName }));
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
        if (dto.coverUrl !== undefined) user.coverUrl = dto.coverUrl;
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

    // ── Presence ──────────────────────────────────────────────────────────────

    async findOnlineUsers(options: {
        window: "today" | "24h";
        sort: "lastSeen" | "username";
        order: "asc" | "desc";
        limit: number;
    }): Promise<OnlineUserDto[]> {
        const since =
            options.window === "today"
                ? (() => {
                      const d = new Date();
                      d.setHours(0, 0, 0, 0);
                      return d;
                  })()
                : new Date(Date.now() - 24 * 60 * 60 * 1000);

        const dir = options.order === "asc" ? ("ASC" as const) : ("DESC" as const);
        const users = await this.userRepo.find({
            where: { lastSeenAt: MoreThanOrEqual(since), status: "active" },
            order: options.sort === "username" ? { username: dir } : { lastSeenAt: dir },
            take: options.limit
        });

        return users.map((u) => ({
            userId: u.id,
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl ?? null,
            lastSeenAt: u.lastSeenAt!.toISOString()
        }));
    }

    async getOnlineUserIds(): Promise<string[]> {
        // Use real-time WebSocket presence; no DB polling needed
        return this.pushService.getOnlineUserIds();
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private async findById(id: string): Promise<UserEntity> {
        const user = await this.userRepo.findOne({ where: { id }, relations: { groups: true } });
        if (!user) throw new NotFoundException(`User with id "${id}" not found`);
        return user;
    }
}
