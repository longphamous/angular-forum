import { BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getDataSourceToken, getRepositoryToken } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { ObjectLiteral, Repository } from "typeorm";

import { AuthService } from "../auth/auth.service";
import { GamificationService } from "../gamification/gamification.service";
import { UserXpData } from "../gamification/level.config";
import { GroupEntity } from "../group/entities/group.entity";
import { ModerationService } from "../moderation/moderation.service";
import { PushService } from "../push/push.service";
import { UserEntity } from "./entities/user.entity";
import { UserService } from "./user.service";

jest.mock("bcryptjs");

const createMockRepo = <T extends ObjectLiteral>(): Partial<Record<keyof Repository<T>, jest.Mock>> => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    findByIds: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    countBy: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    existsBy: jest.fn(),
    createQueryBuilder: jest.fn()
});

const mockAuthService = (): Partial<Record<keyof AuthService, jest.Mock>> => ({
    signTokens: jest.fn(),
    refreshTokens: jest.fn(),
    decodeToken: jest.fn()
});

const mockGamificationService = (): Partial<Record<keyof GamificationService, jest.Mock>> => ({
    getUserXpData: jest.fn()
});

const mockModerationService = (): Partial<Record<keyof ModerationService, jest.Mock>> => ({
    isExempt: jest.fn(),
    submitForApproval: jest.fn()
});

const mockPushService = (): Partial<Record<keyof PushService, jest.Mock>> => ({
    getOnlineUserIds: jest.fn()
});

