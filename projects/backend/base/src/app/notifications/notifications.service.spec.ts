import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PushService } from "../push/push.service";
import { NotificationEntity, NotificationType } from "./entities/notification.entity";
import { NotificationsService } from "./notifications.service";

const mockNotifRepo = (): Partial<Record<keyof Repository<NotificationEntity>, jest.Mock>> => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    countBy: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn()
});

const mockPushService = (): Partial<Record<keyof PushService, jest.Mock>> => ({
    sendToUser: jest.fn()
});

describe("NotificationsService", () => {
    let service: NotificationsService;
    let notifRepo: ReturnType<typeof mockNotifRepo>;
    let pushService: ReturnType<typeof mockPushService>;

    beforeEach(async () => {
        jest.clearAllMocks();
        notifRepo = mockNotifRepo();
        pushService = mockPushService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                { provide: getRepositoryToken(NotificationEntity), useValue: notifRepo },
                { provide: PushService, useValue: pushService }
            ]
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
    });

    describe("create", () => {
        it("should save notification and push real-time event", async () => {
            const now = new Date();
            const createdNotif = {
                userId: "user-1",
                type: "system" as NotificationType,
                title: "Test",
                body: "Test body",
                link: null,
                metadata: null
            };
            const savedNotif = { ...createdNotif, id: "notif-1", createdAt: now };

            notifRepo.create!.mockReturnValue(createdNotif);
            notifRepo.save!.mockResolvedValue(savedNotif);

            await service.create("user-1", "system", "Test", "Test body");

            expect(notifRepo.create).toHaveBeenCalledWith({
                userId: "user-1",
                type: "system",
                title: "Test",
                body: "Test body",
                link: null,
                metadata: null
            });
            expect(notifRepo.save).toHaveBeenCalledWith(createdNotif);
            expect(pushService.sendToUser).toHaveBeenCalledWith("user-1", "notification:new", {
                id: "notif-1",
                type: "system",
                title: "Test",
                body: "Test body",
                link: null,
                createdAt: now.toISOString()
            });
        });

        it("should pass link and metadata when provided", async () => {
            const now = new Date();
            const savedNotif = {
                id: "notif-2",
                userId: "user-1",
                type: "mention" as NotificationType,
                title: "Mention",
                body: "You were mentioned",
                link: "/thread/1",
                metadata: { threadId: "t-1" },
                createdAt: now
            };

            notifRepo.create!.mockReturnValue({});
            notifRepo.save!.mockResolvedValue(savedNotif);

            await service.create("user-1", "mention", "Mention", "You were mentioned", "/thread/1", {
                threadId: "t-1"
            });

            expect(notifRepo.create).toHaveBeenCalledWith({
                userId: "user-1",
                type: "mention",
                title: "Mention",
                body: "You were mentioned",
                link: "/thread/1",
                metadata: { threadId: "t-1" }
            });
        });
    });

    describe("getForUser", () => {
        it("should return notifications for user ordered by createdAt DESC", async () => {
            const notifications = [{ id: "n-1" }, { id: "n-2" }];
            notifRepo.find!.mockResolvedValue(notifications);

            const result = await service.getForUser("user-1", 10);

            expect(notifRepo.find).toHaveBeenCalledWith({
                where: { userId: "user-1" },
                order: { createdAt: "DESC" },
                take: 10
            });
            expect(result).toEqual(notifications);
        });

        it("should use default limit of 30", async () => {
            notifRepo.find!.mockResolvedValue([]);

            await service.getForUser("user-1");

            expect(notifRepo.find).toHaveBeenCalledWith({
                where: { userId: "user-1" },
                order: { createdAt: "DESC" },
                take: 30
            });
        });
    });

    describe("getUnreadCount", () => {
        it("should count unread notifications for user", async () => {
            notifRepo.count!.mockResolvedValue(5);

            const result = await service.getUnreadCount("user-1");

            expect(notifRepo.count).toHaveBeenCalledWith({ where: { userId: "user-1", isRead: false } });
            expect(result).toBe(5);
        });
    });

    describe("markAsRead", () => {
        it("should update notification isRead to true", async () => {
            notifRepo.update!.mockResolvedValue({ affected: 1 });

            await service.markAsRead("user-1", "notif-1");

            expect(notifRepo.update).toHaveBeenCalledWith({ id: "notif-1", userId: "user-1" }, { isRead: true });
        });
    });

    describe("markAllAsRead", () => {
        it("should use query builder to update all unread notifications", async () => {
            const mockQb = {
                update: jest.fn().mockReturnThis(),
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ affected: 3 })
            };
            notifRepo.createQueryBuilder!.mockReturnValue(mockQb);

            await service.markAllAsRead("user-1");

            expect(notifRepo.createQueryBuilder).toHaveBeenCalled();
            expect(mockQb.update).toHaveBeenCalledWith(NotificationEntity);
            expect(mockQb.set).toHaveBeenCalledWith({ isRead: true });
            expect(mockQb.where).toHaveBeenCalledWith("userId = :userId AND isRead = false", { userId: "user-1" });
            expect(mockQb.execute).toHaveBeenCalled();
        });
    });

    describe("delete", () => {
        it("should delete notification by id and userId", async () => {
            notifRepo.delete!.mockResolvedValue({ affected: 1 });

            await service.delete("user-1", "notif-1");

            expect(notifRepo.delete).toHaveBeenCalledWith({ id: "notif-1", userId: "user-1" });
        });
    });
});
