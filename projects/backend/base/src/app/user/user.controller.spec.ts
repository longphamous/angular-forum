import { Test, TestingModule } from "@nestjs/testing";

import { AuthenticatedUser } from "../auth/models/jwt.model";
import { NotificationsService } from "../notifications/notifications.service";
import { UserProfile } from "./models/user.model";
import { UserController } from "./user.controller";
import { OnlineUserDto, UserService } from "./user.service";

const mockUserService: Partial<jest.Mocked<UserService>> = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getAllUsers: jest.fn(),
    searchUsers: jest.fn(),
    autocompleteUsers: jest.fn(),
    adminCreateUser: jest.fn(),
    adminUpdateUser: jest.fn(),
    deleteUser: jest.fn(),
    findOnlineUsers: jest.fn(),
    getOnlineUserIds: jest.fn()
};

const mockNotificationsService: Partial<jest.Mocked<NotificationsService>> = {
    create: jest.fn().mockResolvedValue({})
};

const memberUser: AuthenticatedUser = { userId: "user-1", username: "alice", role: "member" };
const adminUser: AuthenticatedUser = { userId: "admin-1", username: "admin", role: "admin" };

const makeProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
    id: "target-1",
    username: "bob",
    email: "bob@example.com",
    displayName: "Bob",
    role: "member",
    status: "active",
    groups: [],
    postCount: 5,
    level: 1,
    levelName: "Neuling",
    xp: 0,
    xpToNextLevel: 100,
    xpProgressPercent: 0,
    gender: "male",
    profileFieldSettings: undefined,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides
});

describe("UserController", () => {
    let controller: UserController;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                { provide: UserService, useValue: mockUserService },
                { provide: NotificationsService, useValue: mockNotificationsService }
            ]
        }).compile();

        controller = module.get<UserController>(UserController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    // ─── getProfile - gender visibility ─────────────────────────────────────────

    describe("getProfile", () => {
        it("should return full profile for the owner", async () => {
            const profile = makeProfile({ id: "user-1", gender: "male" });
            (mockUserService.getProfile as jest.Mock).mockResolvedValue(profile);

            const result = await controller.getProfile("user-1", memberUser);

            expect(result.gender).toBe("male");
            expect(result.email).toBe("bob@example.com");
        });

        it("should return full profile for admin viewing another user", async () => {
            const profile = makeProfile({ gender: "female" });
            (mockUserService.getProfile as jest.Mock).mockResolvedValue(profile);

            const result = await controller.getProfile("target-1", adminUser);

            expect(result.gender).toBe("female");
            expect(result.email).toBe("bob@example.com");
        });

        it("should strip email but show gender when visibility is 'everyone' for non-owner", async () => {
            const profile = makeProfile({
                gender: "male",
                profileFieldSettings: { gender: "everyone" }
            });
            (mockUserService.getProfile as jest.Mock).mockResolvedValue(profile);

            const result = await controller.getProfile("target-1", memberUser);

            expect(result.email).toBe("");
            expect(result.gender).toBe("male");
        });

        it("should show gender when default (no profileFieldSettings) for authenticated non-owner", async () => {
            const profile = makeProfile({ gender: "male", profileFieldSettings: undefined });
            (mockUserService.getProfile as jest.Mock).mockResolvedValue(profile);

            const result = await controller.getProfile("target-1", memberUser);

            expect(result.gender).toBe("male");
        });

        it("should show gender when visibility is 'members' and viewer is authenticated", async () => {
            const profile = makeProfile({
                gender: "female",
                profileFieldSettings: { gender: "members" }
            });
            (mockUserService.getProfile as jest.Mock).mockResolvedValue(profile);

            const result = await controller.getProfile("target-1", memberUser);

            expect(result.gender).toBe("female");
        });

        it("should hide gender when visibility is 'members' and viewer is not authenticated", async () => {
            const profile = makeProfile({
                gender: "male",
                profileFieldSettings: { gender: "members" }
            });
            (mockUserService.getProfile as jest.Mock).mockResolvedValue(profile);

            const result = await controller.getProfile("target-1", undefined);

            expect(result.gender).toBeUndefined();
            expect(result.email).toBe("");
        });

        it("should hide gender when visibility is 'nobody' even for authenticated viewer", async () => {
            const profile = makeProfile({
                gender: "male",
                profileFieldSettings: { gender: "nobody" }
            });
            (mockUserService.getProfile as jest.Mock).mockResolvedValue(profile);

            const result = await controller.getProfile("target-1", memberUser);

            expect(result.gender).toBeUndefined();
        });

        it("should send profile-visit notification for non-owner visitor", async () => {
            const profile = makeProfile();
            (mockUserService.getProfile as jest.Mock).mockResolvedValue(profile);
            (mockNotificationsService.create as jest.Mock).mockResolvedValue({});

            await controller.getProfile("target-1", memberUser);

            expect(mockNotificationsService.create).toHaveBeenCalledWith(
                "target-1",
                "system",
                "Profile visited",
                expect.stringContaining("alice"),
                expect.any(String)
            );
        });
    });

    // ─── getMe ──────────────────────────────────────────────────────────────────

    describe("getMe", () => {
        it("should delegate to userService.getProfile with the caller's userId", async () => {
            const profile = makeProfile({ id: "user-1" });
            (mockUserService.getProfile as jest.Mock).mockResolvedValue(profile);

            const result = await controller.getMe(memberUser);

            expect(mockUserService.getProfile).toHaveBeenCalledWith("user-1");
            expect(result.id).toBe("user-1");
        });
    });

    // ─── updateProfile ──────────────────────────────────────────────────────────

    describe("updateProfile", () => {
        it("should delegate to userService.updateProfile", async () => {
            const profile = makeProfile();
            (mockUserService.updateProfile as jest.Mock).mockResolvedValue({ profile });

            const result = await controller.updateProfile(memberUser, { displayName: "New Name" });

            expect(mockUserService.updateProfile).toHaveBeenCalledWith("user-1", { displayName: "New Name" });
            expect(result.profile).toBeDefined();
        });
    });

    // ─── Online ─────────────────────────────────────────────────────────────────

    describe("getOnlineUsers", () => {
        it("should return online users with default params", async () => {
            const users: OnlineUserDto[] = [
                {
                    userId: "u1",
                    username: "alice",
                    displayName: "Alice",
                    avatarUrl: null,
                    lastSeenAt: "2026-03-01T10:00:00Z"
                }
            ];
            (mockUserService.findOnlineUsers as jest.Mock).mockResolvedValue(users);

            const result = await controller.getOnlineUsers();

            expect(result).toHaveLength(1);
        });
    });

    describe("getOnlineUserIds", () => {
        it("should delegate to userService", async () => {
            (mockUserService.getOnlineUserIds as jest.Mock).mockResolvedValue(["u1", "u2"]);

            const result = await controller.getOnlineUserIds();

            expect(result).toEqual(["u1", "u2"]);
        });
    });
});