describe("UserService", () => {
    let service: UserService;
    let userRepo: ReturnType<typeof createMockRepo<UserEntity>>;
    let groupRepo: ReturnType<typeof createMockRepo<GroupEntity>>;
    let authService: ReturnType<typeof mockAuthService>;
    let gamificationService: ReturnType<typeof mockGamificationService>;
    let moderationService: ReturnType<typeof mockModerationService>;
    let pushService: ReturnType<typeof mockPushService>;
    let dataSource: { query: jest.Mock };

    const now = new Date("2026-03-01T10:00:00Z");

    const makeUser = (overrides: Partial<UserEntity> = {}): Partial<UserEntity> => ({
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hashed-pw",
        displayName: "Test User",
        avatarUrl: "avatar.png",
        coverUrl: null,
        bio: "A bio",
        birthday: undefined,
        gender: undefined,
        location: undefined,
        website: undefined,
        signature: undefined,
        socialLinks: undefined,
        profileFieldSettings: undefined,
        role: "member",
        status: "active",
        groups: [],
        createdAt: now,
        lastLoginAt: now,
        lastSeenAt: now,
        ...overrides
    });

    const defaultXp: UserXpData = { xp: 0, level: 1, levelName: "Neuling", xpToNextLevel: 100, xpProgressPercent: 0 };

    beforeEach(async () => {
        jest.clearAllMocks();
        userRepo = createMockRepo<UserEntity>();
        groupRepo = createMockRepo<GroupEntity>();
        authService = mockAuthService();
        gamificationService = mockGamificationService();
        moderationService = mockModerationService();
        pushService = mockPushService();
        dataSource = { query: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: getRepositoryToken(UserEntity), useValue: userRepo },
                { provide: getRepositoryToken(GroupEntity), useValue: groupRepo },
                { provide: getDataSourceToken(), useValue: dataSource },
                { provide: AuthService, useValue: authService },
                { provide: GamificationService, useValue: gamificationService },
                { provide: ModerationService, useValue: moderationService },
                { provide: PushService, useValue: pushService }
            ]
        }).compile();

        service = module.get<UserService>(UserService);
    });

    describe("register", () => {
        it("should register a new user", async () => {
            userRepo.existsBy!.mockResolvedValue(false);
            groupRepo.findBy!.mockResolvedValue([]);
            (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
            const created = makeUser({ id: "new-user", username: "newuser", email: "new@example.com" });
            userRepo.create!.mockReturnValue(created);
            userRepo.save!.mockResolvedValue(created);

            const result = await service.register({
                username: "newuser",
                email: "new@example.com",
                password: "pass123"
            });

            expect(userRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    username: "newuser",
                    email: "new@example.com",
                    role: "member",
                    status: "active"
                })
            );
            expect(result.username).toBe("newuser");
        });

        it("should throw BadRequestException when username is taken", async () => {
            userRepo.existsBy!.mockResolvedValueOnce(true);

            await expect(
                service.register({ username: "taken", email: "x@x.com", password: "pass" })
            ).rejects.toThrow(BadRequestException);
        });

        it("should throw BadRequestException when email is taken", async () => {
            userRepo.existsBy!.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

            await expect(
                service.register({ username: "newuser", email: "taken@x.com", password: "pass" })
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe("login", () => {
        it("should return session and profile on valid credentials", async () => {
            const user = makeUser({ passwordHash: "hashed-pw" });
            userRepo.findOne!.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            authService.signTokens!.mockReturnValue({ accessToken: "at", refreshToken: "rt" });
            userRepo.save!.mockResolvedValue(user);

            const result = await service.login({ username: "testuser", password: "pass" });

            expect(result.session.accessToken).toBe("at");
            expect(result.profile.username).toBe("testuser");
        });

        it("should throw UnauthorizedException on invalid credentials", async () => {
            userRepo.findOne!.mockResolvedValue(null);

            await expect(service.login({ username: "bad", password: "bad" })).rejects.toThrow(UnauthorizedException);
        });

        it("should throw UnauthorizedException on wrong password", async () => {
            userRepo.findOne!.mockResolvedValue(makeUser());
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login({ username: "testuser", password: "wrong" })).rejects.toThrow(
                UnauthorizedException
            );
        });

        it("should throw UnauthorizedException when user is banned", async () => {
            const user = makeUser({ status: "banned" });
            userRepo.findOne!.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(service.login({ username: "testuser", password: "pass" })).rejects.toThrow(
                UnauthorizedException
            );
        });
    });

    describe("refreshTokens", () => {
        it("should return new tokens", async () => {
            authService.refreshTokens!.mockReturnValue({ accessToken: "new-at", refreshToken: "new-rt" });
            authService.decodeToken!.mockReturnValue({ sub: "user-1" });

            const result = await service.refreshTokens("old-rt");

            expect(result.userId).toBe("user-1");
            expect(result.accessToken).toBe("new-at");
        });
    });

    describe("getProfile", () => {
        it("should return enriched profile with post count and xp", async () => {
            const user = makeUser();
            userRepo.findOne!.mockResolvedValue(user);
            dataSource.query.mockResolvedValue([{ count: "42" }]);
            gamificationService.getUserXpData!.mockResolvedValue(defaultXp);

            const result = await service.getProfile("user-1");

            expect(result.postCount).toBe(42);
            expect(result.level).toBe(1);
        });

        it("should throw NotFoundException when user not found", async () => {
            userRepo.findOne!.mockResolvedValue(null);

            await expect(service.getProfile("missing")).rejects.toThrow(NotFoundException);
        });
    });

    describe("updateProfile", () => {
        it("should update profile fields", async () => {
            const user = makeUser();
            userRepo.findOne!.mockResolvedValue(user);
            userRepo.save!.mockImplementation((u) => Promise.resolve(u));
            moderationService.isExempt!.mockResolvedValue(true);

            const result = await service.updateProfile("user-1", {
                displayName: "New Name",
                bio: "New bio"
            });

            expect(user.displayName).toBe("New Name");
            expect(user.bio).toBe("New bio");
            expect(result).toBeDefined();
        });

        it("should update profileFieldSettings", async () => {
            const user = makeUser();
            userRepo.findOne!.mockResolvedValue(user);
            userRepo.save!.mockImplementation((u) => Promise.resolve(u));
            moderationService.isExempt!.mockResolvedValue(true);

            const result = await service.updateProfile("user-1", {
                profileFieldSettings: { gender: "members" }
            });

            expect(user.profileFieldSettings).toEqual({ gender: "members" });
            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when user not found", async () => {
            userRepo.findOne!.mockResolvedValue(null);

            await expect(service.updateProfile("missing", { displayName: "X" })).rejects.toThrow(NotFoundException);
        });
    });

    describe("getAllUsers", () => {
        it("should return all users as profiles", async () => {
            const users = [makeUser({ id: "u1" }), makeUser({ id: "u2", username: "user2" })];
            userRepo.find!.mockResolvedValue(users);

            const result = await service.getAllUsers();

            expect(result).toHaveLength(2);
            expect(userRepo.find).toHaveBeenCalledWith({
                order: { createdAt: "ASC" },
                relations: { groups: true }
            });
        });
    });

    describe("searchUsers", () => {
        it("should search users by query", async () => {
            const mockQb = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([makeUser()])
            };
            userRepo.createQueryBuilder!.mockReturnValue(mockQb);

            const result = await service.searchUsers("test", 10);

            expect(result).toHaveLength(1);
            expect(result[0].username).toBe("testuser");
        });
    });

    describe("adminCreateUser", () => {
        it("should create user with admin role and groups", async () => {
            userRepo.existsBy!.mockResolvedValue(false);
            groupRepo.findBy!.mockResolvedValue([]);
            (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
            const created = makeUser({ id: "admin-created", role: "admin" });
            userRepo.create!.mockReturnValue(created);
            userRepo.save!.mockResolvedValue(created);

            const result = await service.adminCreateUser({
                username: "newadmin",
                email: "admin@x.com",
                password: "pass",
                role: "admin"
            });

            expect(result).toBeDefined();
            expect(userRepo.create).toHaveBeenCalled();
        });

        it("should throw BadRequestException when username is taken", async () => {
            userRepo.existsBy!.mockResolvedValueOnce(true);

            await expect(
                service.adminCreateUser({ username: "taken", email: "x@x.com", password: "pass" })
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe("adminUpdateUser", () => {
        it("should update user fields including role", async () => {
            const user = makeUser();
            userRepo.findOne!.mockResolvedValue(user);
            userRepo.save!.mockImplementation((u) => Promise.resolve(u));

            const result = await service.adminUpdateUser("user-1", {
                displayName: "Admin Changed",
                role: "moderator"
            });

            expect(user.displayName).toBe("Admin Changed");
            expect(user.role).toBe("moderator");
            expect(result).toBeDefined();
        });
    });

    describe("deleteUser", () => {
        it("should remove the user", async () => {
            const user = makeUser();
            userRepo.findOne!.mockResolvedValue(user);
            userRepo.remove!.mockResolvedValue(user);

            await service.deleteUser("user-1");

            expect(userRepo.remove).toHaveBeenCalledWith(user);
        });

        it("should throw NotFoundException when user not found", async () => {
            userRepo.findOne!.mockResolvedValue(null);

            await expect(service.deleteUser("missing")).rejects.toThrow(NotFoundException);
        });
    });

    describe("findOnlineUsers", () => {
        it("should return online users", async () => {
            const users = [makeUser({ lastSeenAt: now })];
            userRepo.find!.mockResolvedValue(users);

            const result = await service.findOnlineUsers({
                window: "24h",
                sort: "lastSeen",
                order: "desc",
                limit: 50
            });

            expect(result).toHaveLength(1);
            expect(result[0].username).toBe("testuser");
        });

        it("should handle 'today' window option", async () => {
            userRepo.find!.mockResolvedValue([]);

            const result = await service.findOnlineUsers({
                window: "today",
                sort: "username",
                order: "asc",
                limit: 10
            });

            expect(result).toEqual([]);
            expect(userRepo.find).toHaveBeenCalled();
        });
    });

    describe("getOnlineUserIds", () => {
        it("should delegate to pushService", async () => {
            pushService.getOnlineUserIds!.mockResolvedValue(["u1", "u2"]);

            const result = await service.getOnlineUserIds();

            expect(result).toEqual(["u1", "u2"]);
        });
    });
});
