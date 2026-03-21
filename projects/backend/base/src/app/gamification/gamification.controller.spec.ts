import { Test, TestingModule } from "@nestjs/testing";
import { getDataSourceToken, getRepositoryToken } from "@nestjs/typeorm";

import { NotificationsService } from "../notifications/notifications.service";
import { PushService } from "../push/push.service";
import { AchievementService } from "./achievement.service";
import { AchievementEntity } from "./entities/achievement.entity";
import { UserAchievementEntity } from "./entities/user-achievement.entity";
import { UserXpEntity } from "./entities/user-xp.entity";
import { XpConfigEntity } from "./entities/xp-config.entity";
import { XpEventEntity } from "./entities/xp-event.entity";
import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";

const mockUserXpRepo = { findOneBy: jest.fn(), find: jest.fn(), findBy: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockXpEventRepo = { create: jest.fn(), save: jest.fn() };
const mockXpConfigRepo = { find: jest.fn(), findOneBy: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockAchievementRepo = { find: jest.fn(), findOneBy: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockUserAchievementRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn()
};
const mockDataSource = { query: jest.fn().mockResolvedValue([]) };

describe("GamificationController", () => {
    let controller: GamificationController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GamificationController],
            providers: [
                GamificationService,
                AchievementService,
                { provide: getRepositoryToken(UserXpEntity), useValue: mockUserXpRepo },
                { provide: getRepositoryToken(XpEventEntity), useValue: mockXpEventRepo },
                { provide: getRepositoryToken(XpConfigEntity), useValue: mockXpConfigRepo },
                { provide: getRepositoryToken(AchievementEntity), useValue: mockAchievementRepo },
                { provide: getRepositoryToken(UserAchievementEntity), useValue: mockUserAchievementRepo },
                { provide: getDataSourceToken(), useValue: mockDataSource },
                { provide: NotificationsService, useValue: { create: jest.fn() } },
                { provide: PushService, useValue: { sendToUser: jest.fn() } }
            ]
        }).compile();

        controller = module.get<GamificationController>(GamificationController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    describe("getUserProgress", () => {
        it("should return progress for a user", async () => {
            mockUserXpRepo.findOneBy.mockResolvedValue({ userId: "u1", xp: 150, level: 2 });
            const result = await controller.getUserProgress("u1");
            expect(result).toHaveProperty("level");
            expect(result).toHaveProperty("xp");
            expect(result).toHaveProperty("levelName");
        });
    });
});
