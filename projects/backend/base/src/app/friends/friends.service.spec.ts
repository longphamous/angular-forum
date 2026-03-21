import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ObjectLiteral, Repository } from "typeorm";

import { ActivityService } from "../activity/activity.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PushService } from "../push/push.service";
import { UserEntity } from "../user/entities/user.entity";
import { FriendshipEntity } from "./entities/friendship.entity";
import { FriendsService } from "./friends.service";

const createMockRepo = <T extends ObjectLiteral>(): Partial<Record<keyof Repository<T>, jest.Mock>> => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    countBy: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn()
});

const mockNotificationsService = (): Partial<Record<keyof NotificationsService, jest.Mock>> => ({
    create: jest.fn()
});

const mockPushService = (): Partial<Record<keyof PushService, jest.Mock>> => ({
    sendToUser: jest.fn()
});

const mockActivityService = (): Partial<Record<keyof ActivityService, jest.Mock>> => ({
    create: jest.fn()
});

describe("FriendsService", () => {
    let service: FriendsService;
    let friendshipRepo: ReturnType<typeof createMockRepo<FriendshipEntity>>;
    let userRepo: ReturnType<typeof createMockRepo<UserEntity>>;
    let notificationsService: ReturnType<typeof mockNotificationsService>;
    let pushService: ReturnType<typeof mockPushService>;
    let activityService: ReturnType<typeof mockActivityService>;

    const now = new Date("2026-01-15T12:00:00Z");

    const makeUser = (overrides: Partial<UserEntity> = {}): Partial<UserEntity> => ({
        id: "user-1",
        username: "testuser",
        displayName: "Test User",
        avatarUrl: "avatar.png",
        ...overrides
    });

    const makeFriendship = (overrides: Partial<FriendshipEntity> = {}): Partial<FriendshipEntity> => ({
        id: "friendship-1",
        requesterId: "user-1",
        addresseeId: "user-2",
        status: "pending",
        createdAt: now,
        updatedAt: now,
        ...overrides
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        friendshipRepo = createMockRepo<FriendshipEntity>();
        userRepo = createMockRepo<UserEntity>();
        notificationsService = mockNotificationsService();
        pushService = mockPushService();
        activityService = mockActivityService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FriendsService,
                { provide: getRepositoryToken(FriendshipEntity), useValue: friendshipRepo },
                { provide: getRepositoryToken(UserEntity), useValue: userRepo },
                { provide: NotificationsService, useValue: notificationsService },
                { provide: PushService, useValue: pushService },
                { provide: ActivityService, useValue: activityService }
            ]
        }).compile();

        service = module.get<FriendsService>(FriendsService);
    });

    describe("sendRequest", () => {
        it("should create friendship, send notification and push event", async () => {
            const requester = makeUser({ id: "user-1", username: "requester", displayName: "Requester" });
            const addressee = makeUser({ id: "user-2", username: "addressee", displayName: "Addressee" });

            friendshipRepo.findOne!.mockResolvedValue(null);
            userRepo.findOne!.mockResolvedValueOnce(addressee).mockResolvedValueOnce(requester);

            const savedFriendship = makeFriendship({ id: "f-1" });
            friendshipRepo.create!.mockReturnValue(savedFriendship);
            friendshipRepo.save!.mockResolvedValue(savedFriendship);

            const result = await service.sendRequest("user-1", "user-2");

            expect(friendshipRepo.create).toHaveBeenCalledWith({
                requesterId: "user-1",
                addresseeId: "user-2",
                status: "pending"
            });
            expect(notificationsService.create).toHaveBeenCalledWith(
                "user-2",
                "friend_request",
                "Freundschaftsanfrage",
                expect.any(String),
                `/users/user-1`,
                { friendshipId: "f-1" }
            );
            expect(pushService.sendToUser).toHaveBeenCalledWith("user-2", "friend:request", expect.any(Object));
            expect(result.id).toBe("f-1");
            expect(result.user.id).toBe("user-2");
        });

        it("should throw BadRequestException when sending request to self", async () => {
            await expect(service.sendRequest("user-1", "user-1")).rejects.toThrow(BadRequestException);
        });

        it("should throw BadRequestException when pending request already exists", async () => {
            friendshipRepo.findOne!.mockResolvedValue(makeFriendship({ status: "pending" }));

            await expect(service.sendRequest("user-1", "user-2")).rejects.toThrow(BadRequestException);
        });

        it("should throw BadRequestException when already friends", async () => {
            friendshipRepo.findOne!.mockResolvedValue(makeFriendship({ status: "accepted" }));

            await expect(service.sendRequest("user-1", "user-2")).rejects.toThrow(BadRequestException);
        });

        it("should throw ForbiddenException when blocked", async () => {
            friendshipRepo.findOne!.mockResolvedValue(makeFriendship({ status: "blocked" }));

            await expect(service.sendRequest("user-1", "user-2")).rejects.toThrow(ForbiddenException);
        });

        it("should throw NotFoundException when addressee not found", async () => {
            friendshipRepo.findOne!.mockResolvedValue(null);
            userRepo.findOne!.mockResolvedValue(null);

            await expect(service.sendRequest("user-1", "user-2")).rejects.toThrow(NotFoundException);
        });
    });

    describe("acceptRequest", () => {
        it("should accept request, send notification and create activity", async () => {
            const friendship = makeFriendship({
                id: "f-1",
                requesterId: "user-1",
                addresseeId: "user-2",
                status: "pending"
            });
            const savedFriendship = { ...friendship, status: "accepted" };
            const requester = makeUser({ id: "user-1", displayName: "Requester" });
            const addressee = makeUser({ id: "user-2", displayName: "Addressee" });

            friendshipRepo.findOne!.mockResolvedValue(friendship);
            friendshipRepo.save!.mockResolvedValue(savedFriendship);
            userRepo.findOne!.mockResolvedValueOnce(requester).mockResolvedValueOnce(addressee);

            const result = await service.acceptRequest("user-2", "f-1");

            expect(friendship.status).toBe("accepted");
            expect(friendshipRepo.save).toHaveBeenCalledWith(friendship);
            expect(notificationsService.create).toHaveBeenCalledWith(
                "user-1",
                "friend_accepted",
                "Anfrage angenommen",
                expect.any(String),
                `/users/user-2`
            );
            expect(pushService.sendToUser).toHaveBeenCalledWith("user-1", "friend:accepted", expect.any(Object));
            expect(activityService.create).toHaveBeenCalled();
            expect(result.id).toBe("user-1");
            expect(result.friendshipId).toBe("f-1");
        });

        it("should throw NotFoundException when friendship not found", async () => {
            friendshipRepo.findOne!.mockResolvedValue(null);

            await expect(service.acceptRequest("user-2", "f-missing")).rejects.toThrow(NotFoundException);
        });

        it("should throw ForbiddenException when user is not the addressee", async () => {
            const friendship = makeFriendship({ addresseeId: "user-2" });
            friendshipRepo.findOne!.mockResolvedValue(friendship);

            await expect(service.acceptRequest("user-3", "friendship-1")).rejects.toThrow(ForbiddenException);
        });

        it("should throw BadRequestException when request is not pending", async () => {
            const friendship = makeFriendship({ addresseeId: "user-2", status: "accepted" });
            friendshipRepo.findOne!.mockResolvedValue(friendship);

            await expect(service.acceptRequest("user-2", "friendship-1")).rejects.toThrow(BadRequestException);
        });
    });

    describe("declineRequest", () => {
        it("should remove the friendship", async () => {
            const friendship = makeFriendship({ addresseeId: "user-2", status: "pending" });
            friendshipRepo.findOne!.mockResolvedValue(friendship);
            friendshipRepo.remove!.mockResolvedValue(friendship);

            await service.declineRequest("user-2", "friendship-1");

            expect(friendshipRepo.remove).toHaveBeenCalledWith(friendship);
        });

        it("should throw NotFoundException when friendship not found", async () => {
            friendshipRepo.findOne!.mockResolvedValue(null);

            await expect(service.declineRequest("user-2", "f-missing")).rejects.toThrow(NotFoundException);
        });

        it("should throw ForbiddenException when user is not addressee", async () => {
            const friendship = makeFriendship({ addresseeId: "user-2" });
            friendshipRepo.findOne!.mockResolvedValue(friendship);

            await expect(service.declineRequest("user-3", "friendship-1")).rejects.toThrow(ForbiddenException);
        });

        it("should throw BadRequestException when request is not pending", async () => {
            const friendship = makeFriendship({ addresseeId: "user-2", status: "accepted" });
            friendshipRepo.findOne!.mockResolvedValue(friendship);

            await expect(service.declineRequest("user-2", "friendship-1")).rejects.toThrow(BadRequestException);
        });
    });

    describe("getFriends", () => {
        it("should return friends list with user data", async () => {
            const friendships = [makeFriendship({ requesterId: "user-1", addresseeId: "user-2", status: "accepted" })];
            const friend = makeUser({ id: "user-2", username: "friend", displayName: "Friend" });

            friendshipRepo.find!.mockResolvedValue(friendships);
            userRepo.find!.mockResolvedValue([friend]);

            const result = await service.getFriends("user-1");

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("user-2");
            expect(result[0].username).toBe("friend");
            expect(result[0].friendshipId).toBe("friendship-1");
        });

        it("should return empty array when no friends", async () => {
            friendshipRepo.find!.mockResolvedValue([]);

            const result = await service.getFriends("user-1");

            expect(result).toEqual([]);
            expect(userRepo.find).not.toHaveBeenCalled();
        });

        it("should handle case where user is addressee in friendship", async () => {
            const friendships = [
                makeFriendship({ requesterId: "user-3", addresseeId: "user-1", status: "accepted" })
            ];
            const friend = makeUser({ id: "user-3", username: "otherfriend", displayName: "Other Friend" });

            friendshipRepo.find!.mockResolvedValue(friendships);
            userRepo.find!.mockResolvedValue([friend]);

            const result = await service.getFriends("user-1");

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("user-3");
        });
    });

    describe("cancelRequest", () => {
        it("should remove the friendship when requester cancels", async () => {
            const friendship = makeFriendship({ requesterId: "user-1", status: "pending" });
            friendshipRepo.findOne!.mockResolvedValue(friendship);
            friendshipRepo.remove!.mockResolvedValue(friendship);

            await service.cancelRequest("user-1", "friendship-1");

            expect(friendshipRepo.remove).toHaveBeenCalledWith(friendship);
        });

        it("should throw ForbiddenException when non-requester tries to cancel", async () => {
            const friendship = makeFriendship({ requesterId: "user-1" });
            friendshipRepo.findOne!.mockResolvedValue(friendship);

            await expect(service.cancelRequest("user-2", "friendship-1")).rejects.toThrow(ForbiddenException);
        });
    });

    describe("removeFriend", () => {
        it("should remove accepted friendship", async () => {
            const friendship = makeFriendship({ status: "accepted" });
            friendshipRepo.findOne!.mockResolvedValue(friendship);
            friendshipRepo.remove!.mockResolvedValue(friendship);

            await service.removeFriend("user-1", "user-2");

            expect(friendshipRepo.remove).toHaveBeenCalledWith(friendship);
        });

        it("should throw NotFoundException when friendship not found", async () => {
            friendshipRepo.findOne!.mockResolvedValue(null);

            await expect(service.removeFriend("user-1", "user-2")).rejects.toThrow(NotFoundException);
        });
    });

    describe("getFriendCount", () => {
        it("should return the count of accepted friendships", async () => {
            friendshipRepo.count!.mockResolvedValue(5);

            const result = await service.getFriendCount("user-1");

            expect(result).toBe(5);
            expect(friendshipRepo.count).toHaveBeenCalledWith({
                where: [
                    { requesterId: "user-1", status: "accepted" },
                    { addresseeId: "user-1", status: "accepted" }
                ]
            });
        });
    });
});
