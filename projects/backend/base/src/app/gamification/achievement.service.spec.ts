import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ObjectLiteral, Repository } from "typeorm";

import { NotificationsService } from "../notifications/notifications.service";
import { PushService } from "../push/push.service";
import { AchievementService, CreateAchievementDto } from "./achievement.service";
import { AchievementEntity } from "./entities/achievement.entity";
import { UserAchievementEntity } from "./entities/user-achievement.entity";
import { UserXpEntity } from "./entities/user-xp.entity";
import { XpEventEntity } from "./entities/xp-event.entity";

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

describe("AchievementService", () => {
    let service: AchievementService;
    let achievementRepo: ReturnType<typeof createMockRepo<AchievementEntity>>;
    let userAchievementRepo: ReturnType<typeof createMockRepo<UserAchievementEntity>>;
    let xpEventRepo: ReturnType<typeof createMockRepo<XpEventEntity>>;
    let userXpRepo: ReturnType<typeof createMockRepo<UserXpEntity>>;

    const now = new Date("2026-01-01T00:00:00Z");

    const makeAchievement = (overrides: Partial<AchievementEntity> = {}): AchievementEntity =>
        ({
            id: "ach-1",
            key: "first_post",
            name: "First Post",
            description: "Create your first post",
            icon: "pi-star",
            rarity: "common",
            triggerType: "post_count",
            triggerValue: 1,
            xpReward: 50,
            category: "posts",
            isActive: true,
            createdAt: now,
            updatedAt: now,
            ...overrides
        }) as AchievementEntity;

    beforeEach(async () => {
        jest.clearAllMocks();
        achievementRepo = createMockRepo<AchievementEntity>();
        userAchievementRepo = createMockRepo<UserAchievementEntity>();
        xpEventRepo = createMockRepo<XpEventEntity>();
        userXpRepo = createMockRepo<UserXpEntity>();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AchievementService,
                { provide: getRepositoryToken(AchievementEntity), useValue: achievementRepo },
                { provide: getRepositoryToken(UserAchievementEntity), useValue: userAchievementRepo },
                { provide: getRepositoryToken(XpEventEntity), useValue: xpEventRepo },
                { provide: getRepositoryToken(UserXpEntity), useValue: userXpRepo },
                { provide: NotificationsService, useValue: { create: jest.fn() } },
                { provide: PushService, useValue: { sendToUser: jest.fn() } }
            ]
        }).compile();

        service = module.get<AchievementService>(AchievementService);
    });

    describe("getAllAchievements", () => {
        it("should return only active achievements by default", async () => {
            const achievements = [makeAchievement()];
            achievementRepo.find!.mockResolvedValue(achievements);

            const result = await service.getAllAchievements();

            expect(achievementRepo.find).toHaveBeenCalledWith({
                where: { isActive: true },
                order: { rarity: "ASC", triggerValue: "ASC" }
            });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("ach-1");
        });

        it("should include inactive achievements when flag is true", async () => {
            achievementRepo.find!.mockResolvedValue([]);

            await service.getAllAchievements(true);

            expect(achievementRepo.find).toHaveBeenCalledWith({
                where: {},
                order: { rarity: "ASC", triggerValue: "ASC" }
            });
        });
    });

    describe("createAchievement", () => {
        it("should create and save an achievement", async () => {
            const dto: CreateAchievementDto = {
                key: "first_post",
                name: "First Post",
                icon: "pi-star",
                rarity: "common",
                triggerType: "post_count",
                triggerValue: 1
            };
            const entity = makeAchievement();
            achievementRepo.create!.mockReturnValue(entity);
            achievementRepo.save!.mockResolvedValue(entity);

            const result = await service.createAchievement(dto);

            expect(achievementRepo.create).toHaveBeenCalledWith({ ...dto, isActive: true });
            expect(achievementRepo.save).toHaveBeenCalledWith(entity);
            expect(result.key).toBe("first_post");
        });

        it("should respect isActive from dto", async () => {
            const dto: CreateAchievementDto = {
                key: "hidden",
                name: "Hidden",
                icon: "pi-eye-slash",
                rarity: "legendary",
                triggerType: "post_count",
                triggerValue: 1000,
                isActive: false
            };
            const entity = makeAchievement({ isActive: false });
            achievementRepo.create!.mockReturnValue(entity);
            achievementRepo.save!.mockResolvedValue(entity);

            await service.createAchievement(dto);

            expect(achievementRepo.create).toHaveBeenCalledWith({ ...dto, isActive: false });
        });
    });

    describe("updateAchievement", () => {
        it("should update an existing achievement", async () => {
            const entity = makeAchievement();
            achievementRepo.findOneBy!.mockResolvedValue(entity);
            achievementRepo.save!.mockResolvedValue({ ...entity, name: "Updated" });

            const result = await service.updateAchievement("ach-1", { name: "Updated" });

            expect(achievementRepo.findOneBy).toHaveBeenCalledWith({ id: "ach-1" });
            expect(achievementRepo.save).toHaveBeenCalled();
            expect(result.name).toBe("Updated");
        });

        it("should throw NotFoundException when achievement not found", async () => {
            achievementRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.updateAchievement("missing", { name: "X" })).rejects.toThrow(NotFoundException);
        });
    });

    describe("deleteAchievement", () => {
        it("should delete an achievement", async () => {
            achievementRepo.delete!.mockResolvedValue({ affected: 1 });

            await service.deleteAchievement("ach-1");

            expect(achievementRepo.delete).toHaveBeenCalledWith("ach-1");
        });

        it("should throw NotFoundException when achievement not found", async () => {
            achievementRepo.delete!.mockResolvedValue({ affected: 0 });

            await expect(service.deleteAchievement("missing")).rejects.toThrow(NotFoundException);
        });
    });

    describe("getUserAchievements", () => {
        it("should return user achievements with achievement data", async () => {
            const earned = [{ userId: "user-1", achievementId: "ach-1", earnedAt: now }];
            const achievement = makeAchievement();

            userAchievementRepo.findBy!.mockResolvedValue(earned);
            achievementRepo.find!.mockResolvedValue([achievement]);

            const result = await service.getUserAchievements("user-1");

            expect(result).toHaveLength(1);
            expect(result[0].earnedAt).toBe(now.toISOString());
            expect(result[0].key).toBe("first_post");
        });

        it("should return empty array when user has no achievements", async () => {
            userAchievementRepo.findBy!.mockResolvedValue([]);

            const result = await service.getUserAchievements("user-1");

            expect(result).toEqual([]);
            expect(achievementRepo.find).not.toHaveBeenCalled();
        });

        it("should filter out achievements that no longer exist", async () => {
            const earned = [
                { userId: "user-1", achievementId: "ach-1", earnedAt: now },
                { userId: "user-1", achievementId: "ach-deleted", earnedAt: now }
            ];
            const achievement = makeAchievement();

            userAchievementRepo.findBy!.mockResolvedValue(earned);
            achievementRepo.find!.mockResolvedValue([achievement]);

            const result = await service.getUserAchievements("user-1");

            expect(result).toHaveLength(1);
        });
    });

    describe("getUserProgress", () => {
        it("should return progress for all active achievements", async () => {
            const achievement = makeAchievement({ triggerType: "post_count", triggerValue: 10 });
            achievementRepo.find!.mockResolvedValue([achievement]);
            userAchievementRepo.findBy!.mockResolvedValue([]);
            userXpRepo.findOneBy!.mockResolvedValue({ userId: "user-1", xp: 100, level: 2 });
            xpEventRepo.countBy!.mockResolvedValue(5);

            const result = await service.getUserProgress("user-1");

            expect(result).toHaveLength(1);
            expect(result[0].earned).toBe(false);
            expect(result[0].currentValue).toBe(5);
            expect(result[0].progressPercent).toBe(50);
        });

        it("should return empty array when no active achievements", async () => {
            achievementRepo.find!.mockResolvedValue([]);

            const result = await service.getUserProgress("user-1");

            expect(result).toEqual([]);
        });
    });

    describe("checkAndAward", () => {
        it("should award achievement when threshold is met", async () => {
            const achievement = makeAchievement({ triggerType: "post_count", triggerValue: 5, xpReward: 0 });
            achievementRepo.find!.mockResolvedValue([achievement]);
            userAchievementRepo.findBy!.mockResolvedValue([]);
            userXpRepo.findOneBy!.mockResolvedValue({ userId: "user-1", xp: 50, level: 1 });
            xpEventRepo.countBy!.mockResolvedValue(5);

            const createdUserAch = { userId: "user-1", achievementId: "ach-1" };
            userAchievementRepo.create!.mockReturnValue(createdUserAch);
            userAchievementRepo.save!.mockResolvedValue(createdUserAch);

            await service.checkAndAward("user-1", "create_post");

            expect(userAchievementRepo.create).toHaveBeenCalledWith({
                userId: "user-1",
                achievementId: "ach-1"
            });
            expect(userAchievementRepo.save).toHaveBeenCalledWith(createdUserAch);
        });

        it("should not award when already earned", async () => {
            const achievement = makeAchievement({ triggerType: "post_count", triggerValue: 1 });
            achievementRepo.find!.mockResolvedValue([achievement]);
            userAchievementRepo.findBy!.mockResolvedValue([
                { userId: "user-1", achievementId: "ach-1", earnedAt: now }
            ]);
            userXpRepo.findOneBy!.mockResolvedValue({ userId: "user-1", xp: 50, level: 1 });
            xpEventRepo.countBy!.mockResolvedValue(10);

            await service.checkAndAward("user-1", "create_post");

            expect(userAchievementRepo.create).not.toHaveBeenCalled();
            expect(userAchievementRepo.save).not.toHaveBeenCalled();
        });

        it("should not award when threshold is not met", async () => {
            const achievement = makeAchievement({ triggerType: "post_count", triggerValue: 100 });
            achievementRepo.find!.mockResolvedValue([achievement]);
            userAchievementRepo.findBy!.mockResolvedValue([]);
            userXpRepo.findOneBy!.mockResolvedValue({ userId: "user-1", xp: 10, level: 1 });
            xpEventRepo.countBy!.mockResolvedValue(2);

            await service.checkAndAward("user-1", "create_post");

            expect(userAchievementRepo.create).not.toHaveBeenCalled();
        });

        it("should skip when no relevant achievements exist", async () => {
            achievementRepo.find!.mockResolvedValue([]);

            await service.checkAndAward("user-1", "create_post");

            expect(userAchievementRepo.findBy).not.toHaveBeenCalled();
        });
    });
});
